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
  stdTTL: 300,
  checkperiod: 120,
  useClones: false,
});

const CACHE_KEYS = {
  ADMIN_ORDERS_PAGE: (page, limit) => `admin_orders_p${page}_l${limit}`,
  USER_ORDERS: (userId) => `user_orders_${userId}`,
  SELLER_ORDERS: (sellerId) => `seller_orders_${sellerId}`,
  ORDER_DETAIL: (orderId) => `order_detail_${orderId}`,
};

const isValidObjectId = (id) => id && mongoose.Types.ObjectId.isValid(id);

const clearAdminOrderPageCaches = () => {
  const adminKeys = orderCache
    .keys()
    .filter((k) => k.startsWith("admin_orders_p"));
  if (adminKeys.length > 0) {
    orderCache.del(adminKeys);
    console.log("[Cache] Cleared admin order page caches:", adminKeys);
  }
};

const clearRelevantOrderCaches = (orderId, userId, involvedSellerIds = []) => {
  const keysToDelete = new Set();

  clearAdminOrderPageCaches();

  if (orderId && isValidObjectId(orderId))
    keysToDelete.add(CACHE_KEYS.ORDER_DETAIL(orderId.toString()));
  if (userId && isValidObjectId(userId))
    keysToDelete.add(CACHE_KEYS.USER_ORDERS(userId.toString()));

  involvedSellerIds.forEach((id) => {
    const sellerIdString = id?._id
      ? id._id.toString()
      : typeof id === "string" && isValidObjectId(id)
      ? id
      : null;
    if (sellerIdString) {
      keysToDelete.add(CACHE_KEYS.SELLER_ORDERS(sellerIdString));
    }
  });

  const keysArray = Array.from(keysToDelete);
  if (keysArray.length > 0) {
    orderCache.del(keysArray);
    console.log("[Cache] Cleared relevant caches:", keysArray);
  } else {
    console.log(
      "[Cache] No specific order/user/seller caches needed clearing beyond admin pages."
    );
  }
};

const updateProductStock = async (productId, quantityChange) => {
  if (!isValidObjectId(productId) || typeof quantityChange !== "number") {
    console.warn(
      `Invalid stock update input: P=${productId}, Qty=${quantityChange}`
    );
    return;
  }
  if (quantityChange <= 0) return;

  try {
    const product = await Product.findById(productId).select("stock name");
    if (!product) {
      console.warn(`Product ${productId} not found for stock update.`);
      return;
    }

    const currentStock = product.stock || 0;
    const newStock = currentStock - quantityChange;

    if (newStock < 0) {
      console.error(
        `Stock Update Error: Insufficient stock for ${
          product.name || productId
        }. Have: ${currentStock}, Need: ${quantityChange}. Setting stock to 0.`
      );
      await Product.findByIdAndUpdate(productId, { $set: { stock: 0 } });
    } else {
      await Product.findByIdAndUpdate(productId, {
        $inc: { stock: -quantityChange },
      });
      console.log(
        `Stock updated for ${
          product.name || productId
        }: ${currentStock} -> ${newStock}`
      );
    }
  } catch (error) {
    console.error(`Error updating stock for Product ${productId}:`, error);
  }
};

router.post(
  "/create-order",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    const { cart, shippingAddress, paymentInfo } = req.body;
    const currentUser = req.user;

    if (!currentUser?._id || !isValidObjectId(currentUser._id)) {
      return next(new ErrorHandler("User authentication is invalid.", 401));
    }
    if (!Array.isArray(cart) || cart.length === 0) {
      return next(new ErrorHandler("Cart is empty.", 400));
    }
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

    try {
      for (const item of cart) {
        const missing = [];
        if (!item.shopId || !isValidObjectId(item.shopId))
          missing.push("shopId");
        if (item.price == null || item.price < 0) missing.push("price");
        if (!item.qty || item.qty < 1) missing.push("qty");
        if (!item.designImage?.url) missing.push("designImage.url");
        if (!item.DesignTitle) missing.push("DesignTitle");
        if (!item.ProductType) missing.push("ProductType");
        if (!item.ProductColor) missing.push("ProductColor");
        if (!item.size) missing.push("size");
        if (missing.length > 0) {
          throw new ErrorHandler(
            `Item "${
              item.DesignTitle || "Unknown"
            }" is invalid or missing: ${missing.join(", ")}.`,
            400
          );
        }

        if (item.productId && isValidObjectId(item.productId)) {
          const product = await Product.findById(item.productId)
            .select("stock name")
            .lean();
          if (!product) {
            console.warn(
              `Product reference invalid for item "${item.DesignTitle}". Skipping stock check.`
            );
          } else if ((product.stock || 0) < item.qty) {
            throw new ErrorHandler(
              `Insufficient stock for "${product.name}". Available: ${
                product.stock || 0
              }, Requested: ${item.qty}.`,
              400
            );
          }
        }
      }
    } catch (validationOrStockError) {
      return next(validationOrStockError);
    }

    const shopItemsMap = new Map();
    cart.forEach((item) => {
      const shopIdStr = item.shopId.toString();
      if (!shopItemsMap.has(shopIdStr)) shopItemsMap.set(shopIdStr, []);

      shopItemsMap.get(shopIdStr).push({
        productId:
          item.productId && isValidObjectId(item.productId)
            ? item.productId
            : null,
        qty: item.qty || 1,
        shopId: item.shopId,
        price: item.price || 0,
        designImage: {
          public_id: item.designImage?.public_id || null,
          url: item.designImage?.url,
        },
        DesignTitle: item.DesignTitle || "Untitled Design",
        ProductType: item.ProductType || "Unknown Type",
        ProductColor: item.ProductColor || "White",
        size: item.size || "One Size",
        designSpecs: item.designSpecs || {
          positionX: 50,
          positionY: 50,
          scale: 1,
          rotation: 0,
        },
      });
    });

    const shippingCostPerSellerOrder =
      typeof shippingAddress.shippingPrice === "number" &&
      shippingAddress.shippingPrice >= 0
        ? shippingAddress.shippingPrice
        : 50;

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
        subtotal: subtotal,
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
              if (item.productId) {
                try {
                  await updateProductStock(item.productId, item.qty);
                } catch (stockError) {
                  console.error(
                    `Stock update failed post-order creation for order ${order._id}, product ${item.productId}:`,
                    stockError.message
                  );
                  stockUpdateErrors.push({
                    orderId: order._id,
                    productId: item.productId,
                    error: stockError.message,
                  });
                }
              }
            }
          })
          .catch((creationError) => {
            console.error(
              `Failed to create order part for shop ${shopIdStr}:`,
              creationError
            );
            throw new ErrorHandler(
              `Order creation failed for shop ${shopIdStr}: ${creationError.message}`,
              500
            );
          })
      );
    }

    try {
      await Promise.all(orderPromises);

      clearRelevantOrderCaches(
        null,
        currentUser._id.toString(),
        involvedSellerIds
      );

      if (stockUpdateErrors.length > 0) {
        console.warn(
          "Order created successfully, but with some stock update issues:",
          stockUpdateErrors
        );
      }

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

router.get(
  "/get-user-orders",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    if (!req.user?._id || !isValidObjectId(req.user._id)) {
      return next(new ErrorHandler("Invalid user authentication.", 401));
    }
    const userId = req.user._id;
    const userIdString = userId.toString();
    const cacheKey = CACHE_KEYS.USER_ORDERS(userIdString);
    const cachedOrders = orderCache.get(cacheKey);

    if (cachedOrders) {
      console.log(`[Cache Hit] User orders for ${userIdString}`);
      res.setHeader(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, private"
      );
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      return res.json({
        success: true,
        orders: cachedOrders,
        count: cachedOrders.length,
        fromCache: true,
      });
    }

    console.log(
      `[Cache Miss] Fetching user orders for ${userIdString} from DB using ObjectId: ${userId}`
    );
    const orders = await Order.find({ "user._id": userId })
      .sort({ createdAt: -1 })
      .lean();

    if (orders.length === 0) {
      console.log(`No orders found for user ID: ${userIdString}.`);
      const totalOrders = await Order.countDocuments();
      console.log(`Total orders in system: ${totalOrders}`);
    }

    orderCache.set(cacheKey, orders);

    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, private"
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    res.json({ success: true, orders, count: orders.length, fromCache: false });
  })
);

router.get(
  "/get-order/:id",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return next(new ErrorHandler("Invalid Order ID format.", 400));
    }

    const cacheKey = CACHE_KEYS.ORDER_DETAIL(id);
    const cachedOrder = orderCache.get(cacheKey);

    const checkAuthAndRespond = (orderData, fromCache = false) => {
      if (!orderData) {
        return next(new ErrorHandler("Order not found.", 404));
      }

      if (!req.user?._id) {
        console.error(
          "CRITICAL: req.user not populated in get-order/:id route after isAuthenticated."
        );
        return next(new ErrorHandler("Authentication error.", 500));
      }

      const userId = req.user._id.toString();
      const orderUserId = orderData.user?._id?.toString();

      const isOwner = orderUserId === userId;
      const isAdminUser = req.user.role?.toLowerCase() === "admin";

      if (!isOwner && !isAdminUser) {
        return next(
          new ErrorHandler("Forbidden: You cannot access this order.", 403)
        );
      }

      res.setHeader(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, private"
      );
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");

      res.json({ success: true, order: orderData, fromCache });
    };

    if (cachedOrder) {
      console.log(`[Cache Hit] Order detail for ${id}`);
      return checkAuthAndRespond(cachedOrder, true);
    }

    console.log(`[Cache Miss] Fetching order detail for ${id} from DB`);
    const order = await Order.findById(id).lean();

    if (order) {
      orderCache.set(cacheKey, order);
    }

    checkAuthAndRespond(order, false);
  })
);

router.get(
  "/get-seller-orders",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    if (!req.seller?._id || !isValidObjectId(req.seller._id)) {
      return next(new ErrorHandler("Invalid seller authentication.", 401));
    }
    const sellerId = req.seller._id;
    const sellerIdString = sellerId.toString();
    const cacheKey = CACHE_KEYS.SELLER_ORDERS(sellerIdString);
    const cachedData = orderCache.get(cacheKey);
    const cacheTTLms = 120 * 1000;

    if (cachedData && Date.now() - (cachedData.timestamp || 0) < cacheTTLms) {
      console.log(`[Cache Hit] Seller orders for ${sellerIdString}`);
      res.setHeader(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, private"
      );
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      return res.json({
        success: true,
        orders: cachedData.data || [],
        count: (cachedData.data || []).length,
        fromCache: true,
      });
    }

    console.log(
      `[Cache Miss] Fetching seller orders for ${sellerIdString} from DB`
    );
    const dbOrders = await Order.find({ "cart.shopId": sellerId })
      .sort({ createdAt: -1 })
      .lean();

    const sellerOrders = dbOrders.map((order) => ({
      ...order,
      cart: order.cart.filter(
        (item) => item.shopId?.toString() === sellerIdString
      ),
    }));

    orderCache.set(cacheKey, { data: sellerOrders, timestamp: Date.now() });

    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, private"
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    res.json({
      success: true,
      orders: sellerOrders,
      count: sellerOrders.length,
      fromCache: false,
    });
  })
);

router.put(
  "/accept-refund/:id",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const { status: newStatus } = req.body;
    if (!req.seller?._id || !isValidObjectId(req.seller._id)) {
      return next(new ErrorHandler("Invalid seller authentication.", 401));
    }
    const sellerId = req.seller._id.toString();

    if (!isValidObjectId(id)) {
      return next(new ErrorHandler("Invalid Order ID format.", 400));
    }

    const allowedStatuses = [
      ORDER_STATUSES.REFUND_APPROVED,
      ORDER_STATUSES.REFUND_REJECTED,
    ];
    if (!newStatus || !allowedStatuses.includes(newStatus)) {
      return next(
        new ErrorHandler(
          `Invalid or missing status provided. Must be one of: ${allowedStatuses.join(
            ", "
          )}.`,
          400
        )
      );
    }

    const order = await Order.findById(id);
    if (!order) {
      return next(new ErrorHandler("Order not found.", 404));
    }

    const isSellerAssociated = order.cart.some(
      (item) => item.shopId?.toString() === sellerId
    );
    if (!isSellerAssociated) {
      return next(
        new ErrorHandler(
          "You are not authorized to update this order's refund status.",
          403
        )
      );
    }

    if (order.status !== ORDER_STATUSES.PROCESSING_REFUND) {
      return next(
        new ErrorHandler(
          `Refund action failed. Order status must be '${ORDER_STATUSES.PROCESSING_REFUND}' (Current: ${order.status}).`,
          400
        )
      );
    }

    const previousStatus = order.status;
    order.status = newStatus;
    order.statusHistory.push({
      status: newStatus,
      updatedBy: `seller:${sellerId}`,
      timestamp: new Date(),
      details: `Seller action: Refund ${
        newStatus === ORDER_STATUSES.REFUND_APPROVED ? "Approved" : "Rejected"
      }. Previous status: ${previousStatus}.`,
    });

    try {
      const updatedOrder = await order.save();
      clearRelevantOrderCaches(id, order.user?._id, [sellerId]);

      res.json({
        success: true,
        message: `Refund status successfully updated to '${newStatus}'.`,
        order: updatedOrder,
      });
    } catch (e) {
      console.error(`Error saving seller refund update (Order ${id}):`, e);
      if (e.name === "ValidationError") {
        const messages = Object.values(e.errors)
          .map((err) => err.message)
          .join(", ");
        return next(new ErrorHandler(`Validation failed: ${messages}`, 400));
      }
      return next(
        new ErrorHandler(
          `Failed to save refund status update: ${e.message}`,
          500
        )
      );
    }
  })
);

router.get(
  "/admin-all-orders",
  isAuthenticated,
  isAdmin,
  catchAsyncErrors(async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    console.log(`[Admin API] Fetching orders page ${page}, limit ${limit}`);
    try {
      const [totalOrders, orders] = await Promise.all([
        Order.countDocuments(),
        Order.find()
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .select("-__v")
          .lean(),
      ]);

      if (orders.length > 0) {
        const sample = orders[0];
        console.log(`[Admin API] First order sample (Page ${page}):`, {
          _id: sample._id,
          status: sample.status,
          createdAt: sample.createdAt,
          hasUserData: !!sample.user,
          userName: sample.user?.name || "MISSING",
          userEmail: sample.user?.email || "MISSING",
          cartItemCount: sample.cart?.length || 0,
        });
      }

      const totalPages = Math.ceil(totalOrders / limit);

      res.setHeader(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, private"
      );
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");

      res.json({
        success: true,
        orders,
        totalOrders,
        currentPage: page,
        totalPages,
        limit,
        fromCache: false,
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

router.put(
  "/admin-update-status/:id",
  isAuthenticated,
  isAdmin,
  catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const { status: newStatus } = req.body;
    const adminId = req.user._id.toString();

    if (!newStatus) {
      return next(new ErrorHandler("New status is required.", 400));
    }
    if (!Object.values(ORDER_STATUSES).includes(newStatus)) {
      return next(
        new ErrorHandler(`Invalid status value provided: "${newStatus}".`, 400)
      );
    }
    if (!isValidObjectId(id)) {
      return next(new ErrorHandler("Invalid Order ID format.", 400));
    }

    console.log(`[Admin API] Attempting findById for update: Order ${id}`);
    const order = await Order.findById(id);

    if (!order) {
      console.error(
        `[Admin API] Update failed: Order ${id} not found via findById.`
      );
      return next(new ErrorHandler("Order not found.", 404));
    }
    console.log(
      `[Admin API] Found order ${id} for status update. Current status: ${order.status}`
    );

    if (order.status === newStatus) {
      console.log(
        `[Admin API] Status for order ${id} is already '${newStatus}'. No update needed.`
      );
      return res.json({
        success: true,
        message: `Order status is already '${newStatus}'. No update needed.`,
        order: order,
      });
    }

    const previousStatus = order.status;
    order.status = newStatus;

    if (newStatus === ORDER_STATUSES.DELIVERED && !order.deliveredAt) {
      order.deliveredAt = new Date();
      if (
        order.paymentInfo?.type === "Cash On Delivery" &&
        order.paymentInfo.status !== "Succeeded"
      ) {
        order.paymentInfo.status = "Succeeded";
        if (!order.paidAt) order.paidAt = new Date();
        order.markModified("paymentInfo");
        console.log(
          `[Admin API] Marked COD payment as Succeeded for order ${id}`
        );
      }
    }

    order.statusHistory.push({
      status: newStatus,
      updatedBy: `admin:${adminId}`,
      timestamp: new Date(),
      details: `Admin changed status from '${previousStatus}' to '${newStatus}'.`,
    });

    try {
      const updatedOrder = await order.save();
      console.log(
        `[Admin API] Successfully updated status for order ${id} to '${newStatus}'`
      );

      const involvedSellers = [
        ...new Set(order.cart.map((i) => i.shopId?.toString()).filter(Boolean)),
      ];
      clearRelevantOrderCaches(id, order.user?._id, involvedSellers);

      res.json({
        success: true,
        message: `Order status updated to '${newStatus}'.`,
        order: updatedOrder,
      });
    } catch (e) {
      console.error(
        `Admin status update save error (Order ${id}, Status ${newStatus}):`,
        e
      );
      return next(
        new ErrorHandler(`Failed to save status update: ${e.message}`, 500)
      );
    }
  })
);

router.get(
  "/download-design/:orderId/:itemId",
  isAuthenticated,
  isAdmin,
  catchAsyncErrors(async (req, res, next) => {
    const { orderId, itemId } = req.params;
    const adminId = req.user._id.toString();

    if (!isValidObjectId(orderId) || !isValidObjectId(itemId)) {
      return next(new ErrorHandler("Invalid Order or Item ID format.", 400));
    }

    const order = await Order.findById(orderId).lean();
    if (!order) {
      return next(new ErrorHandler("Order not found.", 404));
    }

    const item = order.cart.find(
      (cartItem) => cartItem._id?.toString() === itemId
    );
    if (!item) {
      return next(new ErrorHandler("Item not found within this order.", 404));
    }

    const designUrl = item.designImage?.url;
    if (!designUrl) {
      console.error(
        `Design URL missing for item ${itemId} in order ${orderId}.`
      );
      return next(
        new ErrorHandler(
          "Design image URL is missing for this item. Cannot prepare download.",
          404
        )
      );
    }

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
      .catch((err) =>
        console.error(
          `Failed to log design download request for order ${orderId}:`,
          err
        )
      );

    const payload = {
      imageUrl: designUrl,
      orderId: order._id.toString(),
      itemId: item._id.toString(),
      orderNumber: order._id.toString().slice(-8),
      productTitle: item.DesignTitle || "Untitled Design",
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

    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, private"
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    res.json({ success: true, designData: payload });
  })
);

router.delete(
  "/admin/delete/:id",
  isAuthenticated,
  isAdmin,
  catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return next(new ErrorHandler("Invalid Order ID format.", 400));
    }

    const order = await Order.findById(id).select("user cart");
    if (!order) {
      return next(new ErrorHandler("Order not found.", 404));
    }

    const userId = order.user?._id;
    const involvedSellers = [
      ...new Set(order.cart.map((i) => i.shopId?.toString()).filter(Boolean)),
    ];

    const result = await Order.deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      console.error(
        `Admin delete failed for order ${id}, but order was found initially.`
      );
      return next(new ErrorHandler("Order deletion failed unexpectedly.", 500));
    }

    console.log(`[Admin API] Deleted order ${id}`);
    clearRelevantOrderCaches(id, userId, involvedSellers);

    res
      .status(200)
      .json({ success: true, message: "Order deleted successfully." });
  })
);

module.exports = router;
