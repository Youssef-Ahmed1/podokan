const express = require("express");
const router = express.Router();
const Order = require("../model/order");
const Shop = require("../model/shop");
const Product = require("../model/product");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { ORDER_STATUSES } = require("../constants/orderStatuses");
const NodeCache = require("node-cache");
const { isAuthenticated, isSeller, isAdmin } = require("../middleware/auth");
const DesignProcessor = require("../utils/designProcessor");
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
 * @param {string} sellerId - Seller ID associated with order
 */
const clearOrderCaches = (orderId, userId, sellerId) => {
  // Clear specific order cache
  if (orderId) {
    orderCache.del(CACHE_KEYS.ORDER_DETAIL(orderId));
  }

  // Clear user orders cache if applicable
  if (userId) {
    orderCache.del(CACHE_KEYS.USER_ORDERS(userId));
  }

  // Clear seller orders cache if applicable
  if (sellerId) {
    orderCache.del(CACHE_KEYS.SELLER_ORDERS(sellerId));
  }

  // Always clear admin cache as it contains all orders
  orderCache.del(CACHE_KEYS.ADMIN_ORDERS);
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
      const { cart, shippingAddress, user, totalPrice, paymentInfo } = req.body;

      // Validate required fields
      if (!cart || !Array.isArray(cart) || cart.length === 0) {
        return next(new ErrorHandler("Cart is empty or invalid", 400));
      }

      if (!shippingAddress || !user) {
        return next(
          new ErrorHandler("Missing required order information", 400)
        );
      }

      // Ensure shipping price is captured explicitly
      const shippingCost = shippingAddress.shippingPrice || 50; // Default to 50 if not provided

      // Group items by seller (shop)
      const shopItemsMap = new Map();

      cart.forEach((item) => {
        if (!item.shopId) {
          console.warn("Item without shopId found in cart:", item);
          return; // Skip invalid items
        }

        const shopId = item.shopId.toString();
        if (!shopItemsMap.has(shopId)) {
          shopItemsMap.set(shopId, []);
        }
        shopItemsMap.get(shopId).push(item);
      });

      // Create one order per seller
      const orders = [];
      const orderPromises = [];

      for (const [shopId, items] of shopItemsMap) {
        // Calculate subtotal for this seller's items
        const subtotal = items.reduce(
          (total, item) => total + (item.price || 0) * (item.qty || 1),
          0
        );

        // Prepare order document
        const orderData = {
          cart: items,
          shippingAddress: {
            ...shippingAddress,
            shippingPrice: shippingCost,
          },
          user,
          subtotal: subtotal,
          shippingCost: shippingCost,
          totalPrice: subtotal + shippingCost,
          paymentInfo,
          status: "Processing",
          statusHistory: [
            {
              status: "Processing",
              updatedBy: user._id,
              timestamp: new Date(),
            },
          ],
          createdAt: Date.now(),
        };

        // Create order in database
        orderPromises.push(
          Order.create(orderData)
            .then((order) => {
              orders.push(order);

              // Update product stock in the background
              order.cart.forEach((item) => {
                if (item.productId) {
                  updateProductStock(item.productId, item.qty || 1);
                }
              });
            })
            .catch((error) => {
              console.error("Error creating order for shop", shopId, error);
              throw error; // Re-throw to be caught by the outer catch block
            })
        );
      }

      // Wait for all orders to be created
      await Promise.all(orderPromises);

      // Clear relevant caches
      if (user && user._id) {
        clearOrderCaches(null, user._id.toString());
      }

      // Return success response with created orders
      res.status(201).json({
        success: true,
        orders,
      });
    } catch (error) {
      console.error("Error creating order:", error);
      return next(new ErrorHandler(error.message, 500));
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
      const orders = await Order.find({
        "user._id": userId,
      }).sort({ createdAt: -1 });

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
 * Get a single order by ID (public, requires ownership validation)
 * GET /api/v2/order/get-order/:id
 */
router.get(
  "/get-order/:id",
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
        return res.status(200).json({
          success: true,
          order: cachedOrder,
          fromCache: true,
        });
      }

      // Query database
      const order = await Order.findById(id);

      if (!order) {
        return next(new ErrorHandler("Order not found", 404));
      }

      // Cache the result
      orderCache.set(cacheKey, order);

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
 * Get all orders for the authenticated seller
 * GET /api/v2/order/get-seller-orders
 * @authenticated @seller
 */
router.get(
  "/get-seller-orders",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      // Ensure seller is authenticated
      if (!req.seller || !req.seller._id) {
        return next(new ErrorHandler("Seller authentication required", 401));
      }

      const sellerId = req.seller._id.toString();
      console.log("Fetching orders for seller:", sellerId);

      // Check cache
      const cacheKey = CACHE_KEYS.SELLER_ORDERS(sellerId);
      const cachedOrders = orderCache.get(cacheKey);

      if (cachedOrders) {
        return res.status(200).json({
          success: true,
          orders: cachedOrders,
          count: cachedOrders.length,
          fromCache: true,
        });
      }

      // First try direct query with dot notation for embedded documents
      let orders = await Order.find({
        "cart.shopId": sellerId,
      }).sort({ createdAt: -1 });

      // If no orders found, try with string comparison (to handle ObjectID vs string issues)
      if (!orders || orders.length === 0) {
        console.log("No direct matches, trying string comparison");
        const allOrders = await Order.find().sort({ createdAt: -1 });

        orders = allOrders.filter((order) => {
          return order.cart.some((item) => {
            const itemShopId = item.shopId?.toString() || item.shopId;
            return itemShopId === sellerId;
          });
        });
      }

      // Process orders to include only this seller's items in each order
      const processedOrders = orders.map((order) => {
        const orderObj = order.toObject();
        orderObj.cart = orderObj.cart.filter((item) => {
          const itemShopId = item.shopId?.toString() || item.shopId;
          return itemShopId === sellerId;
        });
        return orderObj;
      });

      // Cache processed orders
      orderCache.set(cacheKey, processedOrders);

      res.status(200).json({
        success: true,
        orders: processedOrders,
        count: processedOrders.length,
      });
    } catch (error) {
      console.error("Error in get-seller-orders:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

/**
 * Get a specific order for the authenticated seller
 * GET /api/v2/order/get-seller-order/:id
 * @authenticated @seller
 */
router.get(
  "/get-seller-order/:id",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { id } = req.params;
      const sellerId = req.seller._id.toString();

      // Validate ID format
      if (!isValidObjectId(id)) {
        return next(new ErrorHandler("Invalid order ID format", 400));
      }

      // Find order where seller has items in the cart
      const order = await Order.findOne({
        _id: id,
        cart: {
          $elemMatch: {
            shopId: sellerId,
          },
        },
      });

      if (!order) {
        return next(new ErrorHandler("Order not found or not authorized", 404));
      }

      // Filter cart to only show this seller's items
      const orderObj = order.toObject();
      orderObj.cart = orderObj.cart.filter((item) => {
        const itemShopId = item.shopId?.toString() || item.shopId;
        return itemShopId === sellerId;
      });

      res.status(200).json({
        success: true,
        order: orderObj,
      });
    } catch (error) {
      console.error("Error fetching seller order:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

/**
 * Assign a delivery partner to an order
 * POST /api/v2/order/assign-delivery
 * @authenticated @seller
 */
router.post(
  "/assign-delivery",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { orderId, deliveryPartnerId, trackingNumber } = req.body;
      const sellerId = req.seller._id;

      // Validate required fields
      if (!orderId || !deliveryPartnerId || !trackingNumber) {
        return next(
          new ErrorHandler("Missing required delivery information", 400)
        );
      }

      // Validate ID format
      if (!isValidObjectId(orderId)) {
        return next(new ErrorHandler("Invalid order ID format", 400));
      }

      // Find the order
      const order = await Order.findById(orderId);

      if (!order) {
        return next(new ErrorHandler("Order not found", 404));
      }

      // Verify seller is authorized for this order
      const hasSellerItems = order.cart.some((item) => {
        const itemShopId = item.shopId?.toString() || item.shopId;
        return itemShopId === sellerId.toString();
      });

      if (!hasSellerItems) {
        return next(
          new ErrorHandler("Not authorized to manage this order", 403)
        );
      }

      // Update order with delivery information
      order.deliveryInfo = {
        partnerId: deliveryPartnerId,
        trackingNumber: trackingNumber,
        status: "assigned",
        assignedAt: new Date(),
        lastUpdate: new Date(),
      };

      // Update order status
      order.status = ORDER_STATUSES.TRANSFERRED;

      // Add to status history
      order.statusHistory = order.statusHistory || [];
      order.statusHistory.push({
        status: ORDER_STATUSES.TRANSFERRED,
        updatedBy: sellerId,
        timestamp: new Date(),
        details: `Assigned to delivery partner: ${deliveryPartnerId}, tracking: ${trackingNumber}`,
      });

      await order.save();

      // Clear caches
      clearOrderCaches(
        orderId,
        order.user?._id?.toString(),
        sellerId.toString()
      );

      res.status(200).json({
        success: true,
        message: "Delivery partner assigned successfully",
        order,
      });
    } catch (error) {
      console.error("Error assigning delivery partner:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

/**
 * Accept refund request for an order
 * PUT /api/v2/order/accept-refund/:id
 * @authenticated @seller
 */
router.put(
  "/accept-refund/:id",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const sellerId = req.seller._id;

      // Validate status
      if (
        !status ||
        !["Refund Approved", "Refund Rejected", "Refund Success"].includes(
          status
        )
      ) {
        return next(new ErrorHandler("Invalid refund status", 400));
      }

      // Validate ID format
      if (!isValidObjectId(id)) {
        return next(new ErrorHandler("Invalid order ID format", 400));
      }

      // Find the order
      const order = await Order.findById(id);

      if (!order) {
        return next(new ErrorHandler("Order not found", 400));
      }

      // Verify seller is authorized for this order
      const hasSellerItems = order.cart.some((item) => {
        const itemShopId = item.shopId?.toString() || item.shopId;
        return itemShopId === sellerId.toString();
      });

      if (!hasSellerItems) {
        return next(
          new ErrorHandler("Not authorized to manage this order", 403)
        );
      }

      // Update order status
      order.status = status;

      // Add to status history
      order.statusHistory = order.statusHistory || [];
      order.statusHistory.push({
        status: status,
        updatedBy: sellerId,
        timestamp: new Date(),
        details: `Refund ${
          status === "Refund Rejected" ? "rejected" : "processed"
        } by seller`,
      });

      await order.save();

      // Clear caches
      clearOrderCaches(id, order.user?._id?.toString(), sellerId.toString());

      // Return stock to inventory if refund is successful
      if (status === "Refund Success") {
        const updatePromises = order.cart
          .filter((item) => {
            const itemShopId = item.shopId?.toString() || item.shopId;
            return itemShopId === sellerId.toString() && item.productId;
          })
          .map((item) => updateProductStock(item.productId, -(item.qty || 1)));

        // Run stock updates in the background
        Promise.all(updatePromises).catch((err) =>
          console.error("Error updating product stocks for refund:", err)
        );
      }

      res.status(200).json({
        success: true,
        message: `Order refund ${
          status === "Refund Rejected" ? "rejected" : "processed"
        } successfully`,
        order,
      });
    } catch (error) {
      console.error("Error processing refund:", error);
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

      // Check cache
      const cacheKey = CACHE_KEYS.ORDER_DETAIL(id);
      const cachedOrder = orderCache.get(cacheKey);

      if (cachedOrder) {
        return res.status(200).json({
          success: true,
          order: cachedOrder,
          fromCache: true,
        });
      }

      // Query database
      const order = await Order.findById(id);

      if (!order) {
        return next(new ErrorHandler("Order not found", 404));
      }

      // Cache for future requests
      orderCache.set(cacheKey, order);

      res.status(200).json({
        success: true,
        order,
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
      console.log("Admin role check passed for user:", req.user._id);

      // Check cache
      const cacheKey = CACHE_KEYS.ADMIN_ORDERS;
      const cachedOrders = orderCache.get(cacheKey);

      if (cachedOrders) {
        return res.status(200).json({
          success: true,
          orders: cachedOrders,
          count: cachedOrders.length,
          fromCache: true,
        });
      }

      // Query database
      const orders = await Order.find().sort({
        createdAt: -1,
      });

      // Cache for future requests
      orderCache.set(cacheKey, orders);

      res.status(200).json({
        success: true,
        orders,
        count: orders.length,
      });
    } catch (error) {
      console.error("Error in admin/all-orders:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

/**
 * Update order status (admin access)
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
      if (!status) {
        return next(new ErrorHandler("Status is required", 400));
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

      // Update status
      order.status = status;

      // Set delivery date if status is Delivered
      if (status === "Delivered") {
        order.deliveredAt = Date.now();

        // Update payment status for COD orders
        if (
          order.paymentInfo &&
          order.paymentInfo.type === "Cash On Delivery"
        ) {
          order.paymentInfo.status = "Succeeded";
        }
      }

      // Add to status history
      order.statusHistory = order.statusHistory || [];
      order.statusHistory.push({
        status: status,
        updatedBy: adminId,
        timestamp: new Date(),
        details: `Status updated by admin`,
      });

      await order.save();

      // Clear caches
      clearOrderCaches(
        id,
        order.user?._id?.toString(),
        null // No need to specify seller as we clear all relevant caches
      );

      res.status(200).json({
        success: true,
        message: `Order status updated to ${status}`,
        order,
      });
    } catch (error) {
      console.error("Error updating order status:", error);
      return next(new ErrorHandler(error.message, 500));
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

      // Find the order
      const order = await Order.findById(id);

      if (!order) {
        return next(new ErrorHandler("Order not found", 400));
      }

      // Store IDs before deletion for cache clearing
      const userId = order.user?._id?.toString();
      const sellerIds = [
        ...new Set(
          order.cart.map((item) => item.shopId?.toString()).filter(Boolean)
        ),
      ];

      // Delete the order
      await order.deleteOne();

      // Clear caches
      clearOrderCaches(id, userId);
      sellerIds.forEach((sellerId) => {
        orderCache.del(CACHE_KEYS.SELLER_ORDERS(sellerId));
      });

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
 * Update order item details (admin access)
 * PUT /api/v2/order/update-item-details/:orderId/:itemId
 * @authenticated @admin
 */
router.put(
  "/update-item-details/:orderId/:itemId",
  isAuthenticated,
  isAdmin,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { orderId, itemId } = req.params;
      const { ProductColor, size } = req.body;

      // Validate IDs format
      if (!isValidObjectId(orderId)) {
        return next(new ErrorHandler("Invalid order ID format", 400));
      }

      // Find the order
      const order = await Order.findById(orderId);

      if (!order) {
        return next(new ErrorHandler("Order not found", 404));
      }

      // Find the item in the cart
      const itemIndex = order.cart.findIndex(
        (item) => item._id.toString() === itemId
      );

      if (itemIndex === -1) {
        return next(new ErrorHandler("Order item not found", 404));
      }

      // Update the item details
      if (ProductColor !== undefined) {
        order.cart[itemIndex].ProductColor = ProductColor;
      }

      if (size !== undefined) {
        order.cart[itemIndex].size = size;
      }

      // Add modification to status history
      order.statusHistory = order.statusHistory || [];
      order.statusHistory.push({
        status: order.status,
        updatedBy: req.user._id,
        timestamp: new Date(),
        details: `Item details updated by admin: ${
          ProductColor ? `Color=${ProductColor}` : ""
        }${ProductColor && size ? ", " : ""}${size ? `Size=${size}` : ""}`,
      });

      // Save the order
      await order.save();

      // Clear caches
      clearOrderCaches(orderId, order.user?._id?.toString());

      res.status(200).json({
        success: true,
        message: "Item details updated successfully",
        order,
      });
    } catch (error) {
      console.error("Error updating item details:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

/* ------------------------- Design & Mockup Operations ------------------------ */

/**
 * Download design data for an order item (admin access only)
 * GET /api/v2/order/download-design/:orderId/:itemId
 * @authenticated @admin
 */
router.get(
  "/download-design/:orderId/:itemId",
  isAuthenticated,
  isAdmin,
  catchAsyncErrors(async (req, res, next) => {
    try {
      console.log("Admin design download requested by:", req.user._id);

      // Validate ID formats
      if (!isValidObjectId(req.params.orderId) || !req.params.itemId) {
        return next(new ErrorHandler("Invalid order or item ID format", 400));
      }

      // Find the order
      const order = await Order.findById(req.params.orderId);

      if (!order) {
        return next(new ErrorHandler("Order not found", 404));
      }

      // Find the specific item in the order
      const orderItem = order.cart.find(
        (item) => item._id.toString() === req.params.itemId
      );

      if (!orderItem) {
        return next(new ErrorHandler("Order item not found", 404));
      }

      // Find the original product to get the design image
      let designUrl = null;
      if (orderItem.productId && isValidObjectId(orderItem.productId)) {
        const product = await Product.findById(orderItem.productId);
        if (product && product.designImage && product.designImage.url) {
          designUrl = product.designImage.url;
        }
      }

      // If we can't find from product, try from the orderItem directly
      if (!designUrl) {
        designUrl = orderItem.designImage?.url || orderItem.designImage;
      }

      // Validate that we found a design URL
      if (!designUrl) {
        return next(new ErrorHandler("Design image not available", 404));
      }

      // Add download to status history
      order.statusHistory = order.statusHistory || [];
      order.statusHistory.push({
        status: order.status,
        updatedBy: req.user._id,
        timestamp: new Date(),
        details: `Design downloaded by admin for item: ${
          orderItem.DesignTitle || "Untitled"
        }`,
      });
      await order.save({ validateBeforeSave: false });

      // Return success with BOTH designUrl and full designData for compatibility
      return res.status(200).json({
        success: true,
        designUrl: designUrl, // Add this for compatibility with frontend
        designData: {
          url: designUrl,
          name: `${orderItem.DesignTitle || "design"}-${orderItem._id}.png`,
          productTitle: orderItem.DesignTitle || "Untitled Design",
          orderId: order._id,
          orderNumber: order._id.toString().slice(0, 8),
          specs: {
            type: orderItem.ProductType || "hoodie",
            color: orderItem.ProductColor || "white",
            size: orderItem.size || "One Size",
            position: {
              positionX: orderItem.designSpecs?.positionX || 50,
              positionY: orderItem.designSpecs?.positionY || 50,
              scale: orderItem.designSpecs?.scale || 1,
              rotation: orderItem.designSpecs?.rotation || 0,
            },
          },
        },
      });
    } catch (error) {
      console.error("Error in download-design:", error);
      return next(
        new ErrorHandler(error.message || "Failed to download design", 500)
      );
    }
  })
);

/**
 * Generate mockup for an order item (admin access only)
 * GET /api/v2/order/generate-mockup/:orderId/:itemId
 * @authenticated @admin
 */
router.get(
  "/generate-mockup/:orderId/:itemId",
  isAuthenticated,
  isAdmin,
  catchAsyncErrors(async (req, res, next) => {
    try {
      console.log("Admin mockup generation requested by:", req.user._id);

      // Validate ID formats
      if (!isValidObjectId(req.params.orderId) || !req.params.itemId) {
        return next(new ErrorHandler("Invalid order or item ID format", 400));
      }

      // Find the order
      const order = await Order.findById(req.params.orderId);

      if (!order) {
        return next(new ErrorHandler("Order not found", 404));
      }

      // Find the specific item
      const orderItem = order.cart.find(
        (item) => item._id.toString() === req.params.itemId
      );

      if (!orderItem) {
        return next(new ErrorHandler("Order item not found", 404));
      }

      // Create mockup using server-side processing
      const mockupPath = await DesignProcessor.processOrderItem(orderItem);

      // Ensure the file was created
      if (!fs.existsSync(mockupPath)) {
        return next(new ErrorHandler("Failed to generate mockup", 500));
      }

      // Stream the file to the client
      res.setHeader("Content-Type", "image/png");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="mockup_${req.params.itemId}.png"`
      );

      const fileStream = fs.createReadStream(mockupPath);
      fileStream.pipe(res);

      // Cleanup file after streaming
      fileStream.on("end", () => {
        fs.unlinkSync(mockupPath);
      });

      // Handle errors
      fileStream.on("error", (err) => {
        console.error("Error streaming mockup file:", err);
        if (!res.headersSent) {
          return next(new ErrorHandler("Error streaming mockup file", 500));
        }
      });

      // Add mockup generation to status history (async, don't await)
      order.statusHistory = order.statusHistory || [];
      order.statusHistory.push({
        status: order.status,
        updatedBy: req.user._id,
        timestamp: new Date(),
        details: `Mockup generated by admin for item: ${
          orderItem.DesignTitle || "Untitled"
        }`,
      });
      order.save().catch((err) => {
        console.error(
          "Error updating order history after mockup generation:",
          err
        );
      });
    } catch (error) {
      console.error("Error generating mockup:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

/**
 * Download design specifications
 * GET /api/v2/order/download-specs/:id
 * @authenticated
 */
router.get(
  "/download-specs/:id",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { id } = req.params;

      // Validate ID format
      if (!isValidObjectId(id)) {
        return next(new ErrorHandler("Invalid order ID format", 400));
      }

      // Find the order
      const order = await Order.findById(id);

      if (!order) {
        return next(new ErrorHandler("Order not found", 404));
      }

      // Verify authorization (admin, seller with items in order, or order owner)
      const userId = req.user._id.toString();
      const userRole = req.user.role ? req.user.role.toLowerCase() : "";
      const isOrderOwner =
        order.user && order.user._id && order.user._id.toString() === userId;
      const isAdminUser = userRole === "admin";

      // Non-admin users need to be the order owner
      if (!isAdminUser && !isOrderOwner) {
        return next(
          new ErrorHandler(
            "Not authorized to access this order's specifications",
            403
          )
        );
      }

      // Calculate order details with shipping breakdown
      const subtotal =
        order.subtotal ||
        order.cart.reduce(
          (sum, item) => sum + (item.price || 0) * (item.qty || 1),
          0
        );
      const shippingCost =
        order.shippingCost || order.shippingAddress?.shippingPrice || 0;
      const total = order.totalPrice || subtotal + shippingCost;

      // Prepare seller information
      const sellerIds = [
        ...new Set(
          order.cart.map((item) => item.shopId?.toString()).filter(Boolean)
        ),
      ];
      const sellers = {};

      // Fetch seller details in parallel
      await Promise.all(
        sellerIds.map(async (sellerId) => {
          try {
            const seller = await Shop.findById(sellerId);
            sellers[sellerId] = seller
              ? {
                  name: seller.name || "Unknown",
                  email: seller.email || "N/A",
                }
              : { name: "Unknown", email: "N/A" };
          } catch (err) {
            console.error(`Error fetching seller ${sellerId}:`, err);
            sellers[sellerId] = { name: "Unknown", email: "N/A" };
          }
        })
      );

      // Prepare the specifications data
      const specsData = {
        orderInfo: {
          orderId: order._id.toString(),
          orderDate: order.createdAt,
          status: order.status,
          paymentMethod: order.paymentInfo?.type || "Cash On Delivery",
          paymentStatus: order.paymentInfo?.status || "Processing",
          subtotal: subtotal,
          shippingCost: shippingCost,
          total: total,
        },
        customer: {
          name: order.user?.name || "Anonymous",
          email: order.user?.email || "N/A",
          phoneNumber: order.shippingAddress?.phoneNumber || "N/A",
        },
        shipping: {
          address: order.shippingAddress?.address1 || "N/A",
          address2: order.shippingAddress?.address2 || "",
          city: order.shippingAddress?.city || "N/A",
          country: order.shippingAddress?.country || "N/A",
          postalCode: order.shippingAddress?.postalCode || "N/A",
        },
        items: order.cart.map((item) => ({
          id: item._id.toString(),
          title: item.DesignTitle || "Untitled",
          type: item.ProductType || "N/A",
          color: item.ProductColor || "N/A",
          size: item.size || "N/A",
          quantity: item.qty || 1,
          price: item.price || 0,
          total: (item.price || 0) * (item.qty || 1),
          designPosition: {
            x: item.designSpecs?.positionX || 50,
            y: item.designSpecs?.positionY || 50,
            scale: item.designSpecs?.scale || 1,
            rotation: item.designSpecs?.rotation || 0,
          },
          sellerId: item.shopId?.toString() || "N/A",
          sellerName: item.shopId?.toString()
            ? sellers[item.shopId.toString()]?.name || "Unknown"
            : "Unknown",
        })),
      };

      res.status(200).json({
        success: true,
        specsData,
      });
    } catch (error) {
      console.error("Error downloading specs:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

/* ------------------------ User Order Operations ------------------------ */

/**
 * Request refund for an order
 * PUT /api/v2/order/request-refund/:id
 * @authenticated
 */
router.put(
  "/request-refund/:id",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;
      const userId = req.user._id;

      // Validate status
      if (!status || status !== "Refund Requested") {
        return next(new ErrorHandler("Invalid refund request status", 400));
      }

      // Validate ID format
      if (!isValidObjectId(id)) {
        return next(new ErrorHandler("Invalid order ID format", 400));
      }

      // Find the order
      const order = await Order.findById(id);

      if (!order) {
        return next(new ErrorHandler("Order not found", 400));
      }

      // Verify user owns this order
      const isOrderOwner =
        order.user &&
        order.user._id &&
        order.user._id.toString() === userId.toString();

      if (!isOrderOwner) {
        return next(
          new ErrorHandler(
            "Not authorized to request refund for this order",
            403
          )
        );
      }

      // Check if order is eligible for refund (not already refunded or canceled)
      if (
        [
          "Refund Requested",
          "Refund Approved",
          "Refund Success",
          "Refund Rejected",
          "Cancelled",
        ].includes(order.status)
      ) {
        return next(
          new ErrorHandler(`Order already has status: ${order.status}`, 400)
        );
      }

      // Update order status
      order.status = status;

      // Add to status history
      order.statusHistory = order.statusHistory || [];
      order.statusHistory.push({
        status: status,
        updatedBy: userId,
        timestamp: new Date(),
        details: reason || "Refund requested by customer",
      });

      await order.save({ validateBeforeSave: false });

      // Clear caches
      clearOrderCaches(
        id,
        userId.toString(),
        null // Clear all seller caches for this order
      );

      res.status(200).json({
        success: true,
        order,
        message: "Order refund requested successfully!",
      });
    } catch (error) {
      console.error("Error requesting refund:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

/* ------------------------ Delivery & Tracking Operations ------------------------ */

/**
 * Update delivery status
 * PUT /api/v2/order/update-delivery
 */
router.put(
  "/update-delivery",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { orderId, status, location, notes, apiKey } = req.body;

      // Basic validation
      if (!orderId || !status) {
        return next(new ErrorHandler("Order ID and status are required", 400));
      }

      // Validate ID format
      if (!isValidObjectId(orderId)) {
        return next(new ErrorHandler("Invalid order ID format", 400));
      }

      // Validate delivery partner API key (in a real system, this would be more secure)
      const isValidApiKey = apiKey && apiKey === process.env.DELIVERY_API_KEY;
      if (!isValidApiKey) {
        return next(
          new ErrorHandler("Invalid delivery partner credentials", 401)
        );
      }

      // Find the order
      const order = await Order.findById(orderId);

      if (!order) {
        return next(new ErrorHandler("Order not found", 404));
      }

      // Verify delivery info exists
      if (!order.deliveryInfo) {
        return next(new ErrorHandler("Delivery info not found", 400));
      }

      // Update delivery info
      order.deliveryInfo.status = status;
      order.deliveryInfo.currentLocation =
        location || order.deliveryInfo.currentLocation;
      order.deliveryInfo.lastUpdate = new Date();

      // Add notes if provided
      if (notes) {
        order.deliveryInfo.notes = [
          ...(order.deliveryInfo.notes || []),
          {
            message: notes,
            timestamp: new Date(),
          },
        ];
      }

      // Update order status if delivered
      if (status.toLowerCase() === "delivered") {
        order.status = ORDER_STATUSES.DELIVERED;
        order.deliveredAt = new Date();

        // Add to status history
        order.statusHistory = order.statusHistory || [];
        order.statusHistory.push({
          status: ORDER_STATUSES.DELIVERED,
          updatedBy: "delivery_partner",
          timestamp: new Date(),
          details: `Delivered at ${location || "destination"}`,
        });

        // Update payment status for COD orders
        if (
          order.paymentInfo &&
          order.paymentInfo.type === "Cash On Delivery"
        ) {
          order.paymentInfo.status = "Succeeded";
        }
      }

      await order.save();

      // Clear caches
      clearOrderCaches(orderId, order.user?._id?.toString(), null);

      res.status(200).json({
        success: true,
        message: "Delivery status updated successfully",
        order,
      });
    } catch (error) {
      console.error("Error updating delivery status:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

/**
 * Get delivery tracking information
 * GET /api/v2/order/tracking/:orderId
 */
router.get(
  "/tracking/:orderId",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { orderId } = req.params;

      // Validate ID format
      if (!isValidObjectId(orderId)) {
        return next(new ErrorHandler("Invalid order ID format", 400));
      }

      // Find the order
      const order = await Order.findById(orderId);

      if (!order) {
        return next(new ErrorHandler("Order not found", 404));
      }

      // Check if delivery info exists
      if (!order.deliveryInfo) {
        return next(new ErrorHandler("Delivery tracking not available", 404));
      }

      // Return tracking information
      res.status(200).json({
        success: true,
        tracking: {
          orderId: order._id,
          orderStatus: order.status,
          deliveryStatus: order.deliveryInfo.status,
          trackingNumber: order.deliveryInfo.trackingNumber,
          currentLocation: order.deliveryInfo.currentLocation,
          lastUpdate: order.deliveryInfo.lastUpdate,
          notes: order.deliveryInfo.notes,
          deliveryPartner: order.deliveryInfo.partnerId,
          assignedAt: order.deliveryInfo.assignedAt,
          estimatedDelivery: order.deliveryInfo.estimatedDelivery,
        },
      });
    } catch (error) {
      console.error("Error fetching tracking info:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Export the router
module.exports = router;
