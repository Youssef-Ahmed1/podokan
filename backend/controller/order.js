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
  stdTTL: 300, // Default TTL 5 minutes
  checkperiod: 120, // Check for expired keys every 2 minutes
  useClones: false, // Store direct references (faster, but mutable)
});

// Cache keys definition for better management
const CACHE_KEYS = {
  ADMIN_ORDERS_PAGE: (page, limit) => `admin_orders_p${page}_l${limit}`, // Key includes page/limit
  USER_ORDERS: (userId) => `user_orders_${userId}`,
  SELLER_ORDERS: (sellerId) => `seller_orders_${sellerId}`,
  ORDER_DETAIL: (orderId) => `order_detail_${orderId}`,
};

// --- Helper Functions ---
const isValidObjectId = (id) => id && mongoose.Types.ObjectId.isValid(id);

// Clears all admin paginated caches (use when any order changes)
const clearAdminOrderPageCaches = () => {
  const adminKeys = orderCache
    .keys()
    .filter((k) => k.startsWith("admin_orders_p"));
  if (adminKeys.length > 0) {
    // console.log("Clearing Admin Order page caches:", adminKeys);
    orderCache.del(adminKeys);
  }
};

// Clears specific caches related to an order, user, and sellers
const clearRelevantOrderCaches = (orderId, userId, involvedSellerIds = []) => {
  const keysToDelete = new Set();
  clearAdminOrderPageCaches(); // Always clear paginated admin cache

  if (orderId) keysToDelete.add(CACHE_KEYS.ORDER_DETAIL(orderId.toString()));
  if (userId) keysToDelete.add(CACHE_KEYS.USER_ORDERS(userId.toString()));

  // Ensure seller IDs are valid strings before adding
  involvedSellerIds.forEach((id) => {
    if (id && typeof id === "string") {
      keysToDelete.add(CACHE_KEYS.SELLER_ORDERS(id));
    } else if (id?._id) {
      // Handle potential object IDs
      keysToDelete.add(CACHE_KEYS.SELLER_ORDERS(id._id.toString()));
    }
  });

  const keysArray = Array.from(keysToDelete);
  if (keysArray.length > 0) {
    // console.log("Clearing specific caches:", keysArray);
    orderCache.del(keysArray);
  }
};

// Updates product stock (negative quantityChange decreases stock)
const updateProductStock = async (productId, quantityChange) => {
  if (!isValidObjectId(productId) || typeof quantityChange !== "number") {
    console.warn(
      `Invalid stock update input: P=${productId}, Qty=${quantityChange}`
    );
    return; // Don't proceed with invalid input
  }
  if (quantityChange === 0) return; // No change needed

  try {
    const product = await Product.findById(productId).select("stock name");
    if (!product) {
      console.warn(`Product ${productId} not found for stock update.`);
      // Potentially throw an error if this is critical, or just log and continue
      return;
      // throw new ErrorHandler(`Product ${productId} not found during stock update.`, 404);
    }

    const currentStock = product.stock || 0;
    const newStock = currentStock - quantityChange; // Subtracting the quantity SOLD

    if (newStock < 0) {
      // This should ideally be prevented by the pre-check, but handle just in case
      console.error(
        `Stock Update Error: Insufficient stock for ${
          product.name || productId
        }. Have: ${currentStock}, Need: ${quantityChange}. Setting stock to 0.`
      );
      // Decide action: throw error or just set stock to 0? Setting to 0 might be safer.
      // throw new ErrorHandler(`Insufficient stock for ${product.name || productId}.`, 400);
      await Product.updateOne({ _id: productId }, { $set: { stock: 0 } });
    } else {
      await Product.updateOne(
        { _id: productId },
        { $inc: { stock: -quantityChange } } // Use $inc for atomic update
      );
      // console.log(`Stock updated for ${productId}: ${currentStock} -> ${newStock}`);
    }
  } catch (error) {
    console.error(`Error updating stock for Product ${productId}:`, error);
    // Decide whether to re-throw or just log
    throw new ErrorHandler(`Failed to update stock for ${productId}`, 500); // Re-throw for controller to handle
  }
};

// === ROUTES ===

// --- Create Order ---
router.post(
  "/create-order",
  isAuthenticated, // Ensures req.user is set
  catchAsyncErrors(async (req, res, next) => {
    const { cart, shippingAddress, paymentInfo } = req.body;
    const currentUser = req.user; // Get user from middleware

    // --- Basic Input Validation ---
    if (!currentUser?._id) {
      return next(new ErrorHandler("User authentication is invalid.", 401));
    }
    if (!Array.isArray(cart) || cart.length === 0) {
      return next(new ErrorHandler("Cart is empty.", 400));
    }
    if (
      !shippingAddress?.address1 ||
      !shippingAddress.city ||
      !shippingAddress.country ||
      !shippingAddress.phoneNumber // Make phone required
    ) {
      return next(
        new ErrorHandler(
          "Shipping address incomplete (Address 1, City, Country, Phone required).",
          400
        )
      );
    }

    // --- Stock Pre-check (Before attempting creation) ---
    try {
      for (const item of cart) {
        // Validate item structure early
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

        // Check stock only if productId is valid
        if (item.productId && isValidObjectId(item.productId)) {
          const product = await Product.findById(item.productId)
            .select("stock name")
            .lean(); // Use lean for performance
          if (!product) {
            throw new ErrorHandler(
              `Product reference invalid for item "${item.DesignTitle}". Cannot verify stock.`,
              404 // Or 400, depending on how you treat missing product links
            );
          }
          if ((product.stock || 0) < item.qty) {
            throw new ErrorHandler(
              `Insufficient stock for "${product.name}". Available: ${
                product.stock || 0
              }, Requested: ${item.qty}.`,
              400
            );
          }
        } else {
          // console.log(`Item "${item.DesignTitle}" has no valid productId, skipping stock check.`);
        }
      }
    } catch (validationOrStockError) {
      return next(validationOrStockError); // Pass the specific error
    }

    // --- Group Cart Items by Shop ---
    const shopItemsMap = new Map();
    cart.forEach((item) => {
      const shopIdStr = item.shopId.toString();
      if (!shopItemsMap.has(shopIdStr)) shopItemsMap.set(shopIdStr, []);
      // Push only necessary validated fields for the order item schema
      shopItemsMap.get(shopIdStr).push({
        productId:
          item.productId && isValidObjectId(item.productId)
            ? item.productId
            : null,
        qty: item.qty,
        shopId: item.shopId, // Keep as ObjectId
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
          // Provide defaults if missing
          positionX: 50,
          positionY: 50,
          scale: 1,
          rotation: 0,
        },
      });
    });

    // --- Process Order Creation per Shop ---
    const shippingCostPerSellerOrder =
      typeof shippingAddress.shippingPrice === "number" &&
      shippingAddress.shippingPrice >= 0
        ? shippingAddress.shippingPrice
        : 50; // Default shipping if not provided or invalid

    const createdOrders = [];
    const orderPromises = [];
    const stockUpdateErrors = [];
    const involvedSellerIds = Array.from(shopItemsMap.keys()); // Collect seller IDs for cache clearing

    for (const [shopIdStr, shopItems] of shopItemsMap.entries()) {
      // Calculate subtotal and total for this specific shop's order portion
      const subtotal = shopItems.reduce(
        (acc, item) => acc + (item.price || 0) * (item.qty || 1),
        0
      );
      const total = subtotal + shippingCostPerSellerOrder; // Assuming flat shipping per sub-order

      const orderData = {
        cart: shopItems, // Items for this specific shop
        shippingAddress: {
          // Use validated shipping address parts
          address1: shippingAddress.address1,
          address2: shippingAddress.address2 || "",
          city: shippingAddress.city,
          country: shippingAddress.country,
          postalCode: shippingAddress.postalCode || "",
          phoneNumber: shippingAddress.phoneNumber,
          shippingPrice: shippingCostPerSellerOrder, // Store the cost applied to this part
        },
        shippingCost: shippingCostPerSellerOrder, // Total shipping for this part
        user: {
          // Use authenticated user's details
          _id: currentUser._id,
          name: currentUser.name,
          email: currentUser.email,
        },
        subtotal: subtotal,
        totalPrice: total,
        paymentInfo: paymentInfo || {
          // Default payment info if not provided
          type: "Cash On Delivery",
          status: "Processing",
        },
        status: ORDER_STATUSES.PROCESSING, // Initial status
        // statusHistory will be added by pre-save hook
      };

      // Add order creation to promises array
      orderPromises.push(
        Order.create(orderData)
          .then(async (order) => {
            createdOrders.push(order); // Add successfully created order
            // --- Update Stock AFTER Order is Successfully Created ---
            for (const item of order.cart) {
              if (item.productId) {
                try {
                  await updateProductStock(item.productId, item.qty); // Pass positive qty (means sold)
                } catch (stockError) {
                  console.error(
                    `Stock update failed for order ${order._id}, product ${item.productId}:`,
                    stockError.message
                  );
                  // Log the error but allow order creation to succeed overall
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
            // Throw a specific error to be caught by Promise.all catch block
            throw new ErrorHandler(
              `Order creation failed for shop ${shopIdStr}: ${creationError.message}`,
              500
            );
          })
      );
    }

    // --- Finalize Batch Creation ---
    try {
      await Promise.all(orderPromises); // Wait for all order parts to be created/stock updated

      // Clear relevant caches only after successful creation
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
        // Optionally notify admin or take other actions
      }

      res.status(201).json({ success: true, orders: createdOrders });
    } catch (error) {
      console.error("Error processing order creation batch:", error);
      // If any part failed, potentially rollback or log (complex)
      // For now, return the error that caused Promise.all to reject
      return next(
        error instanceof ErrorHandler
          ? error
          : new ErrorHandler("Failed to complete order creation.", 500)
      );
    }
  })
);

// --- Get User Orders ---
router.get(
  "/get-user-orders",
  isAuthenticated, // Ensures req.user is set
  catchAsyncErrors(async (req, res, next) => {
    const userId = req.user._id.toString();
    const cacheKey = CACHE_KEYS.USER_ORDERS(userId);
    const cachedOrders = orderCache.get(cacheKey);

    // ** Disable cache for testing if needed **
    // if (cachedOrders && process.env.NODE_ENV !== 'development') { // Example: only use cache in prod
    if (cachedOrders) {
      // console.log(`[Cache Hit] User orders for ${userId}`);
      return res.json({
        success: true,
        orders: cachedOrders,
        count: cachedOrders.length,
        fromCache: true,
      });
    }

    // console.log(`[Cache Miss] Fetching user orders for ${userId} from DB`);
    const orders = await Order.find({ "user._id": req.user._id })
      .sort({ createdAt: -1 }) // Sort by newest first
      .lean(); // Use lean for read-only performance

    orderCache.set(cacheKey, orders); // Cache the results

    // Set cache control headers to prevent intermediate caching if needed for user orders too
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, private"
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    res.json({ success: true, orders, count: orders.length, fromCache: false });
  })
);


// --- Get Single Order Details (User or Admin) ---
router.get(
  "/get-order/:id",
  isAuthenticated, // Requires login (user or admin)
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

      const isOwner = orderData.user._id.toString() === req.user._id.toString();
      const isAdminUser = (req.user.role || "").toLowerCase() === "admin";

      if (!isOwner && !isAdminUser) {
        return next(
          new ErrorHandler("Forbidden: You cannot access this order.", 403)
        );
      }

      // Set cache control headers here as well if disabling caching generally
      res.setHeader(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, private"
      );
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");

      res.json({ success: true, order: orderData, fromCache });
    };

    // ** Disable cache for testing if needed **
    // if (cachedOrder && process.env.NODE_ENV !== 'development') {
    if (cachedOrder) {
      // console.log(`[Cache Hit] Order detail for ${id}`);
      return checkAuthAndRespond(cachedOrder, true);
    }

    // console.log(`[Cache Miss] Fetching order detail for ${id} from DB`);
    const order = await Order.findById(id).lean();

    if (order) {
      orderCache.set(cacheKey, order);
    }

    checkAuthAndRespond(order, false);
  })
);

// --- Get Seller Orders ---
router.get(
  "/get-seller-orders",
  isSeller, // Ensures req.seller is set and active/approved
  catchAsyncErrors(async (req, res, next) => {
    const sellerId = req.seller._id.toString();
    const cacheKey = CACHE_KEYS.SELLER_ORDERS(sellerId);
    const cachedData = orderCache.get(cacheKey);
    const cacheTTLms = 120 * 1000; // Cache seller orders for 2 minutes

    // ** Disable cache for testing if needed **
    // if (cachedData && (Date.now() - (cachedData.timestamp || 0) < cacheTTLms) && process.env.NODE_ENV !== 'development') {
    if (cachedData && Date.now() - (cachedData.timestamp || 0) < cacheTTLms) {
      // console.log(`[Cache Hit] Seller orders for ${sellerId}`);
      // Set cache control headers even for cache hit if needed downstream
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

    // console.log(`[Cache Miss] Fetching seller orders for ${sellerId} from DB`);
    const dbOrders = await Order.find({ "cart.shopId": req.seller._id })
      .sort({ createdAt: -1 })
      .lean();

    const sellerOrders = dbOrders.map((order) => ({
      ...order,
      cart: order.cart.filter((item) => item.shopId?.toString() === sellerId),
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

// --- Get Single Order Details (Seller) ---
router.get(
  "/get-seller-order/:id",
  isSeller, // Ensures req.seller is set
  catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const sellerId = req.seller._id.toString();

    if (!isValidObjectId(id)) {
      return next(new ErrorHandler("Invalid Order ID format.", 400));
    }

    // No caching implemented here yet, direct fetch
    const order = await Order.findById(id).lean();

    if (!order) {
      return next(new ErrorHandler("Order not found.", 404));
    }

    const sellerItemsInCart = order.cart.filter(
      (item) => item.shopId?.toString() === sellerId
    );

    if (sellerItemsInCart.length === 0) {
      return next(
        new ErrorHandler(
          "Order found, but it contains no items associated with your shop.",
          403
        )
      );
    }

    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, private"
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    res.json({
      success: true,
      order: { ...order, cart: sellerItemsInCart },
    });
  })
);


// --- Seller Action: Update Refund Status ---
router.put(
  "/accept-refund/:id",
  isSeller, // Ensures req.seller is set
  catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const { status: newStatus } = req.body; // The requested new status
    const sellerId = req.seller._id.toString();

    if (!isValidObjectId(id)) {
      return next(new ErrorHandler("Invalid Order ID format.", 400));
    }

    const allowedStatuses = [
      ORDER_STATUSES.REFUND_APPROVED,
      ORDER_STATUSES.REFUND_REJECTED,
    ];
    if (!allowedStatuses.includes(newStatus)) {
      return next(
        new ErrorHandler(
          `Invalid status provided. Must be one of: ${allowedStatuses.join(
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
      clearRelevantOrderCaches(id, order.user?._id?.toString(), [sellerId]);
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

// === ADMIN ROUTES ===

// --- Get Single Order Details (Admin) ---
router.get(
  "/admin/order/:id",
  isAuthenticated,
  isAdmin,
  catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return next(new ErrorHandler("Invalid Order ID format.", 400));
    }

    const cacheKey = CACHE_KEYS.ORDER_DETAIL(id);
    const cachedOrder = orderCache.get(cacheKey);

    // ** Disable cache for testing if needed **
    // if (cachedOrder && process.env.NODE_ENV !== 'development') {
    if (cachedOrder) {
      // Set cache control headers even for cache hit
      res.setHeader(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, private"
      );
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      return res.json({ success: true, order: cachedOrder, fromCache: true });
    }

    const order = await Order.findById(id).lean();

    if (!order) {
      return next(new ErrorHandler("Order not found.", 404));
    }

    orderCache.set(cacheKey, order);

    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, private"
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    res.json({ success: true, order, fromCache: false });
  })
);

// --- Get All Orders (Admin - PAGINATED) ---
router.get(
  "/admin/all-orders",
  isAuthenticated, // Ensure logged in
  isAdmin, // Ensure role is Admin
  catchAsyncErrors(async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15; // Default limit
    const skip = (page - 1) * limit;

    try {
      // Fetch total count and paginated orders concurrently
      const [totalOrders, orders] = await Promise.all([
        Order.countDocuments(), // Count all orders
        Order.find() // Find orders for the page
          .sort({ createdAt: -1 }) // Sort by newest first
          .skip(skip)
          .limit(limit)
          .lean(), // Use lean for read-only
      ]);

      // Log database results for debugging
      console.log(
        `[Admin Orders API] DB Result - totalOrders: ${totalOrders}, ordersOnPage: ${orders.length}`
      );
      if (totalOrders > 0 && orders.length > 0) {
        console.log(
          `[Admin Orders API] First order ID on page: ${orders[0]._id}`
        );
      }

      const totalPages = Math.ceil(totalOrders / limit);

      // **** ADD CACHE CONTROL HEADERS ****
      res.setHeader(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, private"
      ); // Instructs browser (and proxies) not to cache
      res.setHeader("Pragma", "no-cache"); // For older HTTP/1.0 caches
      res.setHeader("Expires", "0"); // Expire immediately
      // ***********************************

      res.json({
        // Send the actual data
        success: true,
        orders, // Orders for the current page
        totalOrders, // Total count for pagination calculation
        currentPage: page,
        totalPages,
        limit,
        fromCache: false, // Indicate data is fresh from DB (due to cache headers)
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

// --- Delete Order (Admin) ---
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

    const userId = order.user?._id?.toString();
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

    clearRelevantOrderCaches(id, userId, involvedSellers);

    res
      .status(200)
      .json({ success: true, message: "Order deleted successfully." });
  })
);


// --- Admin Update Order Status ---
router.put(
  "/admin/update-status/:id",
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

    const order = await Order.findById(id);
    if (!order) {
      return next(new ErrorHandler("Order not found.", 404));
    }

    if (order.status === newStatus) {
      return res.json({
        success: true,
        message: `Order status is already '${newStatus}'. No update needed.`,
        order,
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
      }
    }

    order.statusHistory.push({
      status: newStatus,
      updatedBy: `admin:${adminId}`,
      timestamp: new Date(),
      details: `Admin changed status from '${previousStatus}' to '${newStatus}'.`,
    });

    try {
      const updatedOrder = await order.save({ validateBeforeSave: false }); // Keep workaround for now
      const involvedSellers = [
        ...new Set(order.cart.map((i) => i.shopId?.toString()).filter(Boolean)),
      ];
      clearRelevantOrderCaches(
        id,
        order.user?._id?.toString(),
        involvedSellers
      );
      res.json({
        success: true,
        message: `Order status updated to '${newStatus}'.`,
        order: updatedOrder,
      });
    } catch (e) {
      console.error(
        `Admin status update save error (Order ${id}, Status ${newStatus}) (Validation Bypassed):`,
        e
      );
      return next(
        new ErrorHandler(`Failed to save status update: ${e.message}`, 500)
      );
    }
  })
);

// --- Admin Update Order Item Details ---
router.put(
  "/update-item-details/:orderId/:itemId",
  isAuthenticated,
  isAdmin,
  catchAsyncErrors(async (req, res, next) => {
    const { orderId, itemId } = req.params;
    const { ProductColor, size } = req.body;
    const adminId = req.user._id.toString();

    if (!isValidObjectId(orderId) || !isValidObjectId(itemId)) {
      return next(new ErrorHandler("Invalid Order or Item ID format.", 400));
    }
    if (ProductColor === undefined && size === undefined) {
      return next(
        new ErrorHandler(
          "No update data provided (require ProductColor or size).",
          400
        )
      );
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return next(new ErrorHandler("Order not found.", 404));
    }

    const itemIndex = order.cart.findIndex(
      (item) => item._id?.toString() === itemId
    );
    if (itemIndex === -1) {
      return next(new ErrorHandler("Item not found within this order.", 404));
    }

    let detailsLog = "Admin updated item details:";
    let itemUpdated = false;
    const itemToUpdate = order.cart[itemIndex];

    if (
      ProductColor !== undefined &&
      ProductColor !== itemToUpdate.ProductColor
    ) {
      detailsLog += ` Color='${itemToUpdate.ProductColor}'->'${ProductColor}'`;
      itemToUpdate.ProductColor = ProductColor.trim();
      itemUpdated = true;
    }

    if (size !== undefined && size !== itemToUpdate.size) {
      detailsLog += `${itemUpdated ? "," : ""} Size='${
        itemToUpdate.size
      }'->'${size}'`;
      itemToUpdate.size = size.trim();
      itemUpdated = true;
    }

    if (!itemUpdated) {
      return res.json({
        success: true,
        message: "No changes detected for the item.",
        order,
      });
    }

    order.statusHistory.push({
      status: order.status,
      updatedBy: `admin:${adminId}`,
      timestamp: new Date(),
      details: `${detailsLog} (Item ID: ${itemId})`,
    });
    order.markModified("cart");

    try {
      const updatedOrder = await order.save({ validateBeforeSave: false }); // Keep workaround
      const involvedSellers = [
        ...new Set(order.cart.map((i) => i.shopId?.toString()).filter(Boolean)),
      ];
      clearRelevantOrderCaches(
        orderId,
        order.user?._id?.toString(),
        involvedSellers
      );
      res.json({
        success: true,
        message: "Order item details updated successfully.",
        order: updatedOrder,
      });
    } catch (e) {
      console.error(
        `Item detail update save error (Order ${orderId}, Item ${itemId}):`,
        e
      );
      return next(
        new ErrorHandler(`Failed to save item detail update: ${e.message}`, 500)
      );
    }
  })
);

// --- Admin Get Design Data for Download ---
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

    // Log download request async
    Order.findByIdAndUpdate(orderId, {
      $push: {
        statusHistory: {
          status: order.status,
          updatedBy: `admin:${adminId}`,
          timestamp: new Date(),
          details: `Admin requested design download package for item: ${
            item.DesignTitle || "Untitled"
          } (ID: ${itemId}).`,
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

    // Set cache headers for this specific response too if needed, although it's less likely to be cached aggressively
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, private"
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    res.json({ success: true, designData: payload });
  })
);

module.exports = router;