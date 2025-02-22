const express = require('express');
const router = express.Router();
const Order = require("../model/order");
const Shop = require("../model/shop");
const Product = require("../model/product");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { ORDER_STATUSES } = require('../constants/orderStatuses');
const NodeCache = require('node-cache');
const { isAuthenticated, isSeller, isAdmin } = require("../middleware/auth");

const orderCache = new NodeCache({ stdTTL: 600 });

// create new order
router.post(
  '/create-order',
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { cart, shippingAddress, user, totalPrice, paymentInfo } = req.body;

      const shopItemsMap = new Map();

      cart.forEach((item) => {
        const shopId = item.shopId;
        if (!shopItemsMap.has(shopId)) {
          shopItemsMap.set(shopId, []);
        }
        shopItemsMap.get(shopId).push(item);
      });

      const orders = [];

      for (const [shopId, items] of shopItemsMap) {
        const order = await Order.create({
          cart: items,
          shippingAddress,
          user,
          totalPrice: items.reduce((total, item) => total + item.price * item.qty, 0),
          paymentInfo,
          status: "Processing",
          createdAt: Date.now(),
        });
        orders.push(order);
      }

      res.status(201).json({
        success: true,
        orders,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);


// get all orders of user
router.get(
  '/get-user-orders',
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      // Add logging to debug
      console.log('Fetching orders for user:', req.user._id);

      const orders = await Order.find({ 
        "user._id": req.user._id.toString() 
      }).sort({ createdAt: -1 });

      console.log('Found orders:', orders.length);

      res.status(200).json({
        success: true,
        orders,
      });
    } catch (error) {
      console.error('Error in get-user-orders:', error);
      return next(new ErrorHandler(error.message, 500));
    }
  })
);
router.get(
  '/admin/order/:id',
  isAuthenticated,
  isAdmin,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const order = await Order.findById(req.params.id);
      
      if (!order) {
        return next(new ErrorHandler("Order not found", 404));
      }

      res.status(200).json({
        success: true,
        order
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);
// routes/order.js - Update the download-design endpoint
router.get(
  '/download-design/:orderId/:itemId',
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const order = await Order.findById(req.params.orderId)
        .populate('user', 'name email')
        .populate('cart.shopId', 'name email');

      if (!order) {
        return next(new ErrorHandler("Order not found", 404));
      }

      const orderItem = order.cart.find(item => 
        item._id.toString() === req.params.itemId
      );

      if (!orderItem) {
        return next(new ErrorHandler("Order item not found", 404));
      }

      // Get seller info
      const seller = await Shop.findById(orderItem.shopId).select('name email');

      const designData = {
        imageUrl: orderItem.designImage?.url || orderItem.designImage,
        orderId: order._id,
        itemId: orderItem._id,
        specs: {
          order: {
            orderId: order._id,
            orderDate: order.createdAt,
            quantity: orderItem.qty || 1,
            price: orderItem.price
          },
          product: {
            title: orderItem.DesignTitle || 'Untitled',
            type: orderItem.ProductType || 'Hoodie',
            color: orderItem.ProductColor || 'N/A',
            size: orderItem.size || 'N/A'
          },
          design: {
            position: orderItem.designSpecs || { x: 50, y: 40 },
            scale: orderItem.designSpecs?.scale || 1
          },
          seller: {
            name: seller?.name || 'Unknown',
            email: seller?.email || 'N/A'
          },
          customer: {
            name: order.user?.name || 'Anonymous',
            email: order.user?.email || 'N/A'
          }
        }
      };

      res.status(200).json({
        success: true,
        designData
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);


router.put(
  '/admin/update-status/:id',
  isAuthenticated,
  isAdmin,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const order = await Order.findById(req.params.id);
      
      if (!order) {
        return next(new ErrorHandler("Order not found", 404));
      }

      order.status = req.body.status;
      
      if (req.body.status === "Delivered") {
        order.deliveredAt = Date.now();
        order.paymentInfo.status = "Succeeded";
      }

      await order.save();

      res.status(200).json({
        success: true,
        order
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);
// get all seller orders
router.get(
  '/get-seller-orders',
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      // First check if seller exists
      if (!req.seller?._id) {
        return next(new ErrorHandler("Seller not authenticated", 401));
      }

      console.log('Fetching orders for seller:', req.seller._id);

      // Update the query to properly match seller orders
      const orders = await Order.find({
        "cart": {
          $elemMatch: {
            "shopId": req.seller._id.toString()
          }
        }
      }).sort({ createdAt: -1 });

      console.log('Found seller orders:', orders.length);

      // Add detailed response
      res.status(200).json({
        success: true,
        orders,
        count: orders.length,
        message: `Successfully retrieved ${orders.length} orders for seller`
      });
    } catch (error) {
      console.error('Error in get-seller-orders:', error);
      return next(new ErrorHandler(error.message, 500));
    }
  })
);
router.get(
  '/get-seller-order/:id',
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const order = await Order.findOne({
        _id: req.params.id,
        "cart": {
          $elemMatch: {
            "shopId": req.seller._id.toString()
          }
        }
      });

      if (!order) {
        return next(new ErrorHandler("Order not found or not authorized", 404));
      }

      res.status(200).json({
        success: true,
        order
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);
// update order status for seller
router.put(
  '/update-status/:id', 
  isAuthenticated,
  isAdmin,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const order = await Order.findById(req.params.id);
      
      if (!order) {
        return next(new ErrorHandler("Order not found", 404));
      }

      order.status = req.body.status;
      
      if (req.body.status === "Delivered") {
        order.deliveredAt = Date.now();
        order.paymentInfo.status = "Succeeded";
      }

      order.statusHistory.push({
        status: req.body.status,
        updatedBy: req.user._id,
        timestamp: new Date()
      });

      await order.save({ validateBeforeSave: false });

      res.status(200).json({
        success: true,
        order
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);


// request refund -- user
router.put(
  '/request-refund/:id', 
  isAuthenticated, 
  catchAsyncErrors(async (req, res, next) => {
    try {
      const order = await Order.findById(req.params.id);

      if (!order) {
        return next(new ErrorHandler("Order not found", 400));
      }

      order.status = req.body.status;
      order.statusHistory.push({
        status: req.body.status,
        updatedBy: req.user._id,
        timestamp: new Date()
      });

      await order.save({ validateBeforeSave: false });

      res.status(200).json({
        success: true,
        order,
        message: "Order Refund Request successfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// accept refund -- seller
router.put(
  '/accept-refund/:id', 
  isSeller, 
  catchAsyncErrors(async (req, res, next) => {
    try {
      const order = await Order.findById(req.params.id);

      if (!order) {
        return next(new ErrorHandler("Order not found", 400));
      }

      order.status = req.body.status;
      order.statusHistory.push({
        status: req.body.status,
        updatedBy: req.seller._id,
        timestamp: new Date()
      });

      await order.save({ validateBeforeSave: false });

      res.status(200).json({
        success: true,
        message: "Order Refund successfully!",
      });

      if (req.body.status === "Refund Success") {
        order.cart.forEach(async (o) => {
          await updateOrder(o._id, o.qty);
        });
      }
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// get all orders -- admin
router.get(
  '/admin/all-orders',
  isAuthenticated,
  isAdmin,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const orders = await Order.find().sort({
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


// get single order
router.get(
  '/get-order/:id',
  catchAsyncErrors(async (req, res, next) => {
    try {
      const order = await Order.findById(req.params.id);

      if (!order) {
        return next(new ErrorHandler("Order not found", 400));
      }

      res.status(200).json({
        success: true,
        order,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Helper function to update product stock
async function updateOrder(id, qty) {
  const product = await Product.findById(id);
  if (product) {
    product.stock -= qty;
    product.sold_out += qty;
    await product.save({ validateBeforeSave: false });
  }
}

// delete order -- admin
router.delete(
  '/admin/delete/:id', 
  isAdmin, 
  catchAsyncErrors(async (req, res, next) => {
    try {
      const order = await Order.findById(req.params.id);

      if (!order) {
        return next(new ErrorHandler("Order not found", 400));
      }

      await order.deleteOne();

      res.status(201).json({
        success: true,
        message: "Order deleted successfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// download design specifications
router.get(
  '/download-specs/:id', 
  isSeller, 
  catchAsyncErrors(async (req, res, next) => {
    try {
      const order = await Order.findById(req.params.id);
      
      if (!order) {
        return next(new ErrorHandler("Order not found", 404));
      }

      const specsData = order.cart.map(item => ({
        orderID: order._id,
        productTitle: item.DesignTitle,
        productType: item.ProductType,
        color: item.ProductColor,
        size: item.size,
        designSpecs: {
          positionX: item.designSpecs.positionX,
          positionY: item.designSpecs.positionY,
          scale: item.designSpecs.scale
        },
        quantity: item.qty,
        customerName: order.user.name,
        orderDate: order.createdAt
      }));

      const fields = ['orderID', 'productTitle', 'productType', 'color', 'size', 'quantity', 'customerName', 'orderDate'];
      const opts = { fields };
      
      const parser = new Parser(opts);
      const csv = parser.parse(specsData);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=specs-${order._id}.csv`);
      
      res.status(200).send(csv);
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// download design files
router.get(
  '/download-design/:id/:itemId', 
  isSeller, 
  catchAsyncErrors(async (req, res, next) => {
    try {
      const order = await Order.findById(req.params.id);
      
      if (!order) {
        return next(new ErrorHandler("Order not found", 404));
      }

      const cartItem = order.cart.find(item => item._id.toString() === req.params.itemId);
      
      if (!cartItem) {
        return next(new ErrorHandler("Design not found in order", 404));
      }

      if (!cartItem.designImage || !cartItem.designImage.url) {
        return next(new ErrorHandler("Design image not available", 404));
      }

      const response = await axios({
        url: cartItem.designImage.url,
        method: 'GET',
        responseType: 'stream'
      });

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `attachment; filename=design-${order._id}-${cartItem._id}.png`);

      response.data.pipe(res);
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// assign delivery partner
router.post(
  '/assign-delivery', 
  isSeller, 
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { orderId, deliveryPartnerId, trackingNumber } = req.body;

      const order = await Order.findById(orderId);
      
      if (!order) {
        return next(new ErrorHandler("Order not found", 404));
      }

      order.deliveryInfo = {
        partnerId: deliveryPartnerId,
        trackingNumber: trackingNumber,
        assignedAt: new Date()
      };

      order.status = ORDER_STATUSES.TRANSFERRED;
      order.statusHistory.push({
        status: ORDER_STATUSES.TRANSFERRED,
        updatedBy: req.seller._id,
        timestamp: new Date(),
        details: `Assigned to delivery partner: ${deliveryPartnerId}`
      });

      await order.save();

      res.status(200).json({
        success: true,
        message: "Delivery partner assigned successfully",
        order
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// update delivery status
router.put(
  '/update-delivery', 
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { orderId, status, location, notes } = req.body;

      const order = await Order.findById(orderId);
      
      if (!order) {
        return next(new ErrorHandler("Order not found", 404));
      }

      if (!order.deliveryInfo) {
        return next(new ErrorHandler("Delivery info not found", 400));
      }

      order.deliveryInfo.status = status;
      order.deliveryInfo.currentLocation = location;
      order.deliveryInfo.lastUpdate = new Date();

      if (notes) {
        order.deliveryInfo.notes = [...(order.deliveryInfo.notes || []), {
          message: notes,
          timestamp: new Date()
        }];
      }

      if (status === 'delivered') {
        order.status = ORDER_STATUSES.DELIVERED;
        order.deliveredAt = new Date();
        order.statusHistory.push({
          status: ORDER_STATUSES.DELIVERED,
          updatedBy: 'delivery_partner',
          timestamp: new Date()
        });
      }

      await order.save();

      res.status(200).json({
        success: true,
        message: "Delivery status updated successfully",
        order
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// get delivery tracking info
router.get(
  '/tracking/:orderId', 
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { orderId } = req.params;

      const order = await Order.findById(orderId);
      
      if (!order) {
        return next(new ErrorHandler("Order not found", 404));
      }

      if (!order.deliveryInfo) {
        return next(new ErrorHandler("Delivery tracking not available", 404));
      }

      res.status(200).json({
        success: true,
        tracking: {
          orderId: order._id,
          status: order.deliveryInfo.status,
          trackingNumber: order.deliveryInfo.trackingNumber,
          currentLocation: order.deliveryInfo.currentLocation,
          lastUpdate: order.deliveryInfo.lastUpdate,
          notes: order.deliveryInfo.notes,
          deliveryPartner: order.deliveryInfo.partnerId,
          assignedAt: order.deliveryInfo.assignedAt
        }
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

module.exports = router;