const express = require("express");
const router = express.Router();
const Order = require("../model/order");
const Shop = require("../model/shop");
const Product = require("../model/product");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { ORDER_STATUSES } = require("../constants/orderStatuses"); // Assuming you have this file
const NodeCache = require("node-cache");
const { isAuthenticated, isSeller, isAdmin } = require("../middleware/auth");
const DesignProcessor = require("../utils/designProcessor"); // Assuming this exists for mockups
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

// Caching configuration (10 minute expiry, check every 5 minutes)
const orderCache = new NodeCache({
  stdTTL: 600,
  checkperiod: 300,
  useClones: false, // Performance optimization for large objects
});

// Cache keys
const CACHE_KEYS = {
  ADMIN_ORDERS: "admin_all_orders",
  USER_ORDERS: (userId) => `user_orders_${userId}`,
  SELLER_ORDERS: (sellerId) => `seller_orders_${sellerId}`,
  ORDER_DETAIL: (orderId) => `order_detail_${orderId}`,
};

/* ----------------------------- Helper Functions ---------------------------- */

/**
 * Validates MongoDB ObjectId format
 * @param {string} id - ID to validate
 * @returns {boolean} Whether ID is valid
 */
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Clears relevant caches after order modifications
 * @param {string} orderId - Order ID that was modified
 * @param {string} userId - User ID associated with order
 * @param {string | null} [sellerId] - Seller ID associated with order (optional)
 */
const clearOrderCaches = (orderId, userId, sellerId = null) => {
  const keysToDel = [];
  if (orderId) {
    keysToDel.push(CACHE_KEYS.ORDER_DETAIL(orderId));
  }
  if (userId) {
    keysToDel.push(CACHE_KEYS.USER_ORDERS(userId));
  }
  // Clear admin cache on most modifications affecting totals or status
  keysToDel.push(CACHE_KEYS.ADMIN_ORDERS);

  // Fetch seller IDs associated with the order if not provided explicitly
  // This ensures all relevant seller caches are cleared if sellerId is null
  if (!sellerId && orderId) {
    Order.findById(orderId)
      .select("cart.shopId")
      .lean()
      .then((order) => {
        if (order && order.cart) {
          const uniqueSellerIds = [
            ...new Set(
              order.cart.map((item) => item.shopId?.toString()).filter(Boolean)
            ),
          ];
          uniqueSellerIds.forEach((sId) =>
            keysToDel.push(CACHE_KEYS.SELLER_ORDERS(sId))
          );
          if (keysToDel.length > 0) {
            orderCache.del(keysToDel);
            console.log("Cleared caches (dynamic sellers):", keysToDel);
          }
        }
      })
      .catch((err) =>
        console.error("Error fetching seller IDs for cache clear:", err)
      );
  } else {
    if (sellerId) {
      keysToDel.push(CACHE_KEYS.SELLER_ORDERS(sellerId));
    }
    if (keysToDel.length > 0) {
      orderCache.del(keysToDel);
      console.log("Cleared caches:", keysToDel);
    }
  }
};

/**
 * Updates product stock and sold counts after a purchase
 * @param {string} productId - Product ID to update
 * @param {number} qty - Quantity to deduct from stock and add to sold_out
 */
const updateProductStock = async (productId, qty) => {
  try {
    const product = await Product.findById(productId);
    if (product) {
      product.stock = Math.max(0, product.stock - qty); // Prevent negative stock
      product.sold_out = (product.sold_out || 0) + qty;
      await product.save({ validateBeforeSave: false });
      console.log(
        `Updated stock for product ${productId}: ${product.stock} remaining`
      );
    } else {
      console.warn(`Product not found for stock update: ${productId}`);
    }
  } catch (error) {
    console.error(`Failed to update product stock for ${productId}:`, error);
    // Continue processing - don't throw error to prevent transaction failure
  }
};

/**
 * Creates temporary directory for file processing if it doesn't exist
 */
const ensureTempDirectory = () => {
  const tempDir = path.join(__dirname, "../temp");
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  return tempDir;
};

/* -------------------------- Order Creation & Queries ------------------------- */

/**
 * Create new order(s) from cart
 * POST /api/v2/order/create-order
 * @authenticated
 */
router.post(
  "/create-order",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      console.log("Creating new order");
      const { cart, shippingAddress, user, totalPrice, paymentInfo } = req.body; // Note: totalPrice from body is usually ignored, recalculated server-side

      // Validate required fields
      if (!cart || !Array.isArray(cart) || cart.length === 0) {
        return next(new ErrorHandler("Cart is empty or invalid", 400));
      }
      if (!shippingAddress || !user) {
        return next(
          new ErrorHandler(
            "Missing required order information (shipping or user)",
            400
          )
        );
      }
      if (!user._id) {
        return next(new ErrorHandler("User ID is missing", 400));
      }

      // Ensure shipping price is captured explicitly or default
      const shippingCost = shippingAddress.shippingPrice ?? 50; // Use default 50 if undefined or null

      // Group items by seller (shop)
      const shopItemsMap = new Map();
      const productValidationPromises = [];

      cart.forEach((item) => {
        // Basic item validation
        if (
          !item.shopId ||
          !item.price ||
          !item._id ||
          !item.qty ||
          !item.designImage ||
          !item.DesignTitle ||
          !item.ProductType ||
          !item.ProductColor ||
          !item.size
        ) {
          console.warn("Item with missing critical data found in cart:", item);
          throw new ErrorHandler(
            `Item "${item.DesignTitle || "Unknown"}" has missing data.`,
            400
          ); // Stop order creation
        }
        if (typeof item.qty !== "number" || item.qty <= 0) {
          throw new ErrorHandler(
            `Invalid quantity for item "${item.DesignTitle || "Unknown"}".`,
            400
          );
        }
        if (typeof item.price !== "number" || item.price < 0) {
          throw new ErrorHandler(
            `Invalid price for item "${item.DesignTitle || "Unknown"}".`,
            400
          );
        }
        if (!isValidObjectId(item.shopId)) {
          throw new ErrorHandler(
            `Invalid shop ID for item "${item.DesignTitle || "Unknown"}".`,
            400
          );
        }
        // If item has productId, validate stock (optional but recommended)
        if (item.productId && isValidObjectId(item.productId)) {
          productValidationPromises.push(
            Product.findById(item.productId)
              .select("stock name")
              .lean()
              .then((product) => {
                if (!product) {
                  throw new ErrorHandler(
                    `Product "${item.DesignTitle}" (ID: ${item.productId}) not found.`,
                    404
                  );
                }
                if (product.stock < item.qty) {
                  throw new ErrorHandler(
                    `Insufficient stock for "${product.name}". Only ${product.stock} available.`,
                    400
                  );
                }
              })
          );
        }

        const shopId = item.shopId.toString();
        if (!shopItemsMap.has(shopId)) {
          shopItemsMap.set(shopId, []);
        }
        shopItemsMap.get(shopId).push(item);
      });

      // Wait for all product validations
      await Promise.all(productValidationPromises);

      // Create one order per seller
      const createdOrders = [];
      const orderCreationPromises = [];

      for (const [shopId, items] of shopItemsMap) {
        // Calculate subtotal for this seller's items
        const subtotal = items.reduce(
          (total, item) => total + (item.price || 0) * (item.qty || 1),
          0
        );

        // Prepare order document - subtotal/totalPrice will be set by pre-save hook
        const orderData = {
          cart: items,
          shippingAddress: {
            ...shippingAddress,
            shippingPrice: shippingCost, // Store the used shipping price explicitly if desired
          },
          user: user, // Should include user._id, user.name, etc.
          shippingCost: shippingCost, // Set the shipping cost for the hook
          paymentInfo, // Make sure this has id, status, type if available
          status: ORDER_STATUSES.PROCESSING || "Processing",
          statusHistory: [
            {
              status: ORDER_STATUSES.PROCESSING || "Processing",
              updatedBy: user._id.toString(),
              timestamp: new Date(),
            },
          ],
          createdAt: Date.now(),
          // subtotal and totalPrice will be handled by Mongoose pre-save hook
        };

        // Create order in database
        orderCreationPromises.push(
          Order.create(orderData)
            .then((order) => {
              createdOrders.push(order);

              // Update product stock asynchronously (fire-and-forget style, or await if crucial)
              order.cart.forEach((item) => {
                if (item.productId && isValidObjectId(item.productId)) {
                  updateProductStock(item.productId, item.qty || 1).catch(
                    (err) =>
                      console.error(
                        `Stock update failed in background for ${item.productId}:`,
                        err
                      )
                  );
                }
              });
            })
            .catch((error) => {
              console.error(
                "Error detail creating order for shop",
                shopId,
                error
              );
              // Construct a more informative error message
              let errMsg = `Failed to create order for shop ${shopId}.`;
              if (error.name === "ValidationError") {
                errMsg += ` Validation Error: ${Object.values(error.errors)
                  .map((e) => e.message)
                  .join(", ")}`;
              } else {
                errMsg += ` Error: ${error.message}`;
              }
              throw new ErrorHandler(errMsg, 500); // Throw standardized error
            })
        );
      }

      // Wait for all orders to attempt creation
      await Promise.all(orderCreationPromises);

      // Clear relevant user cache
      clearOrderCaches(null, user._id.toString());
      // Also clear admin cache as new orders arrived
      orderCache.del(CACHE_KEYS.ADMIN_ORDERS);

      // Return success response with created orders
      res.status(201).json({
        success: true,
        orders: createdOrders,
      });
    } catch (error) {
      console.error("Error in /create-order endpoint:", error);
      // Use the error handler middleware
      return next(
        error instanceof ErrorHandler
          ? error
          : new ErrorHandler(error.message, error.statusCode || 500)
      );
    }
  })
);

/**
 * Get all orders for the authenticated user
 * GET /api/v2/order/get-user-orders
 * @authenticated
 */
router.get(
  "/get-user-orders",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      if (!req.user || !req.user._id) {
        return next(
          new ErrorHandler("Authentication error: User ID not found.", 401)
        );
      }
      const userId = req.user._id.toString();
      console.log("Fetching orders for user:", userId);

      // Check cache first
      const cacheKey = CACHE_KEYS.USER_ORDERS(userId);
      const cachedOrders = orderCache.get(cacheKey);

      if (cachedOrders) {
        console.log("Returning cached user orders");
        return res.status(200).json({
          success: true,
          orders: cachedOrders,
          count: cachedOrders.length,
          fromCache: true,
        });
      }

      // Query database if not in cache
      const orders = await Order.find({ "user._id": userId })
        .sort({ createdAt: -1 })
        .lean(); // Use lean for performance if not modifying

      console.log(`Found ${orders.length} orders for user ${userId}`);

      // Store in cache for future requests
      orderCache.set(cacheKey, orders);

      res.status(200).json({
        success: true,
        orders,
        count: orders.length,
      });
    } catch (error) {
      console.error("Error in get-user-orders:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

/**
 * Get a single order by ID (public, requires ownership validation is usually done on frontend or specific secure routes)
 * GET /api/v2/order/get-order/:id
 */
router.get(
  "/get-order/:id",
  // Removed isAuthenticated to allow potentially public viewing if needed,
  // but ownership checks MUST happen if data is sensitive (e.g., in Profile pages)
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { id } = req.params;

      // Validate ID format
      if (!isValidObjectId(id)) {
        return next(new ErrorHandler("Invalid order ID format", 400));
      }

      // Check cache
      const cacheKey = CACHE_KEYS.ORDER_DETAIL(id);
      const cachedOrder = orderCache.get(cacheKey);

      if (cachedOrder) {
        console.log(`Returning cached order detail: ${id}`);
        return res.status(200).json({
          success: true,
          order: cachedOrder,
          fromCache: true,
        });
      }

      // Query database
      const order = await Order.findById(id).lean(); // Use lean()

      if (!order) {
        // Invalidate cache if order doesn't exist
        orderCache.del(cacheKey);
        return next(new ErrorHandler("Order not found", 404));
      }

      // Cache the result
      orderCache.set(cacheKey, order);
      console.log(`Fetched order detail from DB: ${id}`);

      res.status(200).json({
        success: true,
        order,
      });
    } catch (error) {
      console.error("Error fetching order:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

/* -------------------------- Seller Order Operations -------------------------- */

/**
 * Get all orders containing items for the authenticated seller
 * GET /api/v2/order/get-seller-orders
 * @authenticated @seller
 */
router.get(
  "/get-seller-orders",
  isSeller, // Middleware checks Seller authentication
  catchAsyncErrors(async (req, res, next) => {
    try {
      if (!req.seller || !req.seller._id) {
        return next(
          new ErrorHandler(
            "Seller authentication error: Seller ID not found.",
            401
          )
        );
      }
      const sellerId = req.seller._id; // Get ID from authenticated seller provided by middleware
      const cacheKey = CACHE_KEYS.SELLER_ORDERS(sellerId.toString());
      console.log(`Fetching orders for seller: ${sellerId}`);

      // Check cache
      const cached = orderCache.get(cacheKey);
      if (cached) {
        console.log(`Returning cached seller orders for ${sellerId}`);
        // You might want a TTL check here like: && (Date.now() - cached.timestamp < 300000)
        return res.status(200).json({
          success: true,
          orders: cached,
          count: cached.length,
          fromCache: true,
        });
      }

      // Query: Find orders where the cart contains at least one item with this seller's shopId
      // Note: This retrieves the FULL order document, filtering happens client-side or needs aggregation
      const orders = await Order.find({ "cart.shopId": sellerId })
        .sort({ createdAt: -1 })
        .lean();

      console.log(
        `Found ${orders.length} orders for seller ${sellerId} from DB`
      );

      // Store in cache
      orderCache.set(cacheKey, orders);

      res.status(200).json({
        success: true,
        orders,
        count: orders.length,
        fromCache: false, // Indicate it's fresh from DB
      });
    } catch (error) {
      console.error(
        `Error fetching seller orders for ${req.seller?._id}:`,
        error
      );
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

/**
 * Get a specific order for the authenticated seller (already filters items)
 * GET /api/v2/order/get-seller-order/:id
 * @authenticated @seller
 */
router.get(
  "/get-seller-order/:id",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { id } = req.params;
      if (!req.seller || !req.seller._id) {
        return next(
          new ErrorHandler(
            "Seller authentication error: Seller ID not found.",
            401
          )
        );
      }
      const sellerId = req.seller._id.toString();

      // Validate ID format
      if (!isValidObjectId(id)) {
        return next(new ErrorHandler("Invalid order ID format", 400));
      }

      // Find order where seller has items in the cart
      const order = await Order.findOne({
        _id: id,
        "cart.shopId": sellerId, // Ensure seller is part of this order
      }); // No .lean() here as we might modify `orderObj.cart` later

      if (!order) {
        return next(
          new ErrorHandler(
            "Order not found or you are not authorized to view it",
            404
          )
        );
      }

      // Filter cart to only show this seller's items IN THE RESPONSE
      // The document fetched still contains all items initially.
      const orderObj = order.toObject(); // Convert to plain object to modify
      orderObj.cart = orderObj.cart.filter((item) => {
        const itemShopId = item.shopId?.toString() || item.shopId; // Handle potential ObjectId
        return itemShopId === sellerId;
      });

      res.status(200).json({
        success: true,
        order: orderObj, // Send the filtered order object
      });
    } catch (error) {
      console.error("Error fetching single seller order:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

/**
 * Update order status (for Seller)
 * PUT /api/v2/order/update-order-status/:id
 * @authenticated @seller
 */
router.put(
  "/update-order-status/:id", // Renamed for clarity, distinct from admin update
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!req.seller || !req.seller._id) {
        return next(new ErrorHandler("Seller authentication required", 401));
      }
      const sellerId = req.seller._id;

      // Validate status (seller might have limited statuses they can set)
      const allowedSellerStatuses = [
        ORDER_STATUSES.PROCESSING || "Processing",
        ORDER_STATUSES.TRANSFERRED || "Transferred to delivery partner",
        // Add other statuses seller can set, e.g., 'Ready for pickup'
        // Exclude statuses like 'Delivered', 'Shipping' (usually set by delivery/admin)
        // Include Refund related statuses seller handles
        ORDER_STATUSES.REFUND_APPROVED || "Refund Approved",
        ORDER_STATUSES.REFUND_REJECTED || "Refund Rejected",
      ];
      if (!status || !allowedSellerStatuses.includes(status)) {
        return next(new ErrorHandler(`Invalid status update: ${status}`, 400));
      }
      // Validate ID format
      if (!isValidObjectId(id)) {
        return next(new ErrorHandler("Invalid order ID format", 400));
      }

      // Find the order AND ensure seller has items in it
      const order = await Order.findOne({ _id: id, "cart.shopId": sellerId });

      if (!order) {
        return next(
          new ErrorHandler("Order not found or not related to your shop", 404)
        );
      }

      // Check if the transition is valid (e.g., cannot go back from Transferred to Processing)
      // Add more sophisticated state machine logic if needed

      const previousStatus = order.status;
      order.status = status;

      // Add to status history
      order.statusHistory = order.statusHistory || [];
      order.statusHistory.push({
        status: status,
        updatedBy: sellerId.toString(), // Identify as seller update
        timestamp: new Date(),
        details: `Status changed from ${previousStatus} to ${status} by seller`,
      });

      // --- Recalculate totals before saving to be safe ---
      order.subtotal = order.cart.reduce(
        (sum, item) => sum + (item.price || 0) * (item.qty || 1),
        0
      );
      order.shippingCost =
        order.shippingAddress?.shippingPrice ?? order.shippingCost ?? 50;
      order.totalPrice = order.subtotal + order.shippingCost;
      // --- End recalculation ---

      try {
        await order.save();
      } catch (validationError) {
        console.error(
          "Seller Order Status Update Validation failed:",
          validationError
        );
        console.error("Order state before failed save:", order.toObject());
        return next(
          new ErrorHandler(
            `Order update failed: ${validationError.message}`,
            500
          )
        );
      }

      // Clear relevant caches
      clearOrderCaches(id, order.user?._id?.toString(), sellerId.toString());

      res.status(200).json({
        success: true,
        message: `Order status updated to ${status}`,
        order,
      });
    } catch (error) {
      console.error("Error updating order status by seller:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

/**
 * Assign a delivery partner to an order (SELLER ACTION - requires modifications based on how delivery partners are managed)
 * POST /api/v2/order/assign-delivery
 * @authenticated @seller
 * @deprecated - Logic depends heavily on external Delivery Partner integration - kept structure as example
 */
router.post(
  "/assign-delivery",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    // THIS IS A PLACEHOLDER - Real implementation depends on Delivery Partner integration
    // You'd likely call a delivery partner API here, get a tracking number, etc.
    try {
      const { orderId, deliveryPartnerInfo } = req.body; // e.g., { partnerName: "Aramex", serviceType: "Express" }
      const sellerId = req.seller._id;

      if (!orderId || !deliveryPartnerInfo) {
        return next(
          new ErrorHandler(
            "Missing required delivery assignment information",
            400
          )
        );
      }
      if (!isValidObjectId(orderId)) {
        return next(new ErrorHandler("Invalid order ID format", 400));
      }

      const order = await Order.findOne({
        _id: orderId,
        "cart.shopId": sellerId,
      });
      if (!order) {
        return next(
          new ErrorHandler("Order not found or not related to your shop", 404)
        );
      }

      // ---- Interaction with Delivery Partner System ----
      // 1. Call Delivery Partner API to schedule pickup / create shipment
      // 2. Get trackingNumber and partnerId (internal ID or name) back
      // const deliveryResult = await deliveryPartnerService.createShipment(order, deliveryPartnerInfo);
      const trackingNumber = `FAKE_TN_${Date.now()}`; // Replace with actual tracking number
      const partnerId = deliveryPartnerInfo.partnerName || "DefaultPartner";
      // ---- End Interaction ----

      // Update order with delivery information
      order.deliveryInfo = {
        partnerId: partnerId,
        trackingNumber: trackingNumber,
        status: "assigned", // or 'pickup_scheduled'
        assignedAt: new Date(),
        lastUpdate: new Date(),
        notes: [
          {
            message: `Shipment created via ${partnerId}`,
            timestamp: new Date(),
          },
        ],
        // maybe add estimatedDelivery from deliveryResult
      };

      // Update order status ( Crucial )
      const newStatus =
        ORDER_STATUSES.TRANSFERRED || "Transferred to delivery partner";
      order.status = newStatus;

      order.statusHistory = order.statusHistory || [];
      order.statusHistory.push({
        status: newStatus,
        updatedBy: sellerId.toString(),
        timestamp: new Date(),
        details: `Assigned to delivery partner: ${partnerId}, Tracking: ${trackingNumber}`,
      });

      // --- Recalculate totals before saving ---
      order.subtotal = order.cart.reduce(
        (sum, item) => sum + (item.price || 0) * (item.qty || 1),
        0
      );
      order.shippingCost =
        order.shippingAddress?.shippingPrice ?? order.shippingCost ?? 50;
      order.totalPrice = order.subtotal + order.shippingCost;
      // --- End recalculation ---

      try {
        await order.save();
      } catch (validationError) {
        console.error("Assign Delivery Validation failed:", validationError);
        console.error("Order state before failed save:", order.toObject());
        return next(
          new ErrorHandler(
            `Assign delivery failed: ${validationError.message}`,
            500
          )
        );
      }

      // Clear caches
      clearOrderCaches(
        orderId,
        order.user?._id?.toString(),
        sellerId.toString()
      );

      res.status(200).json({
        success: true,
        message: "Delivery partner assigned successfully (simulated)",
        order,
      });
    } catch (error) {
      console.error("Error assigning delivery partner:", error);
      return next(
        new ErrorHandler(error.message || "Failed to assign delivery", 500)
      );
    }
  })
);

/**
 * Accept/Reject/Process refund request for an order (SELLER ACTION)
 * PUT /api/v2/order/process-refund/:id  // Renamed for clarity
 * @authenticated @seller
 */
router.put(
  "/process-refund/:id", // Changed from accept-refund
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status, refundNotes } = req.body; // status should be 'Refund Approved' or 'Refund Rejected'
      if (!req.seller || !req.seller._id) {
        return next(new ErrorHandler("Seller authentication required", 401));
      }
      const sellerId = req.seller._id;

      // Validate status input by seller
      const validRefundStatuses = [
        ORDER_STATUSES.REFUND_APPROVED || "Refund Approved",
        ORDER_STATUSES.REFUND_REJECTED || "Refund Rejected",
        // Maybe seller can also mark as 'Refund Success' if they process manually?
        // ORDER_STATUSES.REFUND_SUCCESS || "Refund Success"
      ];
      if (!status || !validRefundStatuses.includes(status)) {
        return next(
          new ErrorHandler("Invalid refund status provided by seller", 400)
        );
      }
      if (!isValidObjectId(id)) {
        return next(new ErrorHandler("Invalid order ID format", 400));
      }

      // Find the order, ensure it belongs to the seller, and is in a refundable state
      const order = await Order.findOne({
        _id: id,
        "cart.shopId": sellerId,
        status: ORDER_STATUSES.REFUND_REQUESTED || "Processing refund", // Seller should only act on orders requesting refund
      });

      if (!order) {
        return next(
          new ErrorHandler(
            "Order not found, not related to your shop, or not awaiting refund decision",
            404
          )
        );
      }

      const previousStatus = order.status;
      order.status = status; // Set to 'Refund Approved' or 'Refund Rejected'

      // Add to status history
      order.statusHistory = order.statusHistory || [];
      order.statusHistory.push({
        status: status,
        updatedBy: sellerId.toString(),
        timestamp: new Date(),
        details: `Refund ${
          status === validRefundStatuses[1] ? "rejected" : "approved"
        } by seller. ${refundNotes ? "Notes: " + refundNotes : ""}`,
      });

      // --- Recalculate totals before saving ---
      // Totals don't change when processing refund status itself,
      // but recalculating ensures consistency if anything else was modified accidentally.
      order.subtotal = order.cart.reduce(
        (sum, item) => sum + (item.price || 0) * (item.qty || 1),
        0
      );
      order.shippingCost =
        order.shippingAddress?.shippingPrice ?? order.shippingCost ?? 50;
      order.totalPrice = order.subtotal + order.shippingCost;
      // --- End recalculation ---

      // --- Handle Refund Logic (If Approved) ---
      let refundProcessed = false;
      if (status === validRefundStatuses[0]) {
        // If 'Refund Approved'
        // Trigger actual refund process (e.g., call payment gateway API)
        // This is complex and depends on your payment provider.
        // await paymentGateway.processRefund(order.paymentInfo.id, order.totalPrice); // Example
        console.log(`Simulating refund processing for order ${id}`);
        refundProcessed = true; // Assume success for simulation

        // If refund was successful, mark the order status as 'Refund Success'
        if (refundProcessed) {
          order.status = ORDER_STATUSES.REFUND_SUCCESS || "Refund Success";
          order.statusHistory.push({
            status: order.status,
            updatedBy: "SYSTEM", // Or sellerId if they confirmed success
            timestamp: new Date(),
            details: `Refund transaction completed successfully (simulated).`,
          });

          // --- Optionally return stock ---
          const updatePromises = order.cart
            .filter((item) => {
              // Only return stock for THIS seller's items
              const itemShopId = item.shopId?.toString() || item.shopId;
              return (
                itemShopId === sellerId.toString() &&
                item.productId &&
                isValidObjectId(item.productId)
              );
            })
            .map((item) =>
              updateProductStock(item.productId, -Math.abs(item.qty || 1))
            ); // Use negative quantity to add back

          Promise.all(updatePromises)
            .then(() =>
              console.log(`Stock returned for refunded items in order ${id}`)
            )
            .catch((err) =>
              console.error("Error returning product stock during refund:", err)
            );
          // --- End return stock ---
        }
      }
      // --- End Handle Refund Logic ---

      try {
        await order.save();
      } catch (validationError) {
        console.error("Process Refund Validation failed:", validationError);
        console.error("Order state before failed save:", order.toObject());
        return next(
          new ErrorHandler(
            `Processing refund failed: ${validationError.message}`,
            500
          )
        );
      }

      // Clear caches
      clearOrderCaches(id, order.user?._id?.toString(), sellerId.toString());

      res.status(200).json({
        success: true,
        message: `Order refund status updated to ${order.status}`, // Show final status
        order,
      });
    } catch (error) {
      console.error("Error processing refund by seller:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

/* -------------------------- Admin Order Operations -------------------------- */

/**
 * Get a specific order (admin access)
 * GET /api/v2/order/admin/order/:id
 * @authenticated @admin
 */
router.get(
  "/admin/order/:id",
  isAuthenticated,
  isAdmin,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { id } = req.params;

      // Validate ID format
      if (!isValidObjectId(id)) {
        return next(new ErrorHandler("Invalid order ID format", 400));
      }

      // Check cache first
      const cacheKey = CACHE_KEYS.ORDER_DETAIL(id);
      const cachedOrder = orderCache.get(cacheKey);
      if (cachedOrder) {
        console.log(`Returning cached admin order detail: ${id}`);
        return res.status(200).json({
          success: true,
          order: cachedOrder,
          fromCache: true,
        });
      }

      // Query database if not in cache
      const order = await Order.findById(id).lean();

      if (!order) {
        orderCache.del(cacheKey); // Invalidate cache if not found
        return next(new ErrorHandler("Order not found", 404));
      }

      // Cache the result
      orderCache.set(cacheKey, order);
      console.log(`Fetched admin order detail from DB: ${id}`);

      res.status(200).json({
        success: true,
        order,
        fromCache: false,
      });
    } catch (error) {
      console.error("Error fetching admin order:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

/**
 * Get all orders (admin access)
 * GET /api/v2/order/admin/all-orders
 * @authenticated @admin
 */
router.get(
  "/admin/all-orders",
  isAuthenticated,
  isAdmin,
  catchAsyncErrors(async (req, res, next) => {
    try {
      // Debug logging
      console.log("Admin all-orders endpoint accessed by user:", req.user?._id);

      // Check cache first
      const cacheKey = CACHE_KEYS.ADMIN_ORDERS;
      const cachedOrders = orderCache.get(cacheKey);

      if (cachedOrders) {
        console.log("Returning cached admin all orders");
        return res.status(200).json({
          success: true,
          orders: cachedOrders,
          count: cachedOrders.length,
          fromCache: true,
        });
      }

      // Query database
      const orders = await Order.find().sort({ createdAt: -1 }).lean();

      // Cache for future requests
      orderCache.set(cacheKey, orders);
      console.log(`Fetched ${orders.length} admin orders from DB`);

      res.status(200).json({
        success: true,
        orders,
        count: orders.length,
        fromCache: false,
      });
    } catch (error) {
      console.error("Error in admin/all-orders:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

/**
 * Update order status (admin access) - FIXED VERSION
 * PUT /api/v2/order/admin/update-status/:id
 * @authenticated @admin
 */
router.put(
  "/admin/update-status/:id",
  isAuthenticated,
  isAdmin,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const adminId = req.user._id;

      // Validate status
      const validStatuses = Object.values(ORDER_STATUSES); // Get all allowed statuses from constant/enum
      if (!status || !validStatuses.includes(status)) {
        return next(
          new ErrorHandler(`Invalid status provided: ${status}`, 400)
        );
      }
      // Validate ID format
      if (!isValidObjectId(id)) {
        return next(new ErrorHandler("Invalid order ID format", 400));
      }

      // Find the order
      const order = await Order.findById(id);
      if (!order) {
        return next(new ErrorHandler("Order not found", 404));
      }

      const previousStatus = order.status;

      // --- Apply Updates ---
      order.status = status;

      // Set delivery date if status is Delivered
      if (status === (ORDER_STATUSES.DELIVERED || "Delivered")) {
        order.deliveredAt = Date.now();

        // Update payment status for COD orders automatically
        if (
          order.paymentInfo &&
          order.paymentInfo.type === "Cash On Delivery" &&
          order.paymentInfo.status !== "Succeeded"
        ) {
          order.paymentInfo.status = "Succeeded";
          console.log(
            `Updated COD payment status to Succeeded for order ${id}`
          );
        }
      }

      // Add to status history
      order.statusHistory = order.statusHistory || [];
      order.statusHistory.push({
        status: status,
        updatedBy: adminId.toString(), // Mark as Admin update
        timestamp: new Date(),
        details: `Status changed from ${previousStatus} to ${status} by admin`,
      });
      // --- End Apply Updates ---

      // --- CRITICAL FIX: Recalculate totals BEFORE saving ---
      order.subtotal = order.cart.reduce(
        (sum, item) => sum + (item.price || 0) * (item.qty || 1),
        0
      );
      // Ensure shippingCost exists, use default if necessary
      order.shippingCost =
        order.shippingAddress?.shippingPrice ?? order.shippingCost ?? 50;
      order.totalPrice = order.subtotal + order.shippingCost;
      // --- End Recalculation ---

      // Attempt to save the updated order
      try {
        await order.save({ validateBeforeSave: true }); // Explicitly validate everything after recalculations
        console.log(
          `Admin successfully updated status for order ${id} to ${status}`
        );
      } catch (validationError) {
        console.error(
          "Admin Update Status - Validation failed even after recalculation:",
          validationError
        );
        // Log the state of 'order' right before the failed save for debugging
        console.error("Order state before failed save:", order.toObject());
        return next(
          new ErrorHandler(
            `Order update failed: ${validationError.message}`,
            500
          )
        );
      }

      // Clear caches (critical after update)
      clearOrderCaches(
        id,
        order.user?._id?.toString(),
        null // Let clearOrderCaches handle finding relevant sellers if needed
      );

      res.status(200).json({
        success: true,
        message: `Order status updated to ${status}`,
        order, // Send back the updated order
      });
    } catch (error) {
      // Catch any unexpected errors during findById or other non-save operations
      console.error(
        "Unexpected error during admin order status update:",
        error
      );
      // Ensure a standardized error response
      if (!(error instanceof ErrorHandler)) {
        error = new ErrorHandler(
          error.message || "An unexpected error occurred",
          500
        );
      }
      return next(error);
    }
  })
);

/**
 * Delete an order (admin access)
 * DELETE /api/v2/order/admin/delete/:id
 * @authenticated @admin
 */
router.delete(
  "/admin/delete/:id",
  isAuthenticated,
  isAdmin,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { id } = req.params;

      // Validate ID format
      if (!isValidObjectId(id)) {
        return next(new ErrorHandler("Invalid order ID format", 400));
      }

      // Find the order to get associated user/seller IDs for cache clearing BEFORE deleting
      const order = await Order.findById(id).select("user cart.shopId").lean();
      if (!order) {
        // If order doesn't exist, still return success, just report it.
        orderCache.del(CACHE_KEYS.ORDER_DETAIL(id)); // Clean potential bad cache entry
        orderCache.del(CACHE_KEYS.ADMIN_ORDERS); // Ensure admin list is refreshed
        console.log(`Order ${id} not found for deletion.`);
        return res.status(200).json({
          success: true,
          message: "Order not found or already deleted.",
        });
      }

      const userId = order.user?._id?.toString();
      const sellerIds = [
        ...new Set(
          order.cart.map((item) => item.shopId?.toString()).filter(Boolean)
        ),
      ];

      // Delete the order document itself
      const deleteResult = await Order.deleteOne({ _id: id });

      if (deleteResult.deletedCount === 0) {
        console.log(`Order ${id} could not be deleted (already gone?).`);
        // Might indicate a race condition, but still report success from client's perspective
      } else {
        console.log(`Admin deleted order ${id}`);
      }

      // Clear caches for the specific order, the user, related sellers, and the admin list
      const keysToDel = [CACHE_KEYS.ORDER_DETAIL(id), CACHE_KEYS.ADMIN_ORDERS];
      if (userId) {
        keysToDel.push(CACHE_KEYS.USER_ORDERS(userId));
      }
      sellerIds.forEach((sellerId) =>
        keysToDel.push(CACHE_KEYS.SELLER_ORDERS(sellerId))
      );

      orderCache.del(keysToDel);
      console.log("Cleared caches after order deletion:", keysToDel);

      res.status(200).json({
        success: true,
        message: "Order deleted successfully!",
      });
    } catch (error) {
      console.error("Error deleting order:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

/**
 * Update specific order item details (e.g., color, size after creation - Admin access)
 * PUT /api/v2/order/admin/update-item-details/:orderId/:itemId
 * @authenticated @admin
 */
router.put(
  "/admin/update-item-details/:orderId/:itemId",
  isAuthenticated,
  isAdmin,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { orderId, itemId } = req.params;
      const { ProductColor, size } = req.body; // Only allow updating specific fields
      const adminId = req.user._id;

      // Validate IDs format
      if (!isValidObjectId(orderId) || !itemId) {
        // itemId might not be ObjectId if using client-side IDs initially
        return next(new ErrorHandler("Invalid order or item ID format", 400));
      }

      // Find the order
      const order = await Order.findById(orderId);
      if (!order) {
        return next(new ErrorHandler("Order not found", 404));
      }

      // Find the item index in the cart
      const itemIndex = order.cart.findIndex(
        (item) => (item._id?.toString() || item._id) === itemId // Handle potential client-side vs db ID
      );

      if (itemIndex === -1) {
        return next(new ErrorHandler("Order item not found", 404));
      }

      // --- Apply Updates to Item ---
      let changesMade = [];
      if (
        ProductColor !== undefined &&
        order.cart[itemIndex].ProductColor !== ProductColor
      ) {
        order.cart[itemIndex].ProductColor = ProductColor;
        changesMade.push(`Color=${ProductColor}`);
      }
      if (size !== undefined && order.cart[itemIndex].size !== size) {
        order.cart[itemIndex].size = size;
        changesMade.push(`Size=${size}`);
      }

      if (changesMade.length === 0) {
        return res.status(200).json({
          success: true,
          message: "No changes detected for item details",
          order,
        });
      }

      // Add modification details to status history
      order.statusHistory = order.statusHistory || [];
      order.statusHistory.push({
        status: order.status, // Keep current status
        updatedBy: adminId.toString(),
        timestamp: new Date(),
        details: `Admin updated item (${itemId.slice(
          0,
          6
        )}...) details: ${changesMade.join(", ")}`,
      });

      // --- Recalculate totals just in case (though item price isn't changing here) ---
      order.subtotal = order.cart.reduce(
        (sum, item) => sum + (item.price || 0) * (item.qty || 1),
        0
      );
      order.shippingCost =
        order.shippingAddress?.shippingPrice ?? order.shippingCost ?? 50;
      order.totalPrice = order.subtotal + order.shippingCost;
      // --- End recalculation ---

      try {
        await order.save();
        console.log(
          `Admin updated details for item ${itemId} in order ${orderId}`
        );
      } catch (validationError) {
        console.error(
          "Admin Update Item Details - Validation failed:",
          validationError
        );
        console.error("Order state before failed save:", order.toObject());
        return next(
          new ErrorHandler(
            `Updating item details failed: ${validationError.message}`,
            500
          )
        );
      }

      // Clear relevant caches
      clearOrderCaches(orderId, order.user?._id?.toString(), null);

      res.status(200).json({
        success: true,
        message: `Item details (${changesMade.join(
          ", "
        )}) updated successfully`,
        order, // Send back the full updated order
      });
    } catch (error) {
      console.error("Error updating item details:", error);
      return next(
        error instanceof ErrorHandler
          ? error
          : new ErrorHandler(error.message, 500)
      );
    }
  })
);

/* ------------------------- Design & Mockup Operations ------------------------ */

/**
 * Download design data (URL and specs) for an order item (admin access only)
 * GET /api/v2/order/download-design/:orderId/:itemId
 * @authenticated @admin
 */
router.get(
  "/download-design/:orderId/:itemId",
  isAuthenticated,
  isAdmin,
  catchAsyncErrors(async (req, res, next) => {
    try {
      if (!req.user || !req.user._id) {
        return next(new ErrorHandler("Admin authentication required", 401));
      }
      const adminId = req.user._id;
      console.log(`Admin design download requested by: ${adminId}`);

      const { orderId, itemId } = req.params;

      // Validate ID formats
      if (!isValidObjectId(orderId) || !itemId) {
        return next(new ErrorHandler("Invalid order or item ID format", 400));
      }

      // Find the order
      const order = await Order.findById(orderId);
      if (!order) {
        return next(new ErrorHandler("Order not found", 404));
      }

      // Find the specific item in the order's cart
      const orderItem = order.cart.find(
        (item) => (item._id?.toString() || item._id) === itemId
      );
      if (!orderItem) {
        return next(new ErrorHandler("Order item not found", 404));
      }

      // --- Determine Design URL ---
      let designUrl = null;
      // Try getting from the item directly first (might have been saved during order creation)
      if (orderItem.designImage) {
        designUrl =
          typeof orderItem.designImage === "string"
            ? orderItem.designImage
            : orderItem.designImage.url;
      }

      // Fallback: Try finding the original product's design image
      if (
        !designUrl &&
        orderItem.productId &&
        isValidObjectId(orderItem.productId)
      ) {
        console.log(
          `Design URL not on item ${itemId}, looking up product ${orderItem.productId}`
        );
        try {
          const product = await Product.findById(orderItem.productId)
            .select("designImage")
            .lean();
          if (product && product.designImage && product.designImage.url) {
            designUrl = product.designImage.url;
            console.log(`Found design URL from product ${orderItem.productId}`);
          }
        } catch (prodError) {
          console.error(
            `Error fetching product ${orderItem.productId} for design URL:`,
            prodError
          );
        }
      }

      // Validate that we found a design URL
      if (!designUrl) {
        return next(
          new ErrorHandler(
            "Design image URL could not be determined for this item.",
            404
          )
        );
      }
      // --- End Determine Design URL ---

      // Add download action to status history (fire and forget, don't await save potentially)
      order.statusHistory = order.statusHistory || [];
      order.statusHistory.push({
        status: order.status,
        updatedBy: adminId.toString(),
        timestamp: new Date(),
        details: `Design downloaded by admin for item: ${
          orderItem.DesignTitle || "Untitled"
        } (${itemId.slice(0, 6)}...)`,
      });
      order.save({ validateBeforeSave: false }).catch((err) => {
        // Save history update asynchronously
        console.error(
          `Error saving history after design download for order ${orderId}:`,
          err
        );
      });

      // Prepare response data matching frontend expectations (DesignDownloader.downloadSingleDesign)
      const designDataForDownload = {
        imageUrl: designUrl, // URL to fetch the design
        url: designUrl, // Kept for compatibility if frontend uses 'url' directly somewhere else
        name: `${orderItem.DesignTitle || "design"}-${orderItem._id
          .toString()
          .slice(-6)}.png`, // Example filename base
        productTitle: orderItem.DesignTitle || "Untitled Design",
        orderId: order._id.toString(),
        itemId: orderItem._id.toString(), // Include item ID
        orderNumber: order._id.toString().slice(0, 8), // Short order ID
        price: {
          // Include price context
          itemPrice: orderItem.price || 0,
          quantity: orderItem.qty || 1,
          shippingCost: order.shippingCost || 0, // Order level shipping
          total: order.totalPrice || 0, // Order level total
        },
        specs: {
          type: orderItem.ProductType || "N/A",
          color: orderItem.ProductColor || "N/A",
          size: orderItem.size || "N/A",
          position: {
            // Use defaults if specs are missing
            positionX: orderItem.designSpecs?.positionX ?? 50,
            positionY: orderItem.designSpecs?.positionY ?? 50,
            scale: orderItem.designSpecs?.scale ?? 1,
            rotation: orderItem.designSpecs?.rotation ?? 0,
          },
        },
        // Add other useful meta like customer name/email?
        customer: {
          name: order.user?.name || "N/A",
          email: order.user?.email || "N/A",
        },
      };

      // Return success with the structured data
      return res.status(200).json({
        success: true,
        designUrl: designUrl, // Keep for potential direct frontend use
        designData: designDataForDownload, // Main payload for DesignDownloader
        message: "Design data retrieved successfully.",
      });
    } catch (error) {
      console.error("Error in download-design endpoint:", error);
      return next(
        new ErrorHandler(
          error.message || "Failed to retrieve design data",
          error.statusCode || 500
        )
      );
    }
  })
);

/**
 * Generate mockup for an order item (admin access only)
 * GET /api/v2/order/generate-mockup/:orderId/:itemId
 * @authenticated @admin
 * @deprecated - Relies on DesignProcessor utility which might be client-side or need specific server setup. Provided logic is a basic placeholder.
 */
router.get(
  "/generate-mockup/:orderId/:itemId",
  isAuthenticated,
  isAdmin,
  catchAsyncErrors(async (req, res, next) => {
    // NOTE: Server-side mockup generation requires a graphics library (like Sharp or node-canvas)
    // AND access to product template images.
    // The client-side approach (using DesignDownloader.createProductMockup) might be more practical.
    // This endpoint acts as a placeholder demonstrating the concept.
    try {
      if (!req.user || !req.user._id) {
        return next(new ErrorHandler("Admin authentication required", 401));
      }
      const adminId = req.user._id;
      console.log(`Admin mockup generation requested by: ${adminId}`);

      const { orderId, itemId } = req.params;
      if (!isValidObjectId(orderId) || !itemId) {
        return next(new ErrorHandler("Invalid order or item ID format", 400));
      }

      const order = await Order.findById(orderId).lean(); // Lean ok if just reading
      if (!order) {
        return next(new ErrorHandler("Order not found", 404));
      }

      const orderItem = order.cart.find(
        (item) => (item._id?.toString() || item._id) === itemId
      );
      if (!orderItem) {
        return next(new ErrorHandler("Order item not found", 404));
      }

      // --- Mockup Generation Logic ---
      // Example using a hypothetical DesignProcessor utility
      // You would need to implement this utility using Sharp/Canvas
      if (
        !DesignProcessor ||
        typeof DesignProcessor.processOrderItem !== "function"
      ) {
        console.warn(
          "DesignProcessor utility is not available or properly configured."
        );
        return next(
          new ErrorHandler(
            "Server-side mockup generation is not available.",
            501
          )
        ); // 501 Not Implemented
      }

      const designUrl = orderItem.designImage?.url || orderItem.designImage;
      if (!designUrl) {
        return next(
          new ErrorHandler("Design image URL missing for item.", 404)
        );
      }

      const mockupData = {
        designImageUrl: designUrl,
        productType: orderItem.ProductType || "hoodie",
        productColor: orderItem.ProductColor || "white",
        designSpecs: orderItem.designSpecs || {},
      };

      // This function needs to return a path to the generated image or a buffer
      const mockupResult = await DesignProcessor.processOrderItem(mockupData);
      const mockupPath = typeof mockupResult === "string" ? mockupResult : null; // Assuming it returns path
      const mockupBuffer = Buffer.isBuffer(mockupResult) ? mockupResult : null; // Assuming it returns buffer

      if (!mockupPath && !mockupBuffer) {
        return next(new ErrorHandler("Failed to generate mockup image.", 500));
      }

      // --- End Mockup Generation ---

      // --- Send File Response ---
      res.setHeader("Content-Type", "image/png");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="mockup_${orderId}_${itemId}.png"`
      );

      if (mockupBuffer) {
        res.send(mockupBuffer);
      } else if (mockupPath && fs.existsSync(mockupPath)) {
        const fileStream = fs.createReadStream(mockupPath);
        fileStream.pipe(res);

        fileStream.on("end", () => {
          fs.unlink(mockupPath, (err) => {
            // Async unlink
            if (err)
              console.error(
                `Error deleting temp mockup file ${mockupPath}:`,
                err
              );
          });
        });

        fileStream.on("error", (err) => {
          console.error("Error streaming mockup file:", err);
          if (!res.headersSent) {
            next(new ErrorHandler("Error streaming mockup file", 500));
          } else {
            // Harder to handle if headers already sent, maybe just log
            console.error(
              "Headers sent, cannot send error response for mockup stream fail."
            );
          }
        });
      } else {
        return next(new ErrorHandler("Generated mockup file not found.", 500));
      }
      // --- End Send File Response ---

      // Add history entry (async) - Don't fetch order again, just update original non-lean potentially
      Order.findByIdAndUpdate(orderId, {
        $push: {
          statusHistory: {
            status: order.status,
            updatedBy: adminId.toString(),
            timestamp: new Date(),
            details: `Mockup generated by admin for item: ${
              orderItem.DesignTitle || "Untitled"
            } (${itemId.slice(0, 6)}...)`,
          },
        },
      })
        .exec()
        .catch((err) =>
          console.error("Error updating history after mockup gen:", err)
        );
    } catch (error) {
      console.error("Error generating mockup:", error);
      return next(
        new ErrorHandler(error.message || "Mockup generation failed", 500)
      );
    }
  })
);

/**
 * Download comprehensive order specifications as JSON (Admin/User/Seller access with validation)
 * GET /api/v2/order/download-specs/:id
 * @authenticated (Role checked inside)
 */
router.get(
  "/download-specs/:id",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { id } = req.params;
      if (!req.user || !req.user._id) {
        return next(new ErrorHandler("Authentication required.", 401));
      }
      const userId = req.user._id.toString();
      const userRole = req.user.role?.toLowerCase() || "user"; // Default to user role if missing

      // Validate ID format
      if (!isValidObjectId(id)) {
        return next(new ErrorHandler("Invalid order ID format", 400));
      }

      // Find the order
      const order = await Order.findById(id).populate(
        "cart.shopId",
        "name email"
      ); // Populate seller info
      if (!order) {
        return next(new ErrorHandler("Order not found", 404));
      }

      // --- Authorization Check ---
      const isOrderOwner =
        order.user && order.user._id && order.user._id.toString() === userId;
      const isAdminUser = userRole === "admin";
      // Check if user is a seller whose items are in this order
      const sellerIdFromReq = req.seller?._id?.toString(); // Get seller ID if available from isSeller middleware context
      const isOrderSeller =
        userRole === "seller" &&
        order.cart.some(
          (item) => item.shopId?._id?.toString() === sellerIdFromReq
        );

      if (!isAdminUser && !isOrderOwner && !isOrderSeller) {
        console.warn(
          `Unauthorized spec download attempt: User ${userId} (Role: ${userRole}) on Order ${id}`
        );
        return next(
          new ErrorHandler(
            "Not authorized to access this order's specifications",
            403
          )
        );
      }
      // --- End Authorization Check ---

      // --- Prepare Specifications Data ---
      // Recalculate totals to be safe
      const calculatedSubtotal = order.cart.reduce(
        (sum, item) => sum + (item.price || 0) * (item.qty || 1),
        0
      );
      const shippingCost =
        order.shippingCost ?? order.shippingAddress?.shippingPrice ?? 50;
      const calculatedTotal = calculatedSubtotal + shippingCost;

      const specsData = {
        orderInfo: {
          orderId: order._id.toString(),
          orderNumber: order._id.toString().slice(0, 8),
          orderDate: order.createdAt,
          status: order.status,
          paymentMethod: order.paymentInfo?.type || "Cash On Delivery",
          paymentStatus: order.paymentInfo?.status || "Processing",
          subtotal: calculatedSubtotal,
          shippingCost: shippingCost,
          total: calculatedTotal,
          paidAt: order.paidAt,
          deliveredAt: order.deliveredAt,
        },
        customer: {
          id: order.user?._id?.toString() || "N/A",
          name: order.user?.name || "Anonymous",
          email: order.user?.email || "N/A",
          phoneNumber:
            order.user?.phoneNumber ||
            order.shippingAddress?.phoneNumber ||
            "N/A",
        },
        shipping: {
          address1: order.shippingAddress?.address1 || "N/A",
          address2: order.shippingAddress?.address2 || "",
          city: order.shippingAddress?.city || "N/A",
          country: order.shippingAddress?.country || "N/A",
          postalCode: order.shippingAddress?.postalCode || "N/A",
        },
        items: order.cart.map((item) => ({
          itemId: item._id?.toString(),
          productId: item.productId?.toString() || null,
          designTitle: item.DesignTitle || "Untitled",
          productType: item.ProductType || "N/A",
          productColor: item.ProductColor || "N/A",
          productSize: item.size || "N/A",
          quantity: item.qty || 1,
          unitPrice: item.price || 0,
          itemTotal: (item.price || 0) * (item.qty || 1),
          designImageUrl:
            typeof item.designImage === "string"
              ? item.designImage
              : item.designImage?.url,
          designSpecs: {
            positionX: item.designSpecs?.positionX ?? 50,
            positionY: item.designSpecs?.positionY ?? 50,
            scale: item.designSpecs?.scale ?? 1,
            rotation: item.designSpecs?.rotation ?? 0,
          },
          mockupImageUrl: item.mockupImage?.url || null,
          printReadyFileUrl: item.printReadyFile?.url || null,
          seller: {
            // Use populated data
            id: item.shopId?._id?.toString() || "N/A",
            name: item.shopId?.name || "Unknown",
            email: item.shopId?.email || "N/A",
          },
        })),
        statusHistory: order.statusHistory || [],
        deliveryInfo: order.deliveryInfo || null,
        printingDetails: order.printingDetails || null, // Include printing details if available
        _metadata: {
          // Add metadata about the export
          exportedAt: new Date().toISOString(),
          exportedBy: userId,
          exportVersion: "1.0",
        },
      };
      // --- End Prepare Data ---

      // Send JSON response
      res.setHeader("Content-Type", "application/json");
      // Optionally suggest a filename if downloaded directly via browser URL
      // res.setHeader('Content-Disposition', `attachment; filename="order_specs_${id}.json"`);
      res.status(200).json({
        success: true,
        specsData,
        message: "Order specifications retrieved successfully.",
      });
    } catch (error) {
      console.error("Error downloading specs:", error);
      return next(
        new ErrorHandler(
          error.message || "Failed to retrieve order specifications",
          500
        )
      );
    }
  })
);

/* ------------------------ User Order Operations ------------------------ */

/**
 * Request refund for an order (USER ACTION)
 * PUT /api/v2/order/request-refund/:id
 * @authenticated
 */
router.put(
  "/request-refund/:id",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { id } = req.params;
      const { reason } = req.body; // User provides reason
      if (!req.user || !req.user._id) {
        return next(new ErrorHandler("User authentication required", 401));
      }
      const userId = req.user._id;

      // Constant for the status user sets
      const refundRequestStatus =
        ORDER_STATUSES.REFUND_REQUESTED || "Processing refund";

      // Validate ID format
      if (!isValidObjectId(id)) {
        return next(new ErrorHandler("Invalid order ID format", 400));
      }

      // Find the order
      const order = await Order.findById(id);
      if (!order) {
        return next(new ErrorHandler("Order not found", 404));
      }

      // Verify user owns this order
      if (
        !order.user ||
        !order.user._id ||
        order.user._id.toString() !== userId.toString()
      ) {
        console.warn(
          `User ${userId} attempted refund request for order ${id} not belonging to them.`
        );
        return next(
          new ErrorHandler(
            "Not authorized to request refund for this order",
            403
          )
        );
      }

      // Check if order is eligible for refund request
      // (e.g., status is Delivered, Received, etc., NOT already refunded/cancelled/pending refund)
      const nonRefundableStatuses = [
        ORDER_STATUSES.REFUND_REQUESTED || "Processing refund",
        ORDER_STATUSES.REFUND_APPROVED || "Refund Approved",
        ORDER_STATUSES.REFUND_SUCCESS || "Refund Success",
        ORDER_STATUSES.REFUND_REJECTED || "Refund Rejected",
        ORDER_STATUSES.CANCELLED || "Cancelled",
      ];
      if (nonRefundableStatuses.includes(order.status)) {
        return next(
          new ErrorHandler(
            `Cannot request refund. Order status is currently: ${order.status}`,
            400
          )
        );
      }
      // You might add a time limit check here (e.g., within 14 days of delivery)
      // if (order.deliveredAt && (Date.now() - new Date(order.deliveredAt).getTime()) > 14 * 24 * 60 * 60 * 1000) {
      //     return next(new ErrorHandler("Refund period has expired.", 400));
      // }

      // --- Apply Update ---
      const previousStatus = order.status;
      order.status = refundRequestStatus;

      // Add to status history
      order.statusHistory = order.statusHistory || [];
      order.statusHistory.push({
        status: refundRequestStatus,
        updatedBy: userId.toString(),
        timestamp: new Date(),
        details: reason
          ? `Refund requested by customer. Reason: ${reason}`
          : "Refund requested by customer.",
      });
      // --- End Apply Update ---

      // --- Recalculate totals before saving (belt-and-suspenders) ---
      order.subtotal = order.cart.reduce(
        (sum, item) => sum + (item.price || 0) * (item.qty || 1),
        0
      );
      order.shippingCost =
        order.shippingAddress?.shippingPrice ?? order.shippingCost ?? 50;
      order.totalPrice = order.subtotal + order.shippingCost;
      // --- End recalculation ---

      try {
        await order.save(); // Use default validation
      } catch (validationError) {
        console.error(
          "User Refund Request - Validation failed:",
          validationError
        );
        console.error("Order state before failed save:", order.toObject());
        return next(
          new ErrorHandler(
            `Submitting refund request failed: ${validationError.message}`,
            500
          )
        );
      }

      // Clear relevant caches
      clearOrderCaches(
        id,
        userId.toString(),
        null // Clear all seller caches involved + admin
      );

      // TODO: Notify Seller(s) and Admin about the refund request (e.g., via email, notification system)

      res.status(200).json({
        success: true,
        order, // Return updated order
        message: "Refund request submitted successfully!",
      });
    } catch (error) {
      console.error("Error requesting refund:", error);
      return next(
        error instanceof ErrorHandler
          ? error
          : new ErrorHandler(error.message, 500)
      );
    }
  })
);

/* ------------------------ Delivery & Tracking Operations (External System Integration Points) ------------------------ */

/**
 * Update delivery status (Usually called by Delivery Partner's webhook or API)
 * PUT /api/v2/order/update-delivery/:orderId (using ID in path for RESTfulness)
 * Authentication via API Key expected in headers/body
 */
router.put(
  "/update-delivery/:orderId", // Changed from body to path param
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { orderId } = req.params;
      const {
        status,
        location,
        notes,
        timestamp,
        eventId,
        trackingNumber,
        apiKey,
      } = req.body; // Get details from webhook payload

      // 1. API Key Authentication (Replace with your actual secure method)
      const DELIVERY_PARTNER_API_KEY = process.env.DELIVERY_API_KEY; // Ensure this is set
      if (
        !apiKey ||
        !DELIVERY_PARTNER_API_KEY ||
        apiKey !== DELIVERY_PARTNER_API_KEY
      ) {
        console.warn("Invalid or missing delivery API key attempt.");
        return next(
          new ErrorHandler("Invalid delivery partner credentials", 401)
        );
      }

      // 2. Basic Payload Validation
      if (!status) {
        return next(new ErrorHandler("Delivery status is required", 400));
      }
      if (!isValidObjectId(orderId)) {
        return next(new ErrorHandler("Invalid order ID format", 400));
      }

      // 3. Find the Order
      const order = await Order.findById(orderId);
      if (!order) {
        console.warn(
          `Delivery update received for non-existent order: ${orderId}`
        );
        // Return 2xx to webhook provider to prevent retries, but log error.
        return res
          .status(200)
          .json({
            success: false,
            message: "Order not found, update ignored.",
          });
      }

      // 4. Verify Delivery Info Exists (should have been set during assignment)
      if (!order.deliveryInfo || !order.deliveryInfo.trackingNumber) {
        console.warn(
          `Received delivery update for order ${orderId} without assigned delivery info.`
        );
        // Consider creating deliveryInfo structure here if needed, or ignore update.
        // For now, ignore:
        return res
          .status(200)
          .json({
            success: false,
            message: "Delivery info not found for this order, update ignored.",
          });
      }

      // Optional: Verify tracking number matches if provided in payload
      if (
        trackingNumber &&
        order.deliveryInfo.trackingNumber !== trackingNumber
      ) {
        console.warn(
          `Tracking number mismatch for order ${orderId}. Expected ${order.deliveryInfo.trackingNumber}, got ${trackingNumber}.`
        );
        // Decide how to handle: ignore, flag, etc. Ignoring for now.
        return res
          .status(200)
          .json({
            success: false,
            message: "Tracking number mismatch, update ignored.",
          });
      }

      // 5. Idempotency Check (Optional but Recommended)
      // If the webhook provides an eventId, check if we've processed it already
      // const existingEvent = await DeliveryUpdateLog.findOne({ eventId });
      // if (existingEvent) {
      //     console.log(`Duplicate delivery event received: ${eventId}`);
      //     return res.status(200).json({ success: true, message: "Duplicate event ignored." });
      // }
      // await DeliveryUpdateLog.create({ eventId, orderId, status, timestamp });

      // 6. Update Delivery Info fields
      const updateTimestamp = timestamp ? new Date(timestamp) : new Date(); // Use provided timestamp or now

      // Check if this update is newer than the last recorded update
      if (
        order.deliveryInfo.lastUpdate &&
        updateTimestamp < new Date(order.deliveryInfo.lastUpdate)
      ) {
        console.log(
          `Stale delivery update received for order ${orderId}, ignoring.`
        );
        return res
          .status(200)
          .json({ success: true, message: "Stale update ignored." });
      }

      order.deliveryInfo.status = status; // e.g., 'in_transit', 'delivered'
      order.deliveryInfo.currentLocation =
        location || order.deliveryInfo.currentLocation; // Update if provided
      order.deliveryInfo.lastUpdate = updateTimestamp;

      // Add notes if provided
      if (notes) {
        order.deliveryInfo.notes = order.deliveryInfo.notes || [];
        order.deliveryInfo.notes.push({
          message: notes,
          timestamp: updateTimestamp,
        });
      }

      // 7. Update Main Order Status based on Delivery Status (Critical)
      const previousOrderStatus = order.status;
      let newOrderStatus = order.status; // Assume no change unless specified

      if (status.toLowerCase() === "delivered") {
        newOrderStatus = ORDER_STATUSES.DELIVERED || "Delivered";
        if (!order.deliveredAt) {
          // Only set deliveredAt once
          order.deliveredAt = updateTimestamp;
        }
        // Update payment status for COD orders
        if (
          order.paymentInfo &&
          order.paymentInfo.type === "Cash On Delivery" &&
          order.paymentInfo.status !== "Succeeded"
        ) {
          order.paymentInfo.status = "Succeeded";
          console.log(
            `Webhook updated COD payment status for order ${orderId}`
          );
        }
      } else if (
        status.toLowerCase().includes("shipping") ||
        status.toLowerCase().includes("in_transit")
      ) {
        newOrderStatus = ORDER_STATUSES.SHIPPING || "Shipping";
      } else if (status.toLowerCase().includes("out_for_delivery")) {
        newOrderStatus = ORDER_STATUSES.ON_THE_WAY || "On the way";
      } // Add more mappings as needed

      // Only update if status changed
      if (newOrderStatus !== order.status) {
        order.status = newOrderStatus;
        order.statusHistory = order.statusHistory || [];
        order.statusHistory.push({
          status: newOrderStatus,
          updatedBy: "delivery_partner_webhook",
          timestamp: updateTimestamp,
          details: `Delivery update: ${status}${
            location ? " at " + location : ""
          }`,
        });
        console.log(
          `Order ${orderId} status updated to ${newOrderStatus} based on delivery webhook.`
        );
      }

      // 8. Recalculate totals (just to be safe)
      order.subtotal = order.cart.reduce(
        (sum, item) => sum + (item.price || 0) * (item.qty || 1),
        0
      );
      order.shippingCost =
        order.shippingAddress?.shippingPrice ?? order.shippingCost ?? 50;
      order.totalPrice = order.subtotal + order.shippingCost;

      // 9. Save the Order
      try {
        await order.save();
        console.log(
          `Successfully processed delivery update for order ${orderId}, status: ${status}`
        );
      } catch (validationError) {
        console.error(
          "Delivery Update Webhook - Validation failed:",
          validationError
        );
        console.error("Order state before failed save:", order.toObject());
        // Still return 200 to webhook if possible, but log internal error
        return res
          .status(200)
          .json({
            success: false,
            message: "Internal validation error saving delivery update.",
          });
      }

      // 10. Clear Caches
      clearOrderCaches(orderId, order.user?._id?.toString(), null);

      // 11. Respond to Webhook (usually 200 OK)
      res.status(200).json({
        success: true,
        message: "Delivery status update received and processed successfully",
      });
    } catch (error) {
      console.error("Error processing delivery status webhook:", error);
      // Try to return 200 to prevent webhook retries, log the internal error
      res
        .status(200)
        .json({
          success: false,
          message: `Internal server error processing update: ${error.message}`,
        });
      // Optionally use `next(error)` if you want your main error handler to catch it, but webhooks often expect 2xx.
    }
  })
);

/**
 * Get delivery tracking information (Public/User endpoint)
 * GET /api/v2/order/tracking/:orderId
 */
router.get(
  "/tracking/:orderId",
  // Optional: Add isAuthenticated if only logged-in users can track
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { orderId } = req.params;

      // Validate ID format
      if (!isValidObjectId(orderId)) {
        return next(new ErrorHandler("Invalid order ID format", 400));
      }

      // Find the order, select only relevant fields
      const order = await Order.findById(orderId)
        .select("status deliveryInfo _id user") // Select fields needed
        .lean();

      if (!order) {
        return next(new ErrorHandler("Order not found", 404));
      }

      // Check if delivery info exists
      if (!order.deliveryInfo || !order.deliveryInfo.trackingNumber) {
        return next(
          new ErrorHandler(
            "Delivery tracking information is not yet available for this order",
            404
          )
        );
      }

      // Return tracking information in a structured way
      res.status(200).json({
        success: true,
        tracking: {
          orderId: order._id.toString(),
          orderStatus: order.status, // Current main status
          deliveryStatus: order.deliveryInfo.status || "Pending",
          trackingNumber: order.deliveryInfo.trackingNumber,
          deliveryPartner: order.deliveryInfo.partnerId || "Unknown",
          currentLocation:
            order.deliveryInfo.currentLocation || "Info not available",
          lastUpdate: order.deliveryInfo.lastUpdate || null,
          assignedAt: order.deliveryInfo.assignedAt || null,
          estimatedDelivery: order.deliveryInfo.estimatedDelivery || null, // Add if you store this
          updatesHistory: (order.deliveryInfo.notes || [])
            .map((note) => ({
              // Format notes nicely
              message: note.message,
              timestamp: note.timestamp,
            }))
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)), // Sort newest first
        },
      });
    } catch (error) {
      console.error("Error fetching tracking info:", error);
      return next(
        new ErrorHandler(
          error.message || "Failed to retrieve tracking information",
          500
        )
      );
    }
  })
);

// Export the router
module.exports = router;