const express = require("express");
const router = express.Router();
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { isAuthenticated, isSeller, isAdmin } = require("../middleware/auth");
const Order = require("../model/order");
const Shop = require("../model/shop");
const Product = require("../model/product");
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Constants
const ORDER_STATUSES = {
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  TRANSFERRED: 'Transferred to delivery partner',
  DELIVERED: 'Delivered',
  REFUND_PROCESSING: 'Refund Processing',
  REFUND_SUCCESS: 'Refund Success',
  CANCELLED: 'Cancelled'
};

const SERVICE_CHARGE_PERCENTAGE = 0.10; // 10% service charge

// Validation middleware
const validateOrderData = [
  body('cart')
    .isArray()
    .notEmpty()
    .withMessage('Cart is required and must be a non-empty array')
    .custom((cart) => {
      return cart.every(item => 
        item._id && 
        item.qty && 
        item.shopId && 
        mongoose.Types.ObjectId.isValid(item._id) &&
        mongoose.Types.ObjectId.isValid(item.shopId)
      );
    })
    .withMessage('Invalid cart item format'),
  body('shippingAddress')
    .notEmpty()
    .withMessage('Shipping address is required')
    .isObject()
    .withMessage('Shipping address must be an object'),
  body('totalPrice')
    .isNumeric()
    .withMessage('Total price must be a number')
    .isFloat({ min: 0 })
    .withMessage('Total price must be positive'),
  body('paymentInfo')
    .notEmpty()
    .withMessage('Payment information is required')
    .isObject()
    .withMessage('Payment info must be an object')
];

// Utility Functions
const validateMongoId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error('Invalid ID format');
  }
  return true;
};

const updateProductStock = async (productId, quantity, action = 'decrease') => {
  try {
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error(`Product not found with id: ${productId}`);
    }

    if (action === 'decrease') {
      if (product.stock < quantity) {
        throw new Error(`Insufficient stock for product: ${product.DesignTitle}`);
      }
      product.stock -= quantity;
      product.sold_out += quantity;
    } else {
      product.stock += quantity;
      product.sold_out = Math.max(0, product.sold_out - quantity);
    }

    await product.save();
    return true;
  } catch (error) {
    console.error('Error updating product stock:', error);
    throw error;
  }
};

const updateSellerBalance = async (sellerId, amount) => {
  try {
    const seller = await Shop.findById(sellerId);
    if (!seller) {
      throw new Error(`Seller not found with id: ${sellerId}`);
    }

    seller.availableBalance += amount;
    await seller.save();
    return true;
  } catch (error) {
    console.error('Error updating seller balance:', error);
    throw error;
  }
};// Create order
router.post(
  "/create-order",
  isAuthenticated,
  validateOrderData,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array() 
        });
      }

      const { cart, shippingAddress, user, totalPrice, paymentInfo } = req.body;

      // Validate stock availability
      await Promise.all(cart.map(async (item) => {
        const product = await Product.findById(item._id);
        if (!product || product.stock < item.qty) {
          throw new ErrorHandler(
            `Insufficient stock for product: ${product ? product.DesignTitle : 'Unknown'}`,
            400
          );
        }
      }));

      const order = await Order.create({
        cart,
        shippingAddress,
        user,
        totalPrice,
        paymentInfo,
        status: ORDER_STATUSES.PENDING,
        orderId: `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`
      });

      res.status(201).json({
        success: true,
        order,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, error.statusCode || 500));
    }
  })
);

// Get all orders of a user
router.get(
  "/get-all-orders/:userId",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      validateMongoId(req.params.userId);

      // Ensure user can only access their own orders
      if (req.user._id.toString() !== req.params.userId && !req.user.isAdmin) {
        return next(new ErrorHandler("Unauthorized access to orders", 403));
      }

      const orders = await Order.find({ "user._id": req.params.userId })
        .sort({ createdAt: -1 })
        .select('-paymentInfo.cardDetails'); // Exclude sensitive payment info

      res.status(200).json({
        success: true,
        count: orders.length,
        orders,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, error.statusCode || 500));
    }
  })
);

// Get all orders of a seller
router.get(
  "/get-seller-all-orders/:shopId",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      validateMongoId(req.params.shopId);

      // Ensure seller can only access their own shop's orders
      if (req.seller._id.toString() !== req.params.shopId) {
        return next(new ErrorHandler("Unauthorized access to shop orders", 403));
      }

      const orders = await Order.find({ "cart.shopId": req.params.shopId })
      .sort({ createdAt: -1 })
      .populate("user", "name email")
      .populate("cart.productId", "name price images")
      .lean();
      // Calculate shop statistics
      const statistics = {
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum, order) => sum + order.totalPrice, 0),
        pendingOrders: orders.filter(order => order.status === ORDER_STATUSES.PENDING).length,
        deliveredOrders: orders.filter(order => order.status === ORDER_STATUSES.DELIVERED).length,
      };

      res.status(200).json({
        success: true,
        statistics,
        orders,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, error.statusCode || 500));
    }
  })
);

// Update order status (seller)
router.put(
  "/update-order-status/:id",
  isSeller,
  [
    body('status')
      .isIn(Object.values(ORDER_STATUSES))
      .withMessage('Invalid order status'),
  ],
  catchAsyncErrors(async (req, res, next) => {
    try {
      validateMongoId(req.params.id);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array() 
        });
      }

      const order = await Order.findById(req.params.id);

      if (!order) {
        return next(new ErrorHandler("Order not found", 404));
      }

      // Verify seller owns this order
      const hasAccess = order.cart.some(item => 
        item.shopId.toString() === req.seller._id.toString()
      );
      
      if (!hasAccess) {
        return next(new ErrorHandler("Unauthorized access to this order", 403));
      }

      // Prevent status updates for cancelled or refunded orders
      if ([ORDER_STATUSES.REFUND_SUCCESS, ORDER_STATUSES.CANCELLED].includes(order.status)) {
        return next(new ErrorHandler("Cannot update status of cancelled or refunded order", 400));
      }

      const previousStatus = order.status;
      order.status = req.body.status;

      // Handle status-specific logic
      if (req.body.status === ORDER_STATUSES.TRANSFERRED) {
        try {
          await Promise.all(order.cart.map(item => 
            updateProductStock(item._id, item.qty)
          ));
        } catch (error) {
          return next(new ErrorHandler(`Error updating product stock: ${error.message}`, 500));
        }
      }

      if (req.body.status === ORDER_STATUSES.DELIVERED) {
        order.deliveredAt = Date.now();
        order.paymentInfo.status = "Succeeded";
        
        // Calculate and update seller balance
        const serviceCharge = order.totalPrice * SERVICE_CHARGE_PERCENTAGE;
        const sellerAmount = order.totalPrice - serviceCharge;
        
        try {
          await updateSellerBalance(req.seller._id, sellerAmount);
        } catch (error) {
          return next(new ErrorHandler(`Error updating seller balance: ${error.message}`, 500));
        }
      }

      await order.save();

      res.status(200).json({
        success: true,
        message: `Order status updated to ${req.body.status}`,
        order,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, error.statusCode || 500));
    }
  })
);

// Admin: Get all orders
router.get(
  "/admin-all-orders",
  isAuthenticated,
  isAdmin,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const orders = await Order.find()
        .sort({ createdAt: -1 })
        .select('-paymentInfo.cardDetails')
        .lean();

      // Safely calculate total amount
      const totalAmount = orders.reduce((acc, order) => {
        const orderTotal = Number(order.totalPrice) || 0;
        return acc + orderTotal;
      }, 0);

      res.status(200).json({
        success: true,
        orders,
        totalAmount,
        ordersCount: orders.length
      });
    } catch (error) {
      console.error('Admin orders fetch error:', error);
      return next(new ErrorHandler(error.message, 500));
    }
  })
);


// Refund order
router.put(
  "/refund-order/:id",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      validateMongoId(req.params.id);

      const order = await Order.findById(req.params.id);

      if (!order) {
        return next(new ErrorHandler("Order not found", 404));
      }

      // Verify user owns this order
      if (order.user._id.toString() !== req.user._id.toString()) {
        return next(new ErrorHandler("Unauthorized access to this order", 403));
      }

      if (order.status !== ORDER_STATUSES.DELIVERED) {
        return next(new ErrorHandler("Order must be delivered before requesting refund", 400));
      }

      order.status = ORDER_STATUSES.REFUND_PROCESSING;
      await order.save();

      res.status(200).json({
        success: true,
        message: "Refund request submitted successfully",
        order,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, error.statusCode || 500));
    }
  })
);

module.exports = router;