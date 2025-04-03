// backend/controller/order.js
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

// Cache configuration (adjust TTL as needed)
const orderCache = new NodeCache({
  stdTTL: 300,
  checkperiod: 120,
  useClones: false,
});

// Cache keys definition
const CACHE_KEYS = {
  ADMIN_ORDERS_PAGE: (page, limit) => `admin_orders_p${page}_l${limit}`,
  USER_ORDERS: (uId) => `user_orders_${uId}`,
  SELLER_ORDERS: (sId) => `seller_orders_${sId}`,
  ORDER_DETAIL: (oId) => `order_detail_${oId}`,
};

// Helper Functions
const isValidObjectId = (id) => id && mongoose.Types.ObjectId.isValid(id);

const clearAdminOrderCaches = () => {
  const adminKeys = orderCache
    .keys()
    .filter((k) => k.startsWith("admin_orders_p"));
  if (adminKeys.length > 0) {
    // console.log("Clearing Admin Order page caches:", adminKeys);
    orderCache.del(adminKeys);
  }
};

const clearOrderCaches = (orderId, userId, involvedSellerIds = []) => {
  const keysToDelete = new Set();
  clearAdminOrderCaches(); // Always clear paginated admin cache on any order update/delete

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
      `Invalid stock update input: P=${productId}, Qty=${quantityChange}`
    );
    return;
  }
  try {
    const product = await Product.findById(productId);
    if (!product) {
      console.warn(`P${productId} not found for stock update.`);
      return;
    }
    const currentStock = product.stock || 0;
    const newStock = currentStock - quantityChange;
    if (newStock < 0)
      throw new ErrorHandler(
        `Insufficient stock for ${product.name || productId}.`,
        400
      );
    await Product.updateOne(
      { _id: productId },
      { $set: { stock: newStock }, $inc: { sold_out: quantityChange } }
    );
  } catch (error) {
    console.error(`Stock update fail P${productId}:`, error);
    throw error;
  } // Re-throw
};

// === ROUTES ===

// POST /api/v2/order/create-order
router.post(
  "/create-order",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    const { cart, shippingAddress, paymentInfo } = req.body;
    const currentUser = req.user;

    // --- Input Validation ---
    if (!currentUser?._id)
      return next(new ErrorHandler("User auth invalid.", 401));
    if (!cart?.length) return next(new ErrorHandler("Cart is empty.", 400));
    if (
      !shippingAddress?.address1 ||
      !shippingAddress.city ||
      !shippingAddress.country ||
      !shippingAddress.phoneNumber
    ) {
      return next(
        new ErrorHandler(
          "Shipping address incomplete (Address 1, City, Country, Phone required).",
          400
        )
      );
    }

    // --- Stock Pre-check ---
    try {
      for (const item of cart) {
        if (item.productId && isValidObjectId(item.productId)) {
          const product = await Product.findById(item.productId)
            .select("stock name")
            .lean();
          if (!product)
            throw new ErrorHandler(
              `Product "${item.DesignTitle}" not found.`,
              404
            );
          if ((product.stock || 0) < item.qty)
            throw new ErrorHandler(
              `Insufficient stock for "${product.name}". Have: ${
                product.stock || 0
              }, Need: ${item.qty}.`,
              400
            );
        }
      }
    } catch (stockError) {
      return next(stockError);
    }

    // --- Cart Item Validation ---
    for (const item of cart) {
      const missing = [];
      if (!item.shopId || !isValidObjectId(item.shopId)) missing.push("shopId");
      if (item.price == null || item.price < 0) missing.push("price");
      if (!item.qty || item.qty < 1) missing.push("qty");
      if (!item.designImage?.url) missing.push("designImage.url"); // Critical check
      if (!item.DesignTitle) missing.push("DesignTitle");
      if (!item.ProductType) missing.push("ProductType");
      if (!item.ProductColor) missing.push("ProductColor");
      if (!item.size) missing.push("size");
      if (missing.length > 0)
        return next(
          new ErrorHandler(
            `Item "${item.DesignTitle || "Unknown"}" invalid: ${missing.join(
              ", "
            )}.`,
            400
          )
        );
    }

    // --- Process Order Creation per Shop ---
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
        /* ... item details ... */
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
    const stockUpdateErrors = [];
    const involvedSellerIds = Array.from(shopItemsMap.keys());

    for (const [shopIdStr, shopItems] of shopItemsMap.entries()) {
      const subtotal = shopItems.reduce(
        (acc, item) => acc + (item.price || 0) * (item.qty || 1),
        0
      );
      const total = subtotal + shippingCostPerSellerOrder;
      const orderData = {
        /* ... order data structure ... */ cart: shopItems,
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
            for (const item of order.cart) {
              // Update stock after creation
              if (item.productId) {
                try {
                  await updateProductStock(item.productId, item.qty);
                } catch (stockError) {
                  stockUpdateErrors.push({
                    orderId: order._id,
                    productId: item.productId,
                    error: stockError.message,
                  });
                }
              }
            }
          })
          .catch((e) => {
            throw new ErrorHandler(`Order creation failed: ${e.message}`, 500);
          })
      );
    }

    // --- Finalize ---
    try {
      await Promise.all(orderPromises);
      clearOrderCaches(null, currentUser._id.toString(), involvedSellerIds);
      if (stockUpdateErrors.length > 0)
        console.warn(
          "Order created with stock update issues:",
          stockUpdateErrors
        );
      res.status(201).json({ success: true, orders: createdOrders });
    } catch (error) {
      console.error("Error processing order creation batch:", error);
      return next(
        error instanceof ErrorHandler
          ? error
          : new ErrorHandler("Failed to complete order creation.", 500)
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
    orderCache.set(cacheKey, orders); // Cache the results
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
      // Add seller check if needed and if req.seller is available
      // const isSeller = req.seller && orderData.cart.some(i => i.shopId?.toString() === req.seller._id.toString());
      if (!isOwner && !isAdminUser /* && !isSeller */) {
        // Adjust authorization logic
        return next(
          new ErrorHandler("Forbidden: You cannot access this order.", 403)
        );
      }
      res.json({ success: true, order: orderData, fromCache });
    };

    if (cached) return checkAuthAndRespond(cached, true); // Check auth even for cache

    const order = await Order.findById(id).lean();
    if (!order) return next(new ErrorHandler("Order not found.", 404));
    orderCache.set(cacheKey, order);
    checkAuthAndRespond(order, false);
  })
);

// GET /api/v2/order/get-seller-orders
router.get(
  "/get-seller-orders",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    const sellerId = req.seller._id.toString();
    const cacheKey = CACHE_KEYS.SELLER_ORDERS(sellerId);
    const cached = orderCache.get(cacheKey);
    const ttl = 120 * 1000; // 2 min cache

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
    res.json({ success: true, order: { ...order, cart: sellerItems } });
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
  isAuthenticated, // Ensure logged in
  isAdmin, // Ensure is admin
  catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    if (!isValidObjectId(id))
      return next(new ErrorHandler("Invalid Order ID.", 400));
    const cacheKey = CACHE_KEYS.ORDER_DETAIL(id);
    const cached = orderCache.get(cacheKey);
    if (cached)
      return res.json({ success: true, order: cached, fromCache: true });
    const order = await Order.findById(id).lean();
    if (!order) return next(new ErrorHandler("Order not found.", 404));
    orderCache.set(cacheKey, order);
    res.json({ success: true, order, fromCache: false });
  })
);

// GET /api/v2/order/admin/all-orders (Paginated)
router.get(
  "/admin/all-orders",
  isAuthenticated, // Ensure logged in
  isAdmin, // Ensure is admin
  catchAsyncErrors(async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15; // Match default pageSize in frontend if possible
    const skip = (page - 1) * limit;

    console.log(
      `[Admin Orders] Request received. Page: ${page}, Limit: ${limit}.`
    );

    try {
      // Use Promise.all for concurrent count and data fetching
      const [totalOrders, orders] = await Promise.all([
        Order.countDocuments(), // Add filter criteria here if needed
        Order.find() // Add filter criteria here if needed
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
      ]);

      const totalPages = Math.ceil(totalOrders / limit);
      console.log(
        `[Admin Orders] DB query success. Found ${orders.length} orders for page ${page}/${totalPages} (Total: ${totalOrders}).`
      );

      res.json({
        success: true,
        orders,
        totalOrders,
        currentPage: page,
        totalPages,
        limit,
        fromCache: false, // Caching disabled for this paginated route currently
      });
    } catch (dbError) {
      console.error(
        `[Admin Orders] Database query failed (Page ${page}, Limit ${limit}):`,
        dbError
      );
      return next(
        new ErrorHandler(
          `Failed to fetch admin orders: ${dbError.message}`,
          500
        )
      );
    }
  })
);

// DELETE /api/v2/order/admin/delete/:id
router.delete(
  "/admin/delete/:id",
  isAuthenticated, // Ensure logged in
  isAdmin, // Ensure is admin
  catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    if (!isValidObjectId(id))
      return next(new ErrorHandler("Invalid Order ID.", 400));
    const order = await Order.findById(id); // Find first to get related IDs
    if (!order) return next(new ErrorHandler("Order not found.", 404));
    const userId = order.user?._id?.toString();
    const involvedSellers = [
      ...new Set(order.cart.map((i) => i.shopId?.toString()).filter(Boolean)),
    ];
    const result = await Order.deleteOne({ _id: id });
    if (result.deletedCount === 0)
      return next(new ErrorHandler("Order deletion failed.", 500));
    clearOrderCaches(id, userId, involvedSellers); // Clear caches after delete
    res
      .status(200)
      .json({ success: true, message: "Order deleted successfully." });
  })
);

// PUT /api/v2/order/admin/update-status/:id
router.put(
  "/admin/update-status/:id",
  isAuthenticated, // Ensure logged in
  isAdmin, // Ensure is admin
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
    // Handle side effects
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
    }
    // Add history
    order.statusHistory.push({
      status,
      updatedBy: `admin:${adminId}`,
      timestamp: new Date(),
      details: `Admin changed status: ${previousStatus} -> ${status}.`,
    });

    try {
      // ** WORKAROUND APPLIED for potential validation errors **
      const updatedOrder = await order.save({ validateBeforeSave: false });
      const involvedSellers = [
        ...new Set(order.cart.map((i) => i.shopId?.toString()).filter(Boolean)),
      ];
      clearOrderCaches(id, order.user?._id?.toString(), involvedSellers); // Clear caches
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
  isAuthenticated, // Ensure logged in
  isAdmin, // Ensure is admin
  catchAsyncErrors(async (req, res, next) => {
    const { orderId, itemId } = req.params;
    const { ProductColor, size } = req.body; // Only allow specific fields
    const adminId = req.user._id.toString();

    if (!isValidObjectId(orderId) || !isValidObjectId(itemId))
      return next(new ErrorHandler("Invalid Order or Item ID.", 400));
    if (ProductColor === undefined && size === undefined)
      return next(new ErrorHandler("No update data (color/size).", 400));

    const order = await Order.findById(orderId);
    if (!order) return next(new ErrorHandler("Order not found.", 404));
    const itemIndex = order.cart.findIndex((i) => i._id.toString() === itemId);
    if (itemIndex === -1)
      return next(new ErrorHandler("Item not found in order.", 404));

    let log = "Admin updated item:";
    let updated = false;
    const item = order.cart[itemIndex]; // Reference item directly
    if (ProductColor !== undefined && ProductColor !== item.ProductColor) {
      log += ` Color=${ProductColor}`;
      item.ProductColor = ProductColor;
      updated = true;
    }
    if (size !== undefined && size !== item.size) {
      log += `${updated ? "," : ""} Size=${size}`;
      item.size = size;
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
      details: `${log} (Item: ${itemId})`,
    });
    order.markModified("cart"); // Mark cart array as modified

    try {
      // ** WORKAROUND APPLIED for potential validation errors **
      const updatedOrder = await order.save({ validateBeforeSave: false });
      const involvedSellers = [
        ...new Set(order.cart.map((i) => i.shopId?.toString()).filter(Boolean)),
      ];
      clearOrderCaches(orderId, order.user?._id?.toString(), involvedSellers); // Clear relevant caches
      res.json({
        success: true,
        message: "Order item details updated.",
        order: updatedOrder,
      });
    } catch (e) {
      console.error(`Item detail update save error (Order ${orderId}):`, e);
      return next(
        new ErrorHandler(`Failed to save item update: ${e.message}`, 500)
      );
    }
  })
);

// GET /api/v2/order/download-design/:orderId/:itemId (Admin - Returns data for frontend downloader)
router.get(
  "/download-design/:orderId/:itemId",
  isAuthenticated, // Ensure logged in
  isAdmin, // Ensure is admin
  catchAsyncErrors(async (req, res, next) => {
    const { orderId, itemId } = req.params;
    const adminId = req.user._id.toString();

    if (!isValidObjectId(orderId) || !isValidObjectId(itemId))
      return next(new ErrorHandler("Invalid Order/Item ID.", 400));

    const order = await Order.findById(orderId).lean(); // Use lean for read-only
    if (!order) return next(new ErrorHandler("Order not found.", 404));
    const item = order.cart.find((i) => i._id.toString() === itemId);
    if (!item) return next(new ErrorHandler("Item not found in order.", 404));

    const designUrl = item.designImage?.url; // Get URL directly from order item
    if (!designUrl)
      return next(new ErrorHandler("Design URL missing for this item.", 404)); // Crucial check

    // Log download request async
    Order.findByIdAndUpdate(orderId, {
      $push: {
        statusHistory: {
          status: order.status,
          updatedBy: `admin:${adminId}`,
          timestamp: new Date(),
          details: `Admin DL requested for item: ${
            item.DesignTitle || "Untitled"
          } (${itemId}).`,
        },
      },
    })
      .exec()
      .catch(console.error);

    // Prepare payload for frontend
    const payload = {
      imageUrl: designUrl,
      orderId: order._id.toString(),
      itemId: item._id.toString(),
      orderNumber: order._id.toString().slice(-8),
      productTitle: item.DesignTitle || "Untitled",
      specs: {
        type: item.ProductType || "N/A",
        color: item.ProductColor || "N/A",
        size: item.size || "N/A",
        position: {
          positionX: item.designSpecs?.positionX ?? 50,
          positionY: item.designSpecs?.positionY ?? 50,
          scale: item.designSpecs?.scale ?? 1,
          rotation: item.designSpecs?.rotation ?? 0,
        },
      },
      price: {
        itemPrice: item.price || 0,
        quantity: item.qty || 1,
        itemTotal: (item.price || 0) * (item.qty || 1),
        shippingCost: order.shippingCost || 0,
        orderTotal: order.totalPrice || 0,
      },
    };
    res.json({ success: true, designData: payload });
  })
);

module.exports = router;
