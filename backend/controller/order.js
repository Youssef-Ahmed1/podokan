// backend/controller/order.js

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Order = require("../model/order");
const Shop = require("../model/shop");
const Product = require("../model/product");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { ORDER_STATUSES } = require("../constants/orderStatuses");
const NodeCache = require("node-cache");
const { isAuthenticated, isSeller, isAdmin } = require("../middleware/auth");
const DesignProcessor = require("../utils/designProcessor"); // Assumes exists for mockup endpoint
const fs = require("fs");
const path = require("path");

// --- Caching ---
const orderCache = new NodeCache({
  stdTTL: 600,
  checkperiod: 300,
  useClones: false,
});
const CACHE_KEYS = {
  ADMIN_ORDERS: "admin_all_orders",
  USER_ORDERS: (userId) => `user_orders_${userId}`,
  SELLER_ORDERS: (sellerId) => `seller_orders_${sellerId}`,
  ORDER_DETAIL: (orderId) => `order_detail_${orderId}`,
};

// --- Helper Functions ---
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const clearOrderCaches = async (orderId, userId, explicitSellerId = null) => {
  const keysToDel = new Set();
  keysToDel.add(CACHE_KEYS.ADMIN_ORDERS);
  if (orderId) keysToDel.add(CACHE_KEYS.ORDER_DETAIL(orderId));
  if (userId) keysToDel.add(CACHE_KEYS.USER_ORDERS(userId));
  const sellerIdsToClear = new Set();
  if (explicitSellerId) sellerIdsToClear.add(explicitSellerId.toString());
  if (orderId) {
    // Fetch sellers involved in the order dynamically
    try {
      const orderSellers = await Order.findById(orderId)
        .select("cart.shopId")
        .lean();
      if (orderSellers?.cart)
        orderSellers.cart.forEach((item) => {
          if (item.shopId) sellerIdsToClear.add(item.shopId.toString());
        });
    } catch (err) {
      console.error(`Cache Clear Seller Fetch Err ${orderId}:`, err);
    }
  }
  sellerIdsToClear.forEach((sellerId) =>
    keysToDel.add(CACHE_KEYS.SELLER_ORDERS(sellerId))
  );
  if (keysToDel.size > 0) {
    const deletedKeys = orderCache.del(Array.from(keysToDel));
    console.log(`Cleared ${deletedKeys} cache keys.`);
  }
};

const updateProductStock = async (productId, qtyChange) => {
  try {
    const product = await Product.findById(productId);
    if (product) {
      const originalStock = product.stock;
      const originalSold = product.sold_out || 0;
      product.stock = Math.max(0, product.stock - qtyChange);
      product.sold_out = Math.max(0, (product.sold_out || 0) + qtyChange);
      if (
        product.stock !== originalStock ||
        product.sold_out !== originalSold
      ) {
        await product.save({ validateBeforeSave: false });
        console.log(
          `Stock/Sold ${productId}: S ${originalStock}->${product.stock}, SO ${originalSold}->${product.sold_out}`
        );
      }
    } else {
      console.warn(`Stock update: Product ${productId} NF.`);
    }
  } catch (error) {
    console.error(`Stock update ERR ${productId}:`, error);
  }
};

const ensureTempDirectory = () => {
  // Assuming needed for server-side mockups
  const tempDir = path.join(__dirname, "../temp");
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  return tempDir;
};

// --- Routes ---

// [POST] /api/v2/order/create-order
router.post(
  "/create-order",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    const { cart, shippingAddress, user, paymentInfo } = req.body;
    if (!cart?.length || !shippingAddress || !user?._id)
      return next(new ErrorHandler("Missing order data.", 400));

    const shippingCost = shippingAddress.shippingPrice ?? 50;
    const shopItemsMap = new Map();
    const productValidationPromises = [];

    for (const item of cart) {
      if (
        !item.shopId ||
        item.price == null ||
        !item._id ||
        !item.qty ||
        !item.designImage ||
        !item.DesignTitle ||
        !item.ProductType ||
        !item.ProductColor ||
        !item.size
      )
        throw new ErrorHandler(
          `Item "${item.DesignTitle || "?"}" missing data.`,
          400
        );
      if (!Number.isInteger(item.qty) || item.qty <= 0)
        throw new ErrorHandler(`Invalid qty for "${item.DesignTitle}".`, 400);
      if (typeof item.price !== "number" || item.price < 0)
        throw new ErrorHandler(`Invalid price for "${item.DesignTitle}".`, 400);
      if (!isValidObjectId(item.shopId))
        throw new ErrorHandler(
          `Invalid shop ID for "${item.DesignTitle}".`,
          400
        );
      if (item.productId && isValidObjectId(item.productId))
        productValidationPromises.push(
          Product.findById(item.productId)
            .select("stock name")
            .lean()
            .then((p) => {
              if (!p)
                throw new ErrorHandler(`Prod "${item.DesignTitle}" NF.`, 404);
              if (p.stock < item.qty)
                throw new ErrorHandler(
                  `Stock low "${p.name}". Have ${p.stock}.`,
                  400
                );
            })
        );
      const shopId = item.shopId.toString();
      if (!shopItemsMap.has(shopId)) shopItemsMap.set(shopId, []);
      shopItemsMap.get(shopId).push(item);
    }
    await Promise.all(productValidationPromises);

    const createdOrders = [];
    const creationPromises = [];
    for (const [shopId, items] of shopItemsMap) {
      const orderData = {
        cart: items,
        shippingAddress,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber,
        },
        shippingCost,
        paymentInfo: paymentInfo || { type: "Cash On Delivery" },
        status: ORDER_STATUSES.PROCESSING,
        statusHistory: [
          {
            status: ORDER_STATUSES.PROCESSING,
            updatedBy: user._id.toString(),
            timestamp: new Date(),
          },
        ],
      };
      creationPromises.push(
        Order.create(orderData)
          .then((order) => {
            createdOrders.push(order);
            order.cart.forEach((item) => {
              if (item.productId)
                updateProductStock(item.productId, item.qty).catch(
                  console.error
                );
            });
          })
          .catch((error) => {
            console.error("Order create ERR:", shopId, error);
            throw new ErrorHandler(
              `Order save fail shop ${shopId}: ${error.message}`,
              500
            );
          })
      );
    }
    await Promise.all(creationPromises);
    await clearOrderCaches(null, user._id.toString());
    res.status(201).json({ success: true, orders: createdOrders });
  })
);

// [GET] /api/v2/order/get-user-orders
router.get(
  "/get-user-orders",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    if (!req.user?._id) return next(new ErrorHandler("Auth error.", 401));
    const userId = req.user._id.toString();
    const cacheKey = CACHE_KEYS.USER_ORDERS(userId);
    const cached = orderCache.get(cacheKey);
    if (cached)
      return res.json({ success: true, orders: cached, fromCache: true });
    const orders = await Order.find({ "user._id": userId })
      .sort({ createdAt: -1 })
      .lean();
    orderCache.set(cacheKey, orders);
    res.json({ success: true, orders, count: orders.length });
  })
);

// [GET] /api/v2/order/get-order/:id
router.get(
  "/get-order/:id",
  catchAsyncErrors(async (req, res, next) => {
    if (!isValidObjectId(req.params.id))
      return next(new ErrorHandler("Invalid ID.", 400));
    const orderId = req.params.id;
    const cacheKey = CACHE_KEYS.ORDER_DETAIL(orderId);
    const cached = orderCache.get(cacheKey);
    if (cached)
      return res.json({ success: true, order: cached, fromCache: true });
    const order = await Order.findById(orderId).lean();
    if (!order) {
      orderCache.del(cacheKey);
      return next(new ErrorHandler("NF.", 404));
    }
    orderCache.set(cacheKey, order);
    res.json({ success: true, order });
  })
);

// --- Seller Routes ---
// [GET] /api/v2/order/get-seller-orders
router.get(
  "/get-seller-orders",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    if (!req.seller?._id)
      return next(new ErrorHandler("Seller Auth fail.", 401));
    const sellerId = req.seller._id;
    const cacheKey = CACHE_KEYS.SELLER_ORDERS(sellerId.toString());
    const cached = orderCache.get(cacheKey);
    if (cached)
      return res.json({ success: true, orders: cached, fromCache: true });
    const orders = await Order.find({ "cart.shopId": sellerId })
      .sort({ createdAt: -1 })
      .lean();
    orderCache.set(cacheKey, orders);
    res.json({ success: true, orders, count: orders.length, fromCache: false });
  })
);

// [GET] /api/v2/order/get-seller-order/:id
router.get(
  "/get-seller-order/:id",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    if (!req.seller?._id)
      return next(new ErrorHandler("Seller Auth fail.", 401));
    if (!isValidObjectId(req.params.id))
      return next(new ErrorHandler("Invalid ID.", 400));
    const orderId = req.params.id;
    const sellerId = req.seller._id.toString();
    const order = await Order.findOne({
      _id: orderId,
      "cart.shopId": sellerId,
    });
    if (!order) return next(new ErrorHandler("NF or Forbidden.", 404));
    const orderObj = order.toObject();
    orderObj.cart = orderObj.cart.filter(
      (i) => i.shopId?.toString() === sellerId
    );
    res.json({ success: true, order: orderObj });
  })
);

// [PUT] /api/v2/order/update-order-status/:id (Seller update)
router.put(
  "/update-order-status/:id",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    if (!req.seller?._id)
      return next(new ErrorHandler("Seller Auth required.", 401));
    if (!isValidObjectId(req.params.id))
      return next(new ErrorHandler("Invalid ID.", 400));
    const orderId = req.params.id;
    const { status } = req.body;
    const sellerId = req.seller._id;
    const allowedStatuses = [
      ORDER_STATUSES.PROCESSING,
      ORDER_STATUSES.TRANSFERRED,
    ]; // Customize allowed
    if (!allowedStatuses.includes(status))
      return next(new ErrorHandler(`Invalid seller status ${status}.`, 400));
    const order = await Order.findOne({
      _id: orderId,
      "cart.shopId": sellerId,
    });
    if (!order) return next(new ErrorHandler("NF or Forbidden.", 404));
    const prev = order.status;
    order.status = status;
    order.statusHistory.push({
      status,
      updatedBy: sellerId.toString(),
      timestamp: new Date(),
      details: `Seller ${sellerId.toString().slice(-4)} ${prev}->${status}`,
    });
    // Recalculate totals robustly
    order.subtotal = order.cart.reduce(
      (s, i) => s + (i.price || 0) * (i.qty || 1),
      0
    );
    order.shippingCost =
      order.shippingAddress?.shippingPrice ?? order.shippingCost ?? 50;
    order.totalPrice = order.subtotal + order.shippingCost;
    try {
      await order.save({ validateBeforeSave: true });
    } catch (err) {
      console.error("Seller Stat Upd Val Fail", err);
      return next(new ErrorHandler(err.message, 500));
    }
    await clearOrderCaches(
      orderId,
      order.user?._id?.toString(),
      sellerId.toString()
    );
    res.json({ success: true, msg: `OK -> ${status}`, order });
  })
);

// [PUT] /api/v2/order/process-refund/:id (Seller approve/reject refund)
router.put(
  "/process-refund/:id",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    if (!req.seller?._id)
      return next(new ErrorHandler("Seller Auth fail.", 401));
    if (!isValidObjectId(req.params.id))
      return next(new ErrorHandler("Invalid ID.", 400));
    const orderId = req.params.id;
    const { status, refundNotes } = req.body;
    const sellerId = req.seller._id;
    const validStatuses = [
      ORDER_STATUSES.REFUND_APPROVED,
      ORDER_STATUSES.REFUND_REJECTED,
    ];
    if (!validStatuses.includes(status))
      return next(new ErrorHandler(`Invalid refund action ${status}.`, 400));
    const order = await Order.findOne({
      _id: orderId,
      "cart.shopId": sellerId,
      status: ORDER_STATUSES.REFUND_REQUESTED,
    });
    if (!order)
      return next(new ErrorHandler("NF or not awaiting decision.", 404));
    const prev = order.status;
    order.status = status;
    order.statusHistory.push({
      status,
      updatedBy: sellerId.toString(),
      timestamp: new Date(),
      details: `Seller refund ${status}${
        refundNotes ? " Note: " + refundNotes : ""
      }`,
    });
    if (status === ORDER_STATUSES.REFUND_APPROVED) {
      /* Trigger system refund... IF OK { ... update status to SUCCESS, return stock} ELSE { log error } */ console.log(
        "SIMULATE refund OK"
      );
      order.status = ORDER_STATUSES.REFUND_SUCCESS;
      order.statusHistory.push({
        status: order.status,
        updatedBy: "SYSTEM",
        timestamp: new Date(),
        details: `Refund sys OK`,
      });
      order.cart
        .filter(
          (i) => i.shopId?.toString() === sellerId.toString() && i.productId
        )
        .map((i) => updateProductStock(i.productId, -Math.abs(i.qty || 1)))
        .forEach((p) => p.catch(console.error));
    }
    order.subtotal = order.cart.reduce(
      (s, i) => s + (i.price || 0) * (i.qty || 1),
      0
    );
    order.shippingCost =
      order.shippingAddress?.shippingPrice ?? order.shippingCost ?? 50;
    order.totalPrice = order.subtotal + order.shippingCost;
    try {
      await order.save({ validateBeforeSave: true });
    } catch (err) {
      console.error("Seller Refund Process Fail", err);
      return next(new ErrorHandler(err.message, 500));
    }
    await clearOrderCaches(
      orderId,
      order.user?._id?.toString(),
      sellerId.toString()
    );
    res.json({ success: true, msg: `Refund -> ${order.status}`, order });
  })
);

// [POST] /api/v2/order/assign-delivery (Seller - Placeholder)
router.post(
  "/assign-delivery",
  isSeller,
  catchAsyncErrors(async (req, res, next) =>
    next(new ErrorHandler("Not Impl.", 501))
  )
);

// --- Admin Routes ---
// [GET] /api/v2/order/admin/all-orders
router.get(
  "/admin/all-orders",
  isAuthenticated,
  isAdmin,
  catchAsyncErrors(async (req, res, next) => {
    const cacheKey = CACHE_KEYS.ADMIN_ORDERS;
    const cached = orderCache.get(cacheKey);
    if (cached)
      return res.json({ success: true, orders: cached, fromCache: true });
    const orders = await Order.find().sort({ createdAt: -1 }).lean();
    orderCache.set(cacheKey, orders);
    res.json({ success: true, orders, count: orders.length, fromCache: false });
  })
);

// [GET] /api/v2/order/admin/order/:id
router.get(
  "/admin/order/:id",
  isAuthenticated,
  isAdmin,
  catchAsyncErrors(async (req, res, next) => {
    if (!isValidObjectId(req.params.id))
      return next(new ErrorHandler("Invalid ID.", 400));
    const orderId = req.params.id;
    const cacheKey = CACHE_KEYS.ORDER_DETAIL(orderId);
    const cached = orderCache.get(cacheKey);
    if (cached)
      return res.json({ success: true, order: cached, fromCache: true });
    const order = await Order.findById(orderId).lean();
    if (!order) {
      orderCache.del(cacheKey);
      return next(new ErrorHandler("NF.", 404));
    }
    orderCache.set(cacheKey, order);
    res.json({ success: true, order, fromCache: false });
  })
);

// [PUT] /api/v2/order/admin/update-status/:id *** WITH VALIDATION FIX ***
router.put(
  "/admin/update-status/:id",
  isAuthenticated,
  isAdmin,
  catchAsyncErrors(async (req, res, next) => {
    if (!isValidObjectId(req.params.id))
      return next(new ErrorHandler("Invalid order ID.", 400));
    const orderId = req.params.id;
    const { status } = req.body;
    const adminId = req.user._id;
    const validStatuses = Object.values(ORDER_STATUSES);
    if (!validStatuses.includes(status))
      return next(new ErrorHandler(`Invalid status ${status}.`, 400));
    const order = await Order.findById(orderId);
    if (!order) return next(new ErrorHandler("Order not found", 404));
    const prev = order.status;
    order.status = status;
    if (status === ORDER_STATUSES.DELIVERED) {
      order.deliveredAt = Date.now();
      if (
        order.paymentInfo?.type === "Cash On Delivery" &&
        order.paymentInfo.status !== "Succeeded"
      )
        order.paymentInfo.status = "Succeeded";
    }
    order.statusHistory.push({
      status,
      updatedBy: adminId.toString(),
      timestamp: new Date(),
      details: `Admin ${prev}->${status}`,
    });
    // *** FIX: Recalculate totals BEFORE saving ***
    order.subtotal = order.cart.reduce(
      (s, i) => s + (i.price || 0) * (i.qty || 1),
      0
    );
    order.shippingCost =
      order.shippingAddress?.shippingPrice ?? order.shippingCost ?? 50;
    order.totalPrice = order.subtotal + order.shippingCost;
    console.log(
      `Recalc Admin Save: sub=${order.subtotal}, ship=${order.shippingCost}, tot=${order.totalPrice}`
    );
    // *** Attempt save WITH validation AFTER recalculation ***
    try {
      await order.save({ validateBeforeSave: true });
      console.log(`Admin OK ${orderId} to ${status}`);
    } catch (validationError) {
      console.error("!!! ADMIN UPDATE VALIDATION FAILED !!!:", validationError);
      console.error(
        "Order state pre-fail:",
        JSON.stringify(order.toObject(), null, 2)
      );
      return next(
        new ErrorHandler(
          `Order SAVE validation fail: ${validationError.message}`,
          500
        )
      );
    }
    await clearOrderCaches(orderId, order.user?._id?.toString(), null);
    res.json({ success: true, message: `OK -> ${status}`, order });
  })
);

// [DELETE] /api/v2/order/admin/delete/:id
router.delete(
  "/admin/delete/:id",
  isAuthenticated,
  isAdmin,
  catchAsyncErrors(async (req, res, next) => {
    if (!isValidObjectId(req.params.id))
      return next(new ErrorHandler("Invalid ID.", 400));
    const orderId = req.params.id;
    let userId = null;
    let sellerIds = [];
    const order = await Order.findById(orderId)
      .select("user cart.shopId")
      .lean();
    if (order) {
      userId = order.user?._id?.toString();
      sellerIds = [
        ...new Set(order.cart.map((i) => i.shopId?.toString()).filter(Boolean)),
      ];
    }
    const result = await Order.deleteOne({ _id: orderId });
    const keysToDel = new Set([
      CACHE_KEYS.ORDER_DETAIL(orderId),
      CACHE_KEYS.ADMIN_ORDERS,
    ]);
    if (userId) keysToDel.add(CACHE_KEYS.USER_ORDERS(userId));
    sellerIds.forEach((id) => keysToDel.add(CACHE_KEYS.SELLER_ORDERS(id)));
    orderCache.del(Array.from(keysToDel));
    if (result.deletedCount === 0)
      return res.status(404).json({ success: false, message: "NF." });
    console.log(`Admin deleted ${orderId}`);
    res.status(200).json({ success: true, message: "Deleted." });
  })
);

// [PUT] /api/v2/order/admin/update-item-details/:orderId/:itemId
router.put(
  "/admin/update-item-details/:orderId/:itemId",
  isAuthenticated,
  isAdmin,
  catchAsyncErrors(async (req, res, next) => {
    if (!isValidObjectId(req.params.orderId) || !req.params.itemId)
      return next(new ErrorHandler("Invalid IDs.", 400));
    const { orderId, itemId } = req.params;
    const { ProductColor, size } = req.body;
    const adminId = req.user._id;
    const order = await Order.findById(orderId);
    if (!order) return next(new ErrorHandler("Order NF.", 404));
    const idx = order.cart.findIndex(
      (i) => (i._id?.toString() || i._id) === itemId
    );
    if (idx === -1) return next(new ErrorHandler("Item NF.", 404));
    let changes = [];
    if (
      ProductColor !== undefined &&
      order.cart[idx].ProductColor !== ProductColor
    ) {
      order.cart[idx].ProductColor = ProductColor;
      changes.push(`Clr=${ProductColor}`);
    }
    if (size !== undefined && order.cart[idx].size !== size) {
      order.cart[idx].size = size;
      changes.push(`Size=${size}`);
    }
    if (changes.length === 0)
      return res.json({ success: true, message: "No change.", order });
    order.statusHistory.push({
      status: order.status,
      updatedBy: adminId.toString(),
      timestamp: new Date(),
      details: `Admin upd item (${itemId.slice(0, 6)}): ${changes.join(", ")}`,
    });
    order.subtotal = order.cart.reduce(
      (s, i) => s + (i.price || 0) * (i.qty || 1),
      0
    );
    order.shippingCost =
      order.shippingAddress?.shippingPrice ?? order.shippingCost ?? 50;
    order.totalPrice = order.subtotal + order.shippingCost;
    try {
      await order.save({ validateBeforeSave: true });
    } catch (err) {
      console.error("Admin Upd Item Val Fail", err);
      return next(new ErrorHandler(err.message, 500));
    }
    await clearOrderCaches(orderId, order.user?._id?.toString(), null);
    res.json({
      success: true,
      message: `Item upd: ${changes.join(", ")}`,
      order,
    });
  })
);

// [GET] /api/v2/order/download-design/:orderId/:itemId
router.get(
  "/download-design/:orderId/:itemId",
  isAuthenticated,
  isAdmin,
  catchAsyncErrors(async (req, res, next) => {
    if (!isValidObjectId(req.params.orderId) || !req.params.itemId)
      return next(new ErrorHandler("Invalid ID.", 400));
    const { orderId, itemId } = req.params;
    const adminId = req.user._id;
    const order = await Order.findById(orderId);
    if (!order) return next(new ErrorHandler("Order NF.", 404));
    const orderItem = order.cart.find(
      (i) => (i._id?.toString() || i._id) === itemId
    );
    if (!orderItem) return next(new ErrorHandler("Item NF.", 404));
    let url = null;
    if (orderItem.designImage)
      url =
        typeof orderItem.designImage === "string"
          ? orderItem.designImage
          : orderItem.designImage.url;
    if (!url && orderItem.productId && isValidObjectId(orderItem.productId)) {
      try {
        const p = await Product.findById(orderItem.productId)
          .select("designImage")
          .lean();
        if (p?.designImage?.url) url = p.designImage.url;
      } catch (e) {
        console.error(e);
      }
    }
    if (!url) return next(new ErrorHandler("URL NF.", 404));
    order.statusHistory.push({
      status: order.status,
      updatedBy: adminId.toString(),
      timestamp: new Date(),
      details: `Admin D/L design ${itemId.slice(0, 6)}`,
    });
    order.save({ validateBeforeSave: false }).catch(console.error);
    const designData = {
      imageUrl: url,
      url: url,
      name: `${orderItem.DesignTitle || "d"}-${itemId.slice(-6)}.png`,
      productTitle: orderItem.DesignTitle || "?",
      orderId: orderId,
      itemId: itemId,
      orderNumber: order._id.toString().slice(0, 8),
      price: {
        itemPrice: orderItem.price || 0,
        quantity: orderItem.qty || 1,
        shippingCost: order.shippingCost || 0,
        total: order.totalPrice || 0,
      },
      specs: {
        type: orderItem.ProductType || "?",
        color: orderItem.ProductColor || "?",
        size: orderItem.size || "?",
        position: {
          ...orderItem.designSpecs,
          positionX: orderItem.designSpecs?.positionX ?? 50,
          positionY: orderItem.designSpecs?.positionY ?? 50,
          scale: orderItem.designSpecs?.scale ?? 1,
          rotation: orderItem.designSpecs?.rotation ?? 0,
        },
      },
      customer: {
        name: order.user?.name || "?",
        email: order.user?.email || "?",
      },
    };
    res.json({
      success: true,
      designUrl: url,
      designData: designData,
      message: "OK",
    });
  })
);

// [GET] /api/v2/order/generate-mockup/:orderId/:itemId (Placeholder)
router.get(
  "/generate-mockup/:orderId/:itemId",
  isAuthenticated,
  isAdmin,
  catchAsyncErrors(async (req, res, next) =>
    next(new ErrorHandler("Not Impl.", 501))
  )
);

// [GET] /api/v2/order/download-specs/:id
router.get(
  "/download-specs/:id",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    if (!req.user?._id) return next(new ErrorHandler("Auth Req.", 401));
    if (!isValidObjectId(req.params.id))
      return next(new ErrorHandler("Inv ID.", 400));
    const { id } = req.params;
    const userId = req.user._id.toString();
    const userRole = req.user.role?.toLowerCase() || "user";
    const order = await Order.findById(id).populate(
      "cart.shopId",
      "name email"
    );
    if (!order) return next(new ErrorHandler("NF.", 404));
    const isOwner = order.user?._id?.toString() === userId;
    const isAdminUser = userRole === "admin";
    const sellerIdFromReq = req.seller?._id?.toString();
    const isSeller =
      userRole === "seller" &&
      order.cart.some((i) => i.shopId?._id?.toString() === sellerIdFromReq);
    if (!isAdminUser && !isOwner && !isSeller)
      return next(new ErrorHandler("Forbidden.", 403));
    const details = order.getFormattedDetails
      ? order.getFormattedDetails()
      : {
          subtotal: 0,
          shippingCost: 0,
          total: 0,
          /* ... other defaults*/ items: [],
        }; // Robust fallback
    const specsData = {
      orderInfo: {
        ...details,
        orderId: details.orderId || order._id.toString(),
        orderNumber: details.orderNumber || order._id.toString().slice(0, 8),
        paidAt: order.paidAt,
        deliveredAt: order.deliveredAt,
      },
      customer: details.customer || {},
      shipping: details.shippingAddress || {},
      items: order.cart.map((item) => {
        const formatted =
          details.items?.find((fi) => fi.id === item._id?.toString()) || {};
        return {
          itemId: item._id?.toString(),
          designTitle: item.DesignTitle,
          productType: item.ProductType,
          productColor: item.ProductColor,
          productSize: item.size,
          quantity: item.qty,
          unitPrice: item.price,
          itemTotal: (item.price || 0) * (item.qty || 1),
          designImageUrl:
            formatted.designImage ||
            (typeof item.designImage === "string"
              ? item.designImage
              : item.designImage?.url),
          designSpecs: item.designSpecs || {},
          seller: item.shopId
            ? {
                id: item.shopId._id,
                name: item.shopId.name,
                email: item.shopId.email,
              }
            : {},
        };
      }),
      statusHistory: order.statusHistory || [],
      deliveryInfo: order.deliveryInfo || null,
      printingDetails: order.printingDetails || null,
      _metadata: { exportedAt: new Date(), exportedBy: userId },
    };
    res.setHeader("Content-Type", "application/json");
    res.json({ success: true, specsData });
  })
);

// --- User Refund Route ---
// [PUT] /api/v2/order/request-refund/:id
router.put(
  "/request-refund/:id",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    if (!req.user?._id) return next(new ErrorHandler("Auth Req.", 401));
    if (!isValidObjectId(req.params.id))
      return next(new ErrorHandler("Inv ID.", 400));
    const orderId = req.params.id;
    const { reason } = req.body;
    const userId = req.user._id;
    const status = ORDER_STATUSES.REFUND_REQUESTED;
    const order = await Order.findById(orderId);
    if (!order) return next(new ErrorHandler("NF.", 404));
    if (order.user?._id?.toString() !== userId.toString())
      return next(new ErrorHandler("Forbidden.", 403));
    const nonRefundable = [
      status,
      ORDER_STATUSES.REFUND_APPROVED,
      ORDER_STATUSES.REFUND_SUCCESS,
      ORDER_STATUSES.REFUND_REJECTED,
      ORDER_STATUSES.CANCELLED,
    ];
    if (nonRefundable.includes(order.status))
      return next(
        new ErrorHandler(`Cannot refund: Status ${order.status}`, 400)
      );
    const prev = order.status;
    order.status = status;
    order.statusHistory.push({
      status,
      updatedBy: userId.toString(),
      timestamp: new Date(),
      details: `Customer refund req. ${reason ? "Reason: " + reason : ""}`,
    });
    order.subtotal = order.cart.reduce(
      (s, i) => s + (i.price || 0) * (i.qty || 1),
      0
    );
    order.shippingCost =
      order.shippingAddress?.shippingPrice ?? order.shippingCost ?? 50;
    order.totalPrice = order.subtotal + order.shippingCost;
    try {
      await order.save({ validateBeforeSave: true });
    } catch (err) {
      console.error("User Refund Req Save Fail", err);
      return next(new ErrorHandler(err.message, 500));
    }
    await clearOrderCaches(orderId, userId.toString(), null);
    res.json({ success: true, order, message: "Req submitted." });
  })
);

// --- Delivery Webhook & Tracking Routes ---
// [PUT] /api/v2/order/update-delivery/:orderId
router.put(
  "/update-delivery/:orderId",
  catchAsyncErrors(async (req, res, next) => {
    const key = req.body.apiKey || req.headers["x-delivery-apikey"];
    if (!key || key !== process.env.DELIVERY_API_KEY)
      return res.status(401).json({ s: false, m: "Auth." });
    if (!isValidObjectId(req.params.orderId))
      return res.status(400).json({ s: false, m: "Inv ID." });
    if (!req.body.status)
      return res.status(400).json({ s: false, m: "Status req." });
    const orderId = req.params.orderId;
    const { status, location, notes, timestamp, eventId } = req.body;
    const updateTime = timestamp ? new Date(timestamp) : new Date();
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ s: false, m: "NF." });
    if (
      order.deliveryInfo?.lastUpdate &&
      updateTime <= new Date(order.deliveryInfo.lastUpdate)
    )
      return res.status(200).json({ s: true, m: "Stale ignored." });
    order.updateDeliveryStatus(
      { status, location, notes, timestamp: updateTime },
      "webhook"
    );
    try {
      await order.save({ validateBeforeSave: true });
      console.log(`Webhook ok ${orderId}`);
      await clearOrderCaches(orderId, order.user?._id?.toString(), null);
      return res.status(200).json({ success: true, message: "OK" });
    } catch (err) {
      console.error(`Webhook Save ERR ${orderId}:`, err);
      return res.status(200).json({ success: false, message: "Save Err." });
    } // Return 200 to webhook
  })
);

// [GET] /api/v2/order/tracking/:orderId
router.get(
  "/tracking/:orderId",
  catchAsyncErrors(async (req, res, next) => {
    if (!isValidObjectId(req.params.orderId))
      return next(new ErrorHandler("Inv ID", 400));
    const orderId = req.params.orderId;
    const order = await Order.findById(orderId)
      .select("status deliveryInfo createdAt")
      .lean();
    if (!order) return next(new ErrorHandler("NF", 404));
    if (!order.deliveryInfo?.trackingNumber)
      return next(new ErrorHandler("Track NA", 404));
    const trackingInfo = {
      orderId: order._id.toString(),
      orderStatus: order.status,
      deliveryStatus: order.deliveryInfo.status || "?",
      trackingNumber: order.deliveryInfo.trackingNumber,
      deliveryPartner: order.deliveryInfo.partnerId || "?",
      currentLocation: order.deliveryInfo.currentLocation || "?",
      lastUpdate: order.deliveryInfo.lastUpdate || null,
      assignedAt: order.deliveryInfo.assignedAt || null,
      estimatedDelivery: order.deliveryInfo.estimatedDelivery || null,
      updatesHistory: (order.deliveryInfo.notes || [])
        .map((n) => ({ message: n.message, timestamp: n.timestamp }))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
    };
    res.json({ success: true, tracking: trackingInfo });
  })
);

module.exports = router;
