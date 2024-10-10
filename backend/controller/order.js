const express = require("express");
const router = express.Router();
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { isAuthenticated, isSeller, isAdmin } = require("../middleware/auth");
const Order = require("../model/order");
const Shop = require("../model/shop");
const Product = require("../model/product");
const { body, validationResult } = require('express-validator');

// Validation middleware
const validateOrderData = [
  body('cart').isArray().notEmpty().withMessage('Cart is required and must be a non-empty array'),
  body('shippingAddress').notEmpty().withMessage('Shipping address is required'),
  body('user').notEmpty().withMessage('User information is required'),
  body('totalPrice').isNumeric().withMessage('Total price must be a number'),
  body('paymentInfo').notEmpty().withMessage('Payment information is required'),
];

// Create order
router.post(
  "/create-order",
  isAuthenticated,
  validateOrderData,
  catchAsyncErrors(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { cart, shippingAddress, user, totalPrice, paymentInfo } = req.body;

    try {
      const order = await Order.create({
        cart,
        shippingAddress,
        user,
        totalPrice,
        paymentInfo,
      });

      res.status(201).json({
        success: true,
        order,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Get all orders of a user
router.get(
  "/get-all-orders/:userId",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const orders = await Order.find({ "user._id": req.params.userId }).sort({
        createdAt: -1,
      });

      res.status(200).json({
        success: true,
        orders,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Get all orders of a seller
router.get(
  "/get-seller-all-orders/:shopId",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const orders = await Order.find({
        "cart.shopId": req.params.shopId,
      }).sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        orders,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Update order status (seller)
router.put(
  "/update-order-status/:id",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const order = await Order.findById(req.params.id);

      if (!order) {
        return next(new ErrorHandler("Order not found", 404));
      }

      if (req.body.status === "Transferred to delivery partner") {
        await Promise.all(order.cart.map(item => updateOrder(item._id, item.qty)));
      }

      order.status = req.body.status;

      if (req.body.status === "Delivered") {
        order.deliveredAt = Date.now();
        order.paymentInfo.status = "Succeeded";
        const serviceCharge = order.totalPrice * 0.10;
        await updateSellerInfo(order.totalPrice - serviceCharge);
      }

      await order.save();

      res.status(200).json({
        success: true,
        order,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

async function updateOrder(id, qty) {
  const product = await Product.findById(id);
  if (product) {
    product.stock -= qty;
    product.sold_out += qty;
    await product.save();
  }
}

async function updateSellerInfo(amount) {
  const seller = await Shop.findById(req.seller.id);
  if (seller) {
    seller.availableBalance += amount;
    await seller.save();
  }
}

// Request refund (user)
router.put(
  "/order-refund/:id",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const order = await Order.findById(req.params.id);

      if (!order) {
        return next(new ErrorHandler("Order not found", 404));
      }

      if (order.status === "Delivered") {
        order.status = "Refund Processing";
        await order.save();

        res.status(200).json({
          success: true,
          message: "Refund request submitted successfully",
        });
      } else {
        return next(new ErrorHandler("Order is not eligible for refund", 400));
      }
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Process refund (seller)
router.put(
  "/order-refund-success/:id",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const order = await Order.findById(req.params.id);

      if (!order) {
        return next(new ErrorHandler("Order not found", 404));
      }

      if (order.status === "Refund Processing") {
        order.status = "Refund Success";
        await Promise.all(order.cart.map(item => updateOrderRefund(item._id, item.qty)));
        await order.save();

        res.status(200).json({
          success: true,
          message: "Refund processed successfully",
        });
      } else {
        return next(new ErrorHandler("Invalid refund request", 400));
      }
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

async function updateOrderRefund(id, qty) {
  const product = await Product.findById(id);
  if (product) {
    product.stock += qty;
    product.sold_out -= qty;
    await product.save();
  }
}

// Get all orders (admin)
router.get(
  "/admin-all-orders",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const orders = await Order.find().sort({
        deliveredAt: -1,
        createdAt: -1,
      });
      res.status(200).json({
        success: true,
        orders,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

module.exports = router;