const express = require("express");
const catchAsync = require("../utils/catchAsync");  
const router = express.Router();
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { isAuthenticated, isSeller, isAdmin } = require("../middleware/auth");
const Order = require("../model/order");
const Shop = require("../model/shop");
const Product = require("../model/product");
const { ORDER_STATUSES } = require('../constants/orderStatuses');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const sharp = require('sharp');
const JSZip = require('jszip');
const cloudinary = require('cloudinary').v2;
const SSE = require('express-sse');
const sse = new SSE();
// Constants
//.
const SERVICE_CHARGE_PERCENTAGE = 0.10; // 10% service charge

const getOrderDetails = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate('cart.product')
    .populate('cart.shop')
    .lean();
  
  if (!order) return next(new ErrorHandler("Order not found", 404));

  // Fix image URLs
  order.cart = order.cart.map(item => ({
    ...item,
    designImage: {
      ...item.designImage,
      url: item.designImage?.public_id 
        ? `https://res.cloudinary.com/dkot9tyjm/image/upload/${item.designImage.public_id}` 
        : null
    }
  }));

  res.status(200).json({
    success: true,
    order
  });
});

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
        item.shopId
      );
    })
    .withMessage('Invalid cart item format'),
  body('shippingAddress')
    .notEmpty()
    .withMessage('Shipping address is required')
    .isObject()
    .withMessage('Shipping address must be an object'),
  body('user')
    .notEmpty()
    .withMessage('User information is required'),
  body('totalPrice')
    .notEmpty()
    .withMessage('Total price is required')
    .custom((value) => {
      const number = Number(value);
      return !isNaN(number) && number >= 0;
    })
    .withMessage('Total price must be a valid positive number'),
  body('paymentInfo')
    .optional()
    .isObject()
    .withMessage('Payment info must be an object'),
  body('paymentInfo.type')
    .optional()
    .isString()
    .withMessage('Payment type must be a string'),
  body('paymentInfo.status')
    .optional()
    .isString()
    .withMessage('Payment status must be a string')
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

router.get('/download-specs/:orderId', isAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const zip = new JSZip();

    for (const item of order.cart) {
      // Add specs JSON
      const specs = {
        productType: item.ProductType,
        productColor: item.ProductColor,
        designSpecs: item.designSpecs,
        quantity: item.qty,
        size:item.size,
        color:item.ProductColor,
        designImage:item.designImage
      };
      zip.file(`${item._id}-specs.json`, JSON.stringify(specs, null, 2));

      // Add design image
      const designImage = await cloudinary.api.resource(item.designImage.public_id);
      const designImageBuffer = await (await fetch(designImage.secure_url)).buffer();
      zip.file(`${item._id}-design.png`, designImageBuffer);

      // Create composite image
      const productImage = await sharp(`./assets/${item.ProductType}-${item.ProductColor}.png`);
      const compositeImage = await productImage
        .composite([{
          input: designImageBuffer,
          top: Math.round(item.designSpecs.positionY * productImage.height / 100),
          left: Math.round(item.designSpecs.positionX * productImage.width / 100),
          blend: item.ProductColor === 'white' ? 'multiply' : 'screen'
        }])
        .toBuffer();
      zip.file(`${item._id}-composite.png`, compositeImage);
    }

    const zipBuffer = await zip.generateAsync({type: "nodebuffer"});
    res.set('Content-Type', 'application/zip');
    res.set('Content-Disposition', `attachment; filename="order-${order._id}-specs.zip"`);
    res.send(zipBuffer);

  } catch (error) {
    console.error("Error generating specs zip:", error);
    res.status(500).json({ message: "Error generating specs zip" });
  }
});
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

      // Fetch complete product details for snapshot
      const formattedCart = await Promise.all(cart.map(async (item) => {
        const product = await Product.findById(item._id);
        if (!product) {
          throw new ErrorHandler(`Product not found: ${item._id}`, 404);
        }

        return {
          _id: item._id,
          qty: Number(item.qty),
          shopId: item.shopId,
          price: Number(item.price),
          designImage: item.designImage,
          DesignTitle: product.DesignTitle,
          ProductType: product.ProductType,
          ProductColor: product.ProductColor,
          designSpecs: {
            size: item.selectedSize,
            positionX: item.designSpecs?.positionX || 50,
            positionY: item.designSpecs?.positionY || 50,
            scale: item.designSpecs?.scale || 1,
            rotation: item.designSpecs?.rotation || 0
          }
        };
      }));

      // Create product snapshots
      const productSnapshots = formattedCart.map(item => ({
        title: item.DesignTitle,
        description: `Custom ${item.ProductType} design`,
        color: item.ProductColor,
        size: item.designSpecs.size,
        designTags: item.designTags || [],
        originalProductId: item._id
      }));

      // Create the order
      const orderData = {
        productSnapshots,
        cart: formattedCart,
        shippingAddress,
        user,
        totalPrice: Number(totalPrice),
        paymentInfo: {
          id: paymentInfo?.id || null,
          status: paymentInfo?.status || "Processing",
          type: paymentInfo?.type || "Cash On Delivery"
        },
        status: "Processing",
        estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default 7 days delivery
      };

      const order = await Order.create(orderData);
      
      // Update product stock
      await Promise.all(formattedCart.map(item => 
        updateProductStock(item._id, item.qty)
      ));

      res.status(201).json({
        success: true,
        order,
      });
    } catch (error) {
      console.error("Order creation error:", error);
      return next(new ErrorHandler(error.message, error.statusCode || 500));
    }
  })
);

router.get('/user-order/:id', 
  (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return next(new ErrorHandler("Invalid order ID format", 400));
    }
    next();
  },
  getOrderDetails
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
  "/get-seller-orders/:shopId",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      validateMongoId(req.params.shopId);

      // Ensure seller can only access their own shop's orders
      if (req.seller._id.toString() !== req.params.shopId) {
        return next(new ErrorHandler("Unauthorized access to shop orders", 403));
      }

      const orders = await Order.find({ 
        "cart.shopId": req.params.shopId 
      })
      .sort({ createdAt: -1 })
      .lean();

      res.status(200).json({
        success: true,
        orders
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
router.put(
  "/update-order-status/:orderId",
  isAdmin,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { orderId } = req.params;
      const { status } = req.body;

      if (!Object.values(ORDER_STATUSES).includes(status)) {
        return next(new ErrorHandler("Invalid status", 400));
      }

      const order = await Order.findById(orderId);
      if (!order) {
        return next(new ErrorHandler("Order not found", 404));
      }

      // Update status and add to history
      const statusUpdate = {
        status,
        updatedAt: new Date(),
        updatedBy: req.admin._id,
        previousStatus: order.status
      };

      order.status = status;
      order.statusHistory.push(statusUpdate);

      // Handle status-specific logic
      if (status === ORDER_STATUSES.DELIVERED) {
        order.deliveredAt = new Date();
        
        // Update product stocks and sales
        for (const item of order.cart) {
          await Product.findByIdAndUpdate(item.product, {
            $inc: { 
              stock: -item.qty,
              sold_out: item.qty
            }
          });

          // Update shop statistics
          if (item.shop) {
            await Shop.findByIdAndUpdate(item.shop, {
              $inc: { 
                totalSales: item.price * item.qty,
                soldItems: item.qty
              }
            });
          }
        }
      }

      await order.save();

      // Emit SSE event for real-time updates
      sse.send({
        type: 'ORDER_STATUS_UPDATE',
        orderId,
        status,
        timestamp: new Date()
      });

      res.status(200).json({
        success: true,
        order
      });
    } catch (error) {
      console.error('Status update error:', error);
      return next(new ErrorHandler(error.message, 500));
    }
  })
);
router.put("/set-delivery/:orderId",
  isAdmin,
  catchAsyncErrors(async (req, res) => {
    const { deliveryDate } = req.body;
    const order = await Order.findById(req.params.orderId);

    order.adminUpdates.push({
      userId: req.admin._id,
      previousDate: order.estimatedDelivery,
      newDate: deliveryDate,
      updatedAt: Date.now()
    });

    order.estimatedDelivery = deliveryDate;
    await order.save();

    // Add real-time update logic here
    io.emit('delivery-update', { 
      orderId: order._id, 
      newDate: deliveryDate 
    });

    res.status(200).json({ 
      success: true,
      newDeliveryDate: deliveryDate 
    });
  })
);
router.get('/status-updates', (req, res) => {
  sse.init(req, res);
});

// Admin: Get all orders
router.get(
  "/admin-all-orders",
  isAuthenticated,
  isAdmin,
  catchAsyncErrors(async (req, res, next) => {
    try {
      // Add pagination
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      // Add filtering
      const filterOptions = {};
      if (req.query.status) {
        filterOptions.status = req.query.status;
      }
      if (req.query.startDate && req.query.endDate) {
        filterOptions.createdAt = {
          $gte: new Date(req.query.startDate),
          $lte: new Date(req.query.endDate)
        };
      }

      // Get orders with populated data
      const orders = await Order.find(filterOptions)
        .populate('user', 'name email')
        .populate('cart.shop', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      // Get total count for pagination
      const totalOrders = await Order.countDocuments(filterOptions);

      // Calculate totals and stats
      const totalAmount = orders.reduce((acc, order) => acc + (order.totalPrice || 0), 0);

      res.status(200).json({
        success: true,
        orders,
        totalAmount,
        totalOrders,
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit),
        ordersCount: orders.length
      });
    } catch (error) {
      console.error('Admin orders fetch error:', error);
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

router.get('/download-design/:orderId/:itemId',
  isAdmin,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { orderId, itemId } = req.params;
      const order = await Order.findById(orderId);
      
      if (!order) {
        return next(new ErrorHandler("Order not found", 404));
      }

      const orderItem = order.cart.find(item => item._id.toString() === itemId);
      if (!orderItem) {
        return next(new ErrorHandler("Order item not found", 404));
      }

      // Download design from Cloudinary
      const designResponse = await axios.get(orderItem.designImage.url, {
        responseType: 'arraybuffer'
      });

      // Get product template
      const productTemplate = `${orderItem.ProductType}-${orderItem.ProductColor}.png`;
      const templatePath = `./assets/templates/${productTemplate}`;

      // Create composite image
      const composite = await sharp(templatePath)
        .composite([{
          input: Buffer.from(designResponse.data),
          top: Math.round(orderItem.designSpecs.positionY * orderItem.designSpecs.scale),
          left: Math.round(orderItem.designSpecs.positionX * orderItem.designSpecs.scale),
          blend: orderItem.ProductColor === 'white' ? 'multiply' : 'screen'
        }])
        .png()
        .toBuffer();

      res.set('Content-Type', 'image/png');
      res.set('Content-Disposition', `attachment; filename=design_${orderId}_${itemId}.png`);
      res.send(composite);

    } catch (error) {
      console.error('Design download error:', error);
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

router.get('/download-specs/:orderId',
  isAdmin,
  catchAsyncErrors(async (req, res) => {
    const order = await Order.findById(req.params.orderId);
    const pdfDefinition = {
      content: [
        `Design: ${order.cart[0].DesignTitle}`,
        `Size: ${order.designSpecs.size}`,
        `Position: X${order.designSpecs.positionX}%, Y${order.designSpecs.positionY}%`,
        `Scale: ${order.designSpecs.scale}x`
      ]
    };
    
    const pdf = await pdfMake.createPdf(pdfDefinition).getBuffer();
    res.contentType('application/pdf')
       .send(pdf);
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
