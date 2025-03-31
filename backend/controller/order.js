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

const orderCache = new NodeCache({
  stdTTL: 600,
  checkperiod: 300,
  useClones: false,
});
const CACHE_KEYS = {
  ADMIN_ORDERS: "admin_all_orders",
  USER_ORDERS: (uId) => `user_orders_${uId}`,
  SELLER_ORDERS: (sId) => `seller_orders_${sId}`,
  ORDER_DETAIL: (oId) => `order_detail_${oId}`,
};

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const clearOrderCaches = (
  orderId,
  userId,
  sellerId,
  involvedSellerIds = []
) => {
  const keysToDelete = [CACHE_KEYS.ADMIN_ORDERS];
  if (orderId) keysToDelete.push(CACHE_KEYS.ORDER_DETAIL(orderId));
  if (userId) keysToDelete.push(CACHE_KEYS.USER_ORDERS(userId));
  if (sellerId) keysToDelete.push(CACHE_KEYS.SELLER_ORDERS(sellerId));
  involvedSellerIds.forEach((id) =>
    keysToDelete.push(CACHE_KEYS.SELLER_ORDERS(id))
  );
  orderCache.del([...new Set(keysToDelete)]);
};

const updateProductStock = async (productId, qtyChange) => {
  if (
    !productId ||
    !isValidObjectId(productId) ||
    typeof qtyChange !== "number"
  )
    return;
  try {
    const product = await Product.findById(productId);
    if (product) {
      product.stock = Math.max(0, product.stock - qtyChange);
      product.sold_out = (product.sold_out || 0) + qtyChange;
      await product.save({ validateBeforeSave: false });
    }
  } catch (error) {
    console.error(`Stock update error for ${productId}:`, error.message);
  }
};

// POST /create-order
router.post(
  "/create-order",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    const { cart, shippingAddress, user, paymentInfo } = req.body;
    if (!cart?.length) return next(new ErrorHandler("Cart is empty.", 400));
    if (!shippingAddress?.address1 || !user?._id)
      return next(new ErrorHandler("Shipping/user info missing.", 400));
    for (const item of cart) {
      // Basic validation
      if (
        !item.shopId ||
        item.price == null ||
        item.qty == null ||
        !item.designImage ||
        !item.DesignTitle ||
        !item.ProductType ||
        !item.ProductColor ||
        !item.size
      )
        return next(
          new ErrorHandler(
            `Cart item missing fields: ${item.DesignTitle || "Unknown"}`,
            400
          )
        );
      if (item.price < 0 || item.qty < 1)
        return next(
          new ErrorHandler(
            `Invalid price/qty: ${item.DesignTitle || "Unknown"}`,
            400
          )
        );
    }

    const shippingCostPerSellerOrder = shippingAddress.shippingPrice ?? 50;
    const shopItemsMap = new Map();
    cart.forEach((item) => {
      const shopId = item.shopId?.toString();
      if (!shopId) return;
      if (!shopItemsMap.has(shopId)) shopItemsMap.set(shopId, []);
      shopItemsMap
        .get(shopId)
        .push({
          productId: item.productId || null,
          qty: item.qty,
          shopId,
          price: item.price,
          designImage:
            typeof item.designImage === "string"
              ? { url: item.designImage }
              : item.designImage,
          DesignTitle: item.DesignTitle,
          ProductType: item.ProductType,
          ProductColor: item.ProductColor,
          size: item.size,
          designSpecs: item.designSpecs || {},
        });
    });

    const createdOrders = [];
    const orderPromises = [];
    for (const [shopId, shopItems] of shopItemsMap.entries()) {
      const subtotal = shopItems.reduce(
        (acc, item) => acc + item.price * item.qty,
        0
      );
      const total = subtotal + shippingCostPerSellerOrder;
      orderPromises.push(
        Order.create({
          cart: shopItems,
          shippingAddress,
          shippingCost: shippingCostPerSellerOrder,
          user: { _id: user._id, name: user.name, email: user.email },
          subtotal,
          totalPrice: total,
          paymentInfo: paymentInfo || {
            type: "Cash On Delivery",
            status: "Processing",
          },
          status: ORDER_STATUSES.PROCESSING,
        })
          .then((order) => {
            createdOrders.push(order);
            order.cart.forEach((item) => {
              if (item.productId) updateProductStock(item.productId, item.qty);
            });
          })
          .catch((e) => {
            throw new Error(`Save failed for shop ${shopId}: ${e.message}`);
          })
      );
    }

    try {
      await Promise.all(orderPromises);
      clearOrderCaches(null, user._id.toString(), null, [
        ...shopItemsMap.keys(),
      ]);
      res.status(201).json({ success: true, orders: createdOrders });
    } catch (error) {
      return next(
        new ErrorHandler(error.message || "Order creation failed.", 500)
      );
    }
  })
);

// GET /get-user-orders
router.get(
  "/get-user-orders",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    const userId = req.user._id.toString();
    const cacheKey = CACHE_KEYS.USER_ORDERS(userId);
    const cached = orderCache.get(cacheKey);
    if (cached)
      return res.json({
        success: true,
        orders: cached,
        count: cached.length,
        fromCache: true,
      });
    const orders = await Order.find({ "user._id": userId })
      .sort({ createdAt: -1 })
      .lean();
    orderCache.set(cacheKey, orders);
    res.json({ success: true, orders, count: orders.length, fromCache: false });
  })
);

// GET /get-order/:id
router.get(
  "/get-order/:id",
  catchAsyncErrors(async (req, res, next) => {
    // Auth check removed, add if needed
    const { id } = req.params;
    if (!isValidObjectId(id)) return next(new ErrorHandler("Invalid ID.", 400));
    const cacheKey = CACHE_KEYS.ORDER_DETAIL(id);
    const cached = orderCache.get(cacheKey);
    if (cached)
      return res.json({ success: true, order: cached, fromCache: true });
    const order = await Order.findById(id).lean();
    if (!order) return next(new ErrorHandler("Not found.", 404));
    // Auth check: if (req.user && (req.user.role === 'admin' || order.user._id.toString() === req.user._id.toString())) { ... } else { return next(new ErrorHandler("Forbidden", 403)); }
    orderCache.set(cacheKey, order);
    res.json({ success: true, order, fromCache: false });
  })
);

// GET /get-seller-orders
router.get(
  "/get-seller-orders",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    const sellerId = req.seller._id.toString();
    const cacheKey = CACHE_KEYS.SELLER_ORDERS(sellerId);
    const cached = orderCache.get(cacheKey);
    const ttl = 300000; // 5 min cache
    if (cached && Date.now() - (cached.timestamp || 0) < ttl)
      return res.json({
        success: true,
        orders: cached.data || [],
        count: (cached.data || []).length,
        fromCache: true,
      });
    const dbOrders = await Order.find({ "cart.shopId": sellerId })
      .sort({ createdAt: -1 })
      .lean();
    const sellerOrders = dbOrders.map((o) => ({
      ...o,
      cart: o.cart.filter((i) => i.shopId?.toString() === sellerId),
    }));
    orderCache.set(cacheKey, { data: sellerOrders, timestamp: Date.now() });
    res.json({
      success: true,
      orders: sellerOrders,
      count: sellerOrders.length,
      fromCache: false,
    });
  })
);

// GET /get-seller-order/:id
router.get(
  "/get-seller-order/:id",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const sellerId = req.seller._id.toString();
    if (!isValidObjectId(id)) return next(new ErrorHandler("Invalid ID.", 400));
    const order = await Order.findById(id).lean();
    if (!order) return next(new ErrorHandler("Not found.", 404));
    const sellerItems = order.cart.filter(
      (i) => i.shopId?.toString() === sellerId
    );
    if (sellerItems.length === 0)
      return next(
        new ErrorHandler("Not found or no items from your shop.", 404)
      );
    res.json({ success: true, order: { ...order, cart: sellerItems } });
  })
);

// PUT /accept-refund/:id (Seller)
router.put(
  "/accept-refund/:id",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body;
    const sellerId = req.seller._id.toString();
    if (!isValidObjectId(id)) return next(new ErrorHandler("Invalid ID.", 400));
    const allowed = [
      ORDER_STATUSES.REFUND_APPROVED,
      ORDER_STATUSES.REFUND_REJECTED,
    ];
    if (!allowed.includes(status))
      return next(
        new ErrorHandler(`Invalid status. Use ${allowed.join("/")}.`, 400)
      );
    const order = await Order.findById(id);
    if (!order) return next(new ErrorHandler("Not found.", 404));
    if (!order.cart.some((i) => i.shopId?.toString() === sellerId))
      return next(new ErrorHandler("Not authorized.", 403));
    if (order.status !== ORDER_STATUSES.PROCESSING_REFUND)
      return next(
        new ErrorHandler(
          `Order not in '${ORDER_STATUSES.PROCESSING_REFUND}' status.`,
          400
        )
      );

    order.status = status;
    order.statusHistory.push({
      status,
      updatedBy: `seller:${sellerId}`,
      timestamp: new Date(),
      details: `Seller ${
        status === ORDER_STATUSES.REFUND_APPROVED ? "approved" : "rejected"
      } refund.`,
    });
    const updatedOrder = await order.save();
    clearOrderCaches(id, order.user?._id?.toString(), sellerId, [sellerId]);
    // Optional: Stock return logic if approved (better handled by admin maybe)
    res.json({
      success: true,
      message: `Refund status set to '${status}'.`,
      order: updatedOrder,
    });
  })
);

// GET /admin/order/:id
router.get(
  "/admin/order/:id",
  isAuthenticated,
  isAdmin,
  catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    if (!isValidObjectId(id)) return next(new ErrorHandler("Invalid ID.", 400));
    const cacheKey = CACHE_KEYS.ORDER_DETAIL(id);
    const cached = orderCache.get(cacheKey);
    if (cached)
      return res.json({ success: true, order: cached, fromCache: true });
    const order = await Order.findById(id).lean();
    if (!order) return next(new ErrorHandler("Not found.", 404));
    orderCache.set(cacheKey, order);
    res.json({ success: true, order, fromCache: false });
  })
);

// GET /admin/all-orders
router.get(
  "/admin/all-orders",
  isAuthenticated,
  isAdmin,
  catchAsyncErrors(async (req, res, next) => {
    const cacheKey = CACHE_KEYS.ADMIN_ORDERS;
    const cached = orderCache.get(cacheKey);
    if (cached)
      return res.json({
        success: true,
        orders: cached.orders,
        count: cached.count,
        fromCache: true,
      });
    const orders = await Order.find().sort({ createdAt: -1 }).lean();
    const count = orders.length;
    orderCache.set(cacheKey, { orders, count });
    res.json({ success: true, orders, count, fromCache: false });
  })
);

// PUT /admin/update-status/:id
router.put(
  "/admin/update-status/:id",
  isAuthenticated,
  isAdmin,
  catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body;
    const adminId = req.user._id.toString();
    if (!status) return next(new ErrorHandler("Status required.", 400));
    if (!Object.values(ORDER_STATUSES).includes(status))
      return next(new ErrorHandler(`Invalid status: "${status}".`, 400));
    if (!isValidObjectId(id)) return next(new ErrorHandler("Invalid ID.", 400));

    const order = await Order.findById(id);
    if (!order) return next(new ErrorHandler("Not found.", 404));
    if (order.status === status)
      return res.json({
        success: true,
        message: `Status already ${status}.`,
        order,
      });

    const previousStatus = order.status;
    order.status = status;
    if (status === ORDER_STATUSES.DELIVERED && !order.deliveredAt) {
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
    // Optional: Stock return for cancellations?
    // if (status === ORDER_STATUSES.CANCELLED && previousStatus !== ORDER_STATUSES.CANCELLED) { ... }
    order.statusHistory.push({
      status,
      updatedBy: `admin:${adminId}`,
      timestamp: new Date(),
      details: `Admin changed status: ${previousStatus} -> ${status}.`,
    });

    // Explicit recalc before save might be redundant due to pre-save hook, but safe.
    order.subtotal = order.cart.reduce(
      (sum, i) => sum + (i.price || 0) * (i.qty || 1),
      0
    );
    order.shippingCost =
      order.shippingCost ?? order.shippingAddress?.shippingPrice ?? 50;
    order.totalPrice = order.subtotal + order.shippingCost;

    try {
      const updatedOrder = await order.save();
      const involvedSellers = [
        ...new Set(order.cart.map((i) => i.shopId?.toString()).filter(Boolean)),
      ];
      clearOrderCaches(id, order.user?._id?.toString(), null, involvedSellers);
      res.json({
        success: true,
        message: `Status updated to ${status}.`,
        order: updatedOrder,
      });
    } catch (e) {
      const msgs = Object.values(e.errors)
        .map((err) => err.message)
        .join(", ");
      return next(new ErrorHandler(`Validation failed: ${msgs}`, 400));
    }
  })
);

// DELETE /admin/delete/:id
router.delete(
  "/admin/delete/:id",
  isAuthenticated,
  isAdmin,
  catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    if (!isValidObjectId(id)) return next(new ErrorHandler("Invalid ID.", 400));
    const order = await Order.findById(id);
    if (!order) return next(new ErrorHandler("Not found.", 404));
    const userId = order.user?._id?.toString();
    const involvedSellers = [
      ...new Set(order.cart.map((i) => i.shopId?.toString()).filter(Boolean)),
    ];
    await Order.deleteOne({ _id: id });
    clearOrderCaches(id, userId, null, involvedSellers);
    res.json({ success: true, message: "Order deleted." });
  })
);

// PUT /update-item-details/:orderId/:itemId (Admin)
router.put(
  "/update-item-details/:orderId/:itemId",
  isAuthenticated,
  isAdmin,
  catchAsyncErrors(async (req, res, next) => {
    const { orderId, itemId } = req.params;
    const { ProductColor, size } = req.body;
    const adminId = req.user._id.toString();
    if (!isValidObjectId(orderId) || !itemId)
      return next(new ErrorHandler("Invalid ID.", 400));
    if (ProductColor === undefined && size === undefined)
      return next(new ErrorHandler("No update data.", 400));

    const order = await Order.findById(orderId);
    if (!order) return next(new ErrorHandler("Not found.", 404));
    const itemIndex = order.cart.findIndex((i) => i._id.toString() === itemId);
    if (itemIndex === -1) return next(new ErrorHandler("Item not found.", 404));

    let log = "Admin updated item:";
    let updated = false;
    if (
      ProductColor !== undefined &&
      ProductColor !== order.cart[itemIndex].ProductColor
    ) {
      order.cart[itemIndex].ProductColor = ProductColor;
      log += ` Color=${ProductColor}`;
      updated = true;
    }
    if (size !== undefined && size !== order.cart[itemIndex].size) {
      order.cart[itemIndex].size = size;
      log += `${updated ? "," : ""} Size=${size}`;
      updated = true;
    }
    if (!updated)
      return res.json({ success: true, message: "No changes.", order });

    order.statusHistory.push({
      status: order.status,
      updatedBy: `admin:${adminId}`,
      timestamp: new Date(),
      details: `${log} (Item: ${itemId})`,
    });
    order.markModified("cart");

    try {
      const updatedOrder = await order.save();
      const involvedSellers = [
        ...new Set(order.cart.map((i) => i.shopId?.toString()).filter(Boolean)),
      ];
      clearOrderCaches(
        orderId,
        order.user?._id?.toString(),
        null,
        involvedSellers
      );
      res.json({
        success: true,
        message: "Item updated.",
        order: updatedOrder,
      });
    } catch (e) {
      const msgs = Object.values(e.errors)
        .map((err) => err.message)
        .join(", ");
      return next(new ErrorHandler(`Validation failed: ${msgs}`, 400));
    }
  })
);

// GET /download-design/:orderId/:itemId (Admin)
router.get(
  "/download-design/:orderId/:itemId",
  isAuthenticated,
  isAdmin,
  catchAsyncErrors(async (req, res, next) => {
    const { orderId, itemId } = req.params;
    const adminId = req.user._id.toString();
    if (!isValidObjectId(orderId) || !itemId)
      return next(new ErrorHandler("Invalid ID.", 400));
    const order = await Order.findById(orderId).lean();
    if (!order) return next(new ErrorHandler("Not found.", 404));
    const item = order.cart.find((i) => i._id.toString() === itemId);
    if (!item) return next(new ErrorHandler("Item not found.", 404));
    let url =
      item.designImage?.url ||
      (typeof item.designImage === "string" ? item.designImage : null);
    if (!url && item.productId && isValidObjectId(item.productId)) {
      try {
        const prod = await Product.findById(item.productId)
          .select("designImage")
          .lean();
        if (prod?.designImage?.url) url = prod.designImage.url;
      } catch {
        /* ignore */
      }
    }
    if (!url) return next(new ErrorHandler("Design URL not found.", 404));

    // Log async
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
      .catch(console.error);

    const payload = {
      imageUrl: url,
      orderId: order._id.toString(),
      itemId: item._id.toString(),
      orderNumber: order._id.toString().slice(-8),
      productTitle: item.DesignTitle || "Untitled",
      specs: {
        type: item.ProductType,
        color: item.ProductColor,
        size: item.size,
        position: {
          positionX: item.designSpecs?.positionX ?? 50,
          positionY: item.designSpecs?.positionY ?? 50,
          scale: item.designSpecs?.scale ?? 1,
          rotation: item.designSpecs?.rotation ?? 0,
        },
      },
      price: {
        itemPrice: item.price,
        quantity: item.qty,
        itemTotal: (item.price || 0) * (item.qty || 1),
        shippingCost: order.shippingCost,
        orderTotal: order.totalPrice,
      },
    };
    res.json({ success: true, designData: payload });
  })
);

module.exports = router;
