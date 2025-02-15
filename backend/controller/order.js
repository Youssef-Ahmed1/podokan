// backend/controller/order.js
const Order = require("../model/order");
const Shop = require("../model/shop");
const Product = require("../model/product");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { ORDER_STATUSES } = require('../constants/orderStatuses');
const NodeCache = require('node-cache');

const orderCache = new NodeCache({ stdTTL: 600 });

// create new order
exports.createOrder = catchAsyncErrors(async (req, res, next) => {
  try {
    const { cart, shippingAddress, user, totalPrice, paymentInfo } = req.body;

    // Group cart items by shop
    const shopItemsMap = new Map();

    cart.forEach((item) => {
      const shopId = item.shopId;
      if (!shopItemsMap.has(shopId)) {
        shopItemsMap.set(shopId, []);
      }
      shopItemsMap.get(shopId).push(item);
    });

    // Create an order for each shop
    const orders = [];

    for (const [shopId, items] of shopItemsMap) {
      const order = await Order.create({
        cart: items,
        shippingAddress,
        user,
        totalPrice: items.reduce((total, item) => total + item.price * item.qty, 0),
        paymentInfo,
        status: ORDER_STATUSES.PROCESSING,
        statusHistory: [{
          status: ORDER_STATUSES.PROCESSING,
          updatedBy: user._id,
          timestamp: new Date()
        }]
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
});

// get all orders of user
exports.getUserOrders = catchAsyncErrors(async (req, res, next) => {
  try {
    const orders = await Order.find({ "user._id": req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// get all seller orders
exports.getSellerOrders = catchAsyncErrors(async (req, res, next) => {
  try {
    const orders = await Order.find({
      "cart.shopId": req.seller._id,
    }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// update order status for seller
exports.updateOrderStatus = catchAsyncErrors(async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return next(new ErrorHandler("Order not found", 400));
    }

    if (req.body.status === "Transferred to delivery partner") {
      order.cart.forEach(async (o) => {
        await updateOrder(o._id, o.qty);
      });
    }

    order.status = req.body.status;
    order.statusHistory.push({
      status: req.body.status,
      updatedBy: req.seller ? req.seller._id : req.user._id,
      timestamp: new Date()
    });

    if (req.body.status === "Delivered") {
      order.deliveredAt = Date.now();
      order.paymentInfo.status = "Succeeded";
    }

    await order.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// give a refund ----- user
exports.orderRefund = catchAsyncErrors(async (req, res, next) => {
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
});

// accept the refund ---- seller
exports.acceptRefund = catchAsyncErrors(async (req, res, next) => {
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
});

// admin get all orders
exports.adminGetAllOrders = catchAsyncErrors(async (req, res, next) => {
  try {
    const orders = await Order.find().sort({
      createdAt: -1,
    });
    res.status(201).json({
      success: true,
      orders,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// get single order
exports.getSingleOrder = catchAsyncErrors(async (req, res, next) => {
  const cacheKey = `order_${req.params.id}`;
  const cachedOrder = orderCache.get(cacheKey);

  if (cachedOrder) {
    return res.status(200).json({
      success: true,
      order: cachedOrder,
    });
  }

  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorHandler("Order not found", 400));
  }

  orderCache.set(cacheKey, order);

  res.status(200).json({
    success: true,
    order,
  });
});

async function updateOrder(id, qty) {
  const product = await Product.findById(id);

  if (product) {
    product.stock -= qty;
    product.sold_out += qty;
    await product.save({ validateBeforeSave: false });
  }
}

// delete order ---- admin
exports.adminDeleteOrder = catchAsyncErrors(async (req, res, next) => {
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
});
// Add these functions in the same order.js controller file

// Download design specifications
exports.downloadSpecs = catchAsyncErrors(async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return next(new ErrorHandler("Order not found", 404));
    }

    // Create specs data
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

    // Convert to CSV or required format
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
});

// Download design files
exports.downloadDesign = catchAsyncErrors(async (req, res, next) => {
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

    // If using cloud storage (like Cloudinary)
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
});

// Assign delivery partner
exports.assignDeliveryPartner = catchAsyncErrors(async (req, res, next) => {
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

    // Send notification to user about tracking
    // Implement your notification logic here

    res.status(200).json({
      success: true,
      message: "Delivery partner assigned successfully",
      order
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// Update delivery status
exports.updateDeliveryStatus = catchAsyncErrors(async (req, res, next) => {
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
});

// Get delivery tracking info
exports.getDeliveryTracking = catchAsyncErrors(async (req, res, next) => {
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
});
module.exports = exports;