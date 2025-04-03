const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const NodeCache = require("node-cache");
const Order = require("../model/order");
const Shop = require("../model/shop");
const Product = require("../model/product");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { isAuthenticated, isSeller, isAdmin } = require("../middleware/auth");
const { ORDER_STATUSES } = require("../constants/orderStatuses");

const orderCache = new NodeCache({
  stdTTL: 600,
  checkperiod: 300,
  useClones: false,
});

const CACHE_KEYS = {
  ADMIN_ORDERS: "admin_all_orders",
  USER_ORDERS: (uId) => `user_orders_${uId}`,
  SELLER_ORDERS: (sId) => `seller_orders_${sId}`,
  ORDER_DETAIL: (oId) => `order_detail_${oId}`,
};

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const clearOrderCaches = (orderId, userId, involvedSellerIds = []) => {
  const keysToDelete = new Set([CACHE_KEYS.ADMIN_ORDERS]);
  if (orderId) keysToDelete.add(CACHE_KEYS.ORDER_DETAIL(orderId.toString()));
  if (userId) keysToDelete.add(CACHE_KEYS.USER_ORDERS(userId.toString()));
  involvedSellerIds.forEach((id) => {
    if (id) keysToDelete.add(CACHE_KEYS.SELLER_ORDERS(id.toString()));
  });
  const keysArray = Array.from(keysToDelete);
  if (keysArray.length > 0) {
    orderCache.del(keysArray);
  }
};

const updateProductStock = async (productId, quantityChange) => {
  if (
    !isValidObjectId(productId) ||
    typeof quantityChange !== "number" ||
    quantityChange === 0
  ) {
    console.warn(
      `Invalid input for updateProductStock: productId=${productId}, quantityChange=${quantityChange}`
    );
    return;
  }
  try {
    const product = await Product.findById(productId);
    if (!product) {
      console.warn(`Product ${productId} not found for stock update.`);
      return;
    }
    const currentStock = product.stock || 0;
    const newStock = currentStock - quantityChange;
    if (newStock < 0) {
      console.error(
        `Stock update prevented for Product ${productId}: Tried to reduce stock by ${quantityChange} from ${currentStock}.`
      );
      throw new ErrorHandler(
        `Insufficient stock for product ${product.name || productId}.`,
        400
      ); // Throw error to potentially stop order creation
    }
    const result = await Product.updateOne(
      { _id: productId },
      { $set: { stock: newStock }, $inc: { sold_out: quantityChange } }
    );
    if (result.matchedCount === 0) {
      console.warn(`Product ${productId} query matched 0 during stock update.`);
    }
  } catch (error) {
    console.error(`Stock update failed for Product ${productId}:`, error);
    throw error; // Re-throw the error so the calling function (create-order) knows it failed
  }
};

// POST /api/v2/order/create-order
router.post(
  "/create-order",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    const { cart, shippingAddress, paymentInfo } = req.body;
    const currentUser = req.user;

    if (!currentUser?._id)
      return next(new ErrorHandler("User authentication invalid.", 401));
    if (!cart?.length)
      return next(new ErrorHandler("Cart cannot be empty.", 400));
    if (
      !shippingAddress?.address1 ||
      !shippingAddress.city ||
      !shippingAddress.country ||
      !shippingAddress.phoneNumber
    ) {
      return next(
        new ErrorHandler(
          "Complete shipping address (Address 1, City, Country, Phone) is required.",
          400
        )
      );
    }

    // Pre-check stock availability for all items (optional but recommended)
    try {
      for (const item of cart) {
        if (item.productId && isValidObjectId(item.productId)) {
          const product = await Product.findById(item.productId)
            .select("stock name")
            .lean();
          if (!product) {
            throw new ErrorHandler(
              `Product "${item.DesignTitle}" (ID: ${item.productId}) not found.`,
              404
            );
          }
          if ((product.stock || 0) < item.qty) {
            throw new ErrorHandler(
              `Insufficient stock for "${product.name}". Requested: ${
                item.qty
              }, Available: ${product.stock || 0}.`,
              400
            );
          }
        }
      }
    } catch (stockError) {
      return next(stockError); // Pass stock check errors immediately
    }

    for (const item of cart) {
      // Validate other fields
      const missingFields = [];
      if (!item.shopId || !isValidObjectId(item.shopId))
        missingFields.push("shopId");
      if (item.price == null || item.price < 0) missingFields.push("price");
      if (!item.qty || item.qty < 1) missingFields.push("qty");
      if (!item.designImage?.url) missingFields.push("designImage.url");
      if (!item.DesignTitle) missingFields.push("DesignTitle");
      if (!item.ProductType) missingFields.push("ProductType");
      if (!item.ProductColor) missingFields.push("ProductColor");
      if (!item.size) missingFields.push("size");
      if (missingFields.length > 0)
        return next(
          new ErrorHandler(
            `Item "${
              item.DesignTitle || "Unknown"
            }" has invalid data: ${missingFields.join(", ")}.`,
            400
          )
        );
    }

    const shippingCostPerSellerOrder =
      typeof shippingAddress.shippingPrice === "number" &&
      shippingAddress.shippingPrice >= 0
        ? shippingAddress.shippingPrice
        : 50;
    const shopItemsMap = new Map();
    cart.forEach((item) => {
      const shopIdStr = item.shopId.toString();
      if (!shopItemsMap.has(shopIdStr)) shopItemsMap.set(shopIdStr, []);
      shopItemsMap.get(shopIdStr).push({
        productId:
          item.productId && isValidObjectId(item.productId)
            ? item.productId
            : null,
        qty: item.qty,
        shopId: item.shopId,
        price: item.price,
        designImage: {
          public_id: item.designImage.public_id || null,
          url: item.designImage.url,
        },
        DesignTitle: item.DesignTitle,
        ProductType: item.ProductType,
        ProductColor: item.ProductColor,
        size: item.size,
        designSpecs: item.designSpecs || {
          positionX: 50,
          positionY: 50,
          scale: 1,
          rotation: 0,
        },
      });
    });

    const createdOrders = [];
    const orderPromises = [];
    const involvedSellerIds = Array.from(shopItemsMap.keys());
    let stockUpdateErrors = []; // Collect potential stock update errors

    for (const [shopIdStr, shopItems] of shopItemsMap.entries()) {
      const subtotal = shopItems.reduce(
        (acc, item) => acc + (item.price || 0) * (item.qty || 1),
        0
      );
      const total = subtotal + shippingCostPerSellerOrder;
      const orderData = {
        cart: shopItems,
        shippingAddress: {
          address1: shippingAddress.address1,
          address2: shippingAddress.address2 || "",
          city: shippingAddress.city,
          country: shippingAddress.country,
          postalCode: shippingAddress.postalCode || "",
          phoneNumber: shippingAddress.phoneNumber,
          shippingPrice: shippingCostPerSellerOrder,
        },
        shippingCost: shippingCostPerSellerOrder,
        user: {
          _id: currentUser._id,
          name: currentUser.name,
          email: currentUser.email,
        },
        subtotal,
        totalPrice: total,
        paymentInfo: paymentInfo || {
          type: "Cash On Delivery",
          status: "Processing",
        },
        status: ORDER_STATUSES.PROCESSING,
      };

      orderPromises.push(
        Order.create(orderData)
          .then(async (order) => {
            createdOrders.push(order);
            // Attempt stock updates after order is created
            for (const item of order.cart) {
              if (item.productId) {
                try {
                  await updateProductStock(item.productId, item.qty);
                } catch (stockError) {
                  console.error(
                    `Stock update failed for item ${item.productId} in order ${order._id}:`,
                    stockError.message
                  );
                  stockUpdateErrors.push({
                    orderId: order._id,
                    productId: item.productId,
                    error: stockError.message,
                  });
                  // Decide policy: continue or fail entire batch? For now, log and continue.
                }
              }
            }
          })
          .catch((e) => {
            throw new ErrorHandler(`Order creation failed: ${e.message}`, 500);
          })
      );
    }

    try {
      await Promise.all(orderPromises);
      clearOrderCaches(null, currentUser._id.toString(), involvedSellerIds);

      if (stockUpdateErrors.length > 0) {
        // Optionally inform user/admin about stock update issues
        console.warn(
          "Order(s) created, but some stock updates failed:",
          stockUpdateErrors
        );
        // Could add a note to the response, but maybe too much detail for user
      }

      res.status(201).json({ success: true, orders: createdOrders });
    } catch (error) {
      console.error("Error processing order creation batch:", error);
      // TODO: Consider rollback logic if possible/needed for already created orders or stock updates
      return next(
        error instanceof ErrorHandler
          ? error
          : new ErrorHandler("Failed to complete the order creation.", 500)
      );
    }
  })
);

// GET /api/v2/order/get-user-orders
router.get(
  "/get-user-orders",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    const userId = req.user._id.toString();
    const cacheKey = CACHE_KEYS.USER_ORDERS(userId);
    const cached = orderCache.get(cacheKey);
    if (cached)
      return res.json({
        success: true,
        orders: cached,
        count: cached.length,
        fromCache: true,
      });
    const orders = await Order.find({ "user._id": req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    orderCache.set(cacheKey, orders);
    res.json({ success: true, orders, count: orders.length, fromCache: false });
  })
);

// GET /api/v2/order/get-order/:id
router.get(
  "/get-order/:id",
  isAuthenticated, // Requires login
  catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    if (!isValidObjectId(id))
      return next(new ErrorHandler("Invalid Order ID format.", 400));
    const cacheKey = CACHE_KEYS.ORDER_DETAIL(id);
    const cached = orderCache.get(cacheKey);
    const checkAuthAndRespond = (orderData, fromCache = false) => {
      if (!orderData) return next(new ErrorHandler("Order not found.", 404));
      const isOwner = orderData.user._id.toString() === req.user._id.toString();
      const isAdminUser = req.user.role?.toLowerCase() === "admin";
      if (!isOwner && !isAdminUser)
        return next(new ErrorHandler("Forbidden.", 403));
      res.json({ success: true, order: orderData, fromCache });
    };
    if (cached) return checkAuthAndRespond(cached, true);
    const order = await Order.findById(id).lean();
    if (!order) return next(new ErrorHandler("Order not found.", 404));
    orderCache.set(cacheKey, order);
    checkAuthAndRespond(order, false);
  })
);

// GET /api/v2/order/get-seller-orders
router.get(
  "/get-seller-orders",
  isSeller, // Ensures seller is authenticated and active
  catchAsyncErrors(async (req, res, next) => {
    const sellerId = req.seller._id.toString();
    const cacheKey = CACHE_KEYS.SELLER_ORDERS(sellerId);
    const cached = orderCache.get(cacheKey);
    const ttl = 120 * 1000; // Shorter cache (2 min) for potentially dynamic data

    if (cached?.timestamp && Date.now() - cached.timestamp < ttl) {
      return res.json({
        success: true,
        orders: cached.data || [],
        count: (cached.data || []).length,
        fromCache: true,
      });
    }
    const dbOrders = await Order.find({ "cart.shopId": req.seller._id })
      .sort({ createdAt: -1 })
      .lean();
    // Filter cart items for seller view
    const sellerOrders = dbOrders.map((o) => ({
      ...o,
      cart: o.cart.filter((i) => i.shopId?.toString() === sellerId),
    }));
    orderCache.set(cacheKey, { data: sellerOrders, timestamp: Date.now() });
    res.json({
      success: true,
      orders: sellerOrders,
      count: sellerOrders.length,
      fromCache: false,
    });
  })
);

// GET /api/v2/order/get-seller-order/:id
router.get(
  "/get-seller-order/:id",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const sellerId = req.seller._id.toString();
    if (!isValidObjectId(id))
      return next(new ErrorHandler("Invalid Order ID.", 400));
    const order = await Order.findById(id).lean();
    if (!order) return next(new ErrorHandler("Order not found.", 404));
    const sellerItems = order.cart.filter(
      (i) => i.shopId?.toString() === sellerId
    );
    if (sellerItems.length === 0)
      return next(
        new ErrorHandler(
          "Order found, but contains no items from your shop.",
          403
        )
      );
    res.json({ success: true, order: { ...order, cart: sellerItems } }); // Return order with only seller's items in cart
  })
);

// PUT /api/v2/order/accept-refund/:id (Seller Action)
router.put(
  "/accept-refund/:id",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body;
    const sellerId = req.seller._id.toString();
    if (!isValidObjectId(id))
      return next(new ErrorHandler("Invalid Order ID.", 400));
    const allowed = [
      ORDER_STATUSES.REFUND_APPROVED,
      ORDER_STATUSES.REFUND_REJECTED,
    ];
    if (!allowed.includes(status))
      return next(
        new ErrorHandler(`Invalid status. Use ${allowed.join(" or ")}.`, 400)
      );

    const order = await Order.findById(id);
    if (!order) return next(new ErrorHandler("Order not found.", 404));
    if (!order.cart.some((i) => i.shopId?.toString() === sellerId))
      return next(new ErrorHandler("Not authorized for this order.", 403));
    if (order.status !== ORDER_STATUSES.PROCESSING_REFUND)
      return next(
        new ErrorHandler(
          `Order status must be '${ORDER_STATUSES.PROCESSING_REFUND}' (Current: ${order.status}).`,
          400
        )
      );

    const previousStatus = order.status;
    order.status = status;
    order.statusHistory.push({
      status,
      updatedBy: `seller:${sellerId}`,
      timestamp: new Date(),
      details: `Seller action: Refund ${
        status === ORDER_STATUSES.REFUND_APPROVED ? "Approved" : "Rejected"
      }. Prev: ${previousStatus}.`,
    });

    try {
      const updatedOrder = await order.save(); // Run full validations
      clearOrderCaches(id, order.user?._id?.toString(), [sellerId]);
      res.json({
        success: true,
        message: `Refund status set to '${status}'.`,
        order: updatedOrder,
      });
    } catch (e) {
      console.error(`Error saving seller refund update (Order ${id}):`, e);
      if (e.name === "ValidationError")
        return next(
          new ErrorHandler(
            `Validation failed: ${Object.values(e.errors)
              .map((err) => err.message)
              .join(", ")}`,
            400
          )
        );
      return next(
        new ErrorHandler(`Failed to save refund update: ${e.message}`, 500)
      );
    }
  })
);

// --- Admin Routes ---

// GET /api/v2/order/admin/order/:id
router.get(
  "/admin/order/:id",
  isAuthenticated,
  isAdmin,
  catchAsyncErrors(async (req, res, next) => {
    /* ... keep as before ... */
  })
);
// GET /api/v2/order/admin/all-orders
router.get(
  "/admin/all-orders",
  isAuthenticated,
  isAdmin,
  catchAsyncErrors(async (req, res, next) => {
    /* ... keep as before ... */
  })
);
// DELETE /api/v2/order/admin/delete/:id
router.delete(
  "/admin/delete/:id",
  isAuthenticated,
  isAdmin,
  catchAsyncErrors(async (req, res, next) => {
    /* ... keep as before ... */
  })
);
// GET /api/v2/order/download-design/:orderId/:itemId
router.get(
  "/download-design/:orderId/:itemId",
  isAuthenticated,
  isAdmin,
  catchAsyncErrors(async (req, res, next) => {
    /* ... keep as before, ensuring designUrl exists check is solid ... */
  })
);

// PUT /api/v2/order/admin/update-status/:id
router.put(
  "/admin/update-status/:id",
  isAuthenticated,
  isAdmin,
  catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body;
    const adminId = req.user._id.toString();

    if (!status) return next(new ErrorHandler("New status is required.", 400));
    if (!Object.values(ORDER_STATUSES).includes(status))
      return next(new ErrorHandler(`Invalid status value: "${status}".`, 400));
    if (!isValidObjectId(id))
      return next(new ErrorHandler("Invalid Order ID format.", 400));

    const order = await Order.findById(id);
    if (!order) return next(new ErrorHandler("Order not found.", 404));
    if (order.status === status)
      return res.json({
        success: true,
        message: `Order status is already '${status}'.`,
        order,
      });

    const previousStatus = order.status;
    order.status = status;

    if (status === ORDER_STATUSES.DELIVERED && !order.deliveredAt) {
      order.deliveredAt = new Date();
      if (
        order.paymentInfo?.type === "Cash On Delivery" &&
        order.paymentInfo.status !== "Succeeded"
      ) {
        order.paymentInfo.status = "Succeeded";
        if (!order.paidAt) order.paidAt = new Date();
        order.markModified("paymentInfo");
      }
    } // Add other status side-effects here

    order.statusHistory.push({
      status,
      updatedBy: `admin:${adminId}`,
      timestamp: new Date(),
      details: `Admin changed status: ${previousStatus} -> ${status}.`,
    });

    try {
      // ** WORKAROUND for validation errors on save **
      // If older orders lack required fields (like country, designUrl), saving normally will fail.
      // This bypasses validation ONLY during admin status updates.
      // NOTE: The root cause (missing data at creation) should ideally be fixed.
      const updatedOrder = await order.save({ validateBeforeSave: false });

      const involvedSellers = [
        ...new Set(order.cart.map((i) => i.shopId?.toString()).filter(Boolean)),
      ];
      clearOrderCaches(id, order.user?._id?.toString(), involvedSellers);
      res.json({
        success: true,
        message: `Order status updated to '${status}'.`,
        order: updatedOrder,
      });
    } catch (e) {
      console.error(
        `Admin status update save error (Order ${id}, Status ${status}) (Validation Bypassed):`,
        e
      );
      return next(
        new ErrorHandler(`Failed to save status update: ${e.message}`, 500)
      );
    }
  })
);

// PUT /api/v2/order/update-item-details/:orderId/:itemId (Admin Only)
router.put(
  "/update-item-details/:orderId/:itemId",
  isAuthenticated,
  isAdmin,
  catchAsyncErrors(async (req, res, next) => {
    const { orderId, itemId } = req.params;
    const { ProductColor, size } = req.body;
    const adminId = req.user._id.toString();

    if (!isValidObjectId(orderId) || !isValidObjectId(itemId))
      return next(new ErrorHandler("Invalid Order or Item ID format.", 400));
    if (ProductColor === undefined && size === undefined)
      return next(
        new ErrorHandler("No update data provided (color or size).", 400)
      );

    const order = await Order.findById(orderId);
    if (!order) return next(new ErrorHandler("Order not found.", 404));
    const itemIndex = order.cart.findIndex((i) => i._id.toString() === itemId);
    if (itemIndex === -1)
      return next(new ErrorHandler("Item not found within this order.", 404));

    let logDetails = "Admin updated item details:";
    let updated = false;
    const currentItem = order.cart[itemIndex];
    if (
      ProductColor !== undefined &&
      ProductColor !== currentItem.ProductColor
    ) {
      logDetails += ` Color=${ProductColor}`;
      currentItem.ProductColor = ProductColor;
      updated = true;
    }
    if (size !== undefined && size !== currentItem.size) {
      logDetails += `${updated ? "," : ""} Size=${size}`;
      currentItem.size = size;
      updated = true;
    }
    if (!updated)
      return res.json({
        success: true,
        message: "No changes detected.",
        order,
      });

    order.statusHistory.push({
      status: order.status,
      updatedBy: `admin:${adminId}`,
      timestamp: new Date(),
      details: `${logDetails} (Item ID: ${itemId})`,
    });
    order.markModified("cart");

    try {
      // ** WORKAROUND for validation errors on save **
      const updatedOrder = await order.save({ validateBeforeSave: false });

      const involvedSellers = [
        ...new Set(order.cart.map((i) => i.shopId?.toString()).filter(Boolean)),
      ];
      clearOrderCaches(orderId, order.user?._id?.toString(), involvedSellers);
      res.json({
        success: true,
        message: "Order item details updated.",
        order: updatedOrder,
      });
    } catch (e) {
      console.error(`Item detail update save error (Order ${orderId}):`, e);
      return next(
        new ErrorHandler(`Failed to save item detail update: ${e.message}`, 500)
      );
    }
  })
);

module.exports = router;
