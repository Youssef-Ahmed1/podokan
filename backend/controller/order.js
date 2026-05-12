const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const NodeCache = require("node-cache");
const Order = require("../model/order");
const Shop = require("../model/shop");
const { Product } = require("../model/product");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { isAuthenticated, isSeller, isAdmin } = require("../middleware/auth");
const { ORDER_STATUSES } = require("../constants/orderStatuses");

const orderCache = new NodeCache({
  stdTTL: 300,
  checkperiod: 120,
  useClones: false,
});

const CACHE_KEYS = {
  ADMIN_ORDERS_PAGE: (page, limit) => `admin_orders_p${page}_l${limit}`,
  USER_ORDERS: (userId) => `user_orders_${userId}`,
  SELLER_ORDERS: (sellerId) => `seller_orders_${sellerId}`,
  ORDER_DETAIL: (orderId) => `order_detail_${orderId}`,
};

const isValidObjectId = (id) => id && mongoose.Types.ObjectId.isValid(id);

const clearAdminOrderPageCaches = () => {
  const adminKeys = orderCache
    .keys()
    .filter((k) => k.startsWith("admin_orders_p"));
  if (adminKeys.length > 0) {
    orderCache.del(adminKeys);
  }
};

const clearRelevantOrderCaches = (orderId, userId, involvedSellerIds = []) => {
  const keysToDelete = new Set();
  clearAdminOrderPageCaches();

  if (orderId && isValidObjectId(orderId))
    keysToDelete.add(CACHE_KEYS.ORDER_DETAIL(orderId.toString()));
  if (userId && isValidObjectId(userId))
    keysToDelete.add(CACHE_KEYS.USER_ORDERS(userId.toString()));

  involvedSellerIds.forEach((id) => {
    const sellerIdString = id?._id
      ? id._id.toString()
      : typeof id === "string" && isValidObjectId(id)
      ? id
      : null;
    if (sellerIdString) {
      keysToDelete.add(CACHE_KEYS.SELLER_ORDERS(sellerIdString));
    }
  });

  const keysArray = Array.from(keysToDelete);
  if (keysArray.length > 0) {
    orderCache.del(keysArray);
    console.log("[Cache] Cleared relevant caches:", keysArray);
  }
};

router.post(
  "/create-order",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
      const { cart, shippingAddress, paymentInfo } = req.body;
      const currentUser = req.user;

      if (!currentUser?._id || !isValidObjectId(currentUser._id)) {
          return next(new ErrorHandler("User authentication is invalid.", 401));
      }
      if (!Array.isArray(cart) || cart.length === 0) {
          return next(new ErrorHandler("Cart cannot be empty.", 400));
      }
      if (
          !shippingAddress?.address1 ||
          !shippingAddress.city ||
          !shippingAddress.country ||
          !shippingAddress.phoneNumber
      ) {
          return next(
              new ErrorHandler(
                  "Shipping address incomplete. Required fields: Address Line 1, City, Country, Phone Number.",
                  400,
              ),
          );
      }

      if (shippingAddress.country !== "Egypt") {
          return next(
              new ErrorHandler(
                  "Shipping is currently only available within Egypt.",
                  400,
              ),
          );
      }


      const shopItemsMap = new Map();

      for (const item of cart) {
          const missing = [];
          if (!item.shopId || !isValidObjectId(item.shopId))
              missing.push("Shop ID");
          if (item.price == null || item.price < 0) missing.push("Price");
          if (!item.qty || item.qty < 1) missing.push("Quantity");
          if (!item.designImage?.url) missing.push("Design Image URL");
          if (!item.DesignTitle) missing.push("Design Title");
          if (!item.ProductType) missing.push("Product Type");
          if (!item.ProductColor) missing.push("Product Color");
          if (!item.size) missing.push("size");
          if (missing.length > 0) {
              return next(
                  new ErrorHandler(
                      `Cart item is invalid. Missing: ${missing.join(", ")}.`,
                      400,
                  ),
              );
          }

          const realProduct = await Product.findById(item.productId);

          if (!realProduct) {
              return next(
                  new ErrorHandler(`Product not found in database.`, 404),
              );
          }

          if (Number(item.price) !== Number(realProduct.price)) {
              return next(
                  new ErrorHandler(
                      `the price for "${item.DesignTitle}"
    has changed. please check the new price`,
                      400,
                  ),
              );
          }

          const designIamgeObject = {
              public_id: item.designImage.public_id || null,
              url: item.designImage.url,
          };
          const shopIdStr = item.shopId.toString();

          if (!shopItemsMap.has(shopIdStr)) {
              shopItemsMap.set(shopIdStr, []);
          }
          shopItemsMap.get(shopIdStr).push({
              productId:
                  item.productId && isValidObjectId(item.productId)
                      ? item.productId
                      : null,

              qty: item.qty,
              shopId: item.shopId,
              price: realProduct.price,
              designImage: designImageObject,
              DesignTitle: item.DesignTitle,
              ProductType: item.ProductType,
              ProductColor: item.ProductColor,
              size: item.size,
              designSpecs: item.designSpecs || {
                  positionX: 50,
                  positionY: 50,
                  scale: 1,
                  rotation: 0,
              },
          });
      }

      const shippingCostPerSellerOrder =
          typeof shippingAddress.shippingPrice === "number" &&
          shippingAddress.shippingPrice >= 0
              ? shippingAddress.shippingPrice
              : 50;

      const createdOrders = [];
      const orderPromises = [];
      const involvedSellerIds = Array.from(shopItemsMap.keys());

      for (const [shopIdStr, shopItems] of shopItemsMap.entries()) {
          const subtotal = shopItems.reduce(
              (acc, item) => acc + (item.price || 0) * (item.qty || 1),
              0,
          );
          const total = subtotal + shippingCostPerSellerOrder;

          const orderData = {
              cart: shopItems,
              shippingAddress: {
                  address1: shippingAddress.address1,
                  address2: shippingAddress.address2 || "",
                  city: shippingAddress.city,
                  country: shippingAddress.country,
                  postalCode: shippingAddress.postalCode || "",
                  phoneNumber: shippingAddress.phoneNumber,
                  shippingPrice: shippingCostPerSellerOrder,
              },
              shippingCost: shippingCostPerSellerOrder,
              user: {
                  _id: currentUser._id,
                  name: currentUser.name,
                  email: currentUser.email,
              },
              subtotal: subtotal,
              totalPrice: total,
              paymentInfo: paymentInfo || {
                  type: "Cash On Delivery",
                  status: "Processing",
                  id: null,
              },
              status: ORDER_STATUSES.PROCESSING,
          };

          orderPromises.push(
              Order.create(orderData)
                  .then(async (order) => {
                      createdOrders.push(order);
                  })
                  .catch((creationError) => {
                      console.error(
                          `Failed to create order part for shop ${shopIdStr}:`,
                          creationError.message,
                          creationError.stack,
                      );
                      throw new ErrorHandler(
                          `Order creation failed for one or more shops: ${creationError.message}`,
                          500,
                      );
                  }),
          );
      }

      try {
          await Promise.all(orderPromises);
          clearRelevantOrderCaches(
              null,
              currentUser._id.toString(),
              involvedSellerIds,
          );

          res.status(201).json({
              success: true,
              message: "Order created successfully.",
              orders: createdOrders,
          });
      } catch (error) {
          console.error("Error processing order creation batch:", error);
          return next(
              error instanceof ErrorHandler
                  ? error
                  : new ErrorHandler("Failed to complete order creation.", 500),
          );
      }
  })
);

router.get(
  "/get-user-orders",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    if (!req.user?._id || !isValidObjectId(req.user._id)) {
      console.error(
        "CRITICAL: User ID missing or invalid in get-user-orders route."
      );
      return next(new ErrorHandler("User authentication data invalid.", 500));
    }

    const userId = req.user._id;
    const userIdString = userId.toString();
    const cacheKey = CACHE_KEYS.USER_ORDERS(userIdString);
    const cachedOrders = orderCache.get(cacheKey);

    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, private"
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    if (cachedOrders) {
      return res.json({
        success: true,
        orders: cachedOrders,
        count: cachedOrders.length,
        fromCache: true,
      });
    }

    try {
      const orders = await Order.find({ "user._id": userId })
        .sort({ createdAt: -1 })
        .lean();
      console.log(
        `Database query returned ${orders.length} orders for user ${userIdString}`
      );

      orderCache.set(cacheKey, orders);

      res.json({
        success: true,
        orders,
        count: orders.length,
        fromCache: false,
      });
    } catch (dbError) {
      console.error(
        `Database error fetching orders for user ${userIdString}:`,
        dbError
      );
      return next(new ErrorHandler("Failed to retrieve your orders.", 500));
    }
  })
);

router.get(
  "/get-order/:id",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return next(new ErrorHandler("Invalid Order ID format.", 400));
    }

    const cacheKey = CACHE_KEYS.ORDER_DETAIL(id);
    const cachedOrder = orderCache.get(cacheKey);

    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, private"
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    const checkAuthAndRespond = (orderData, fromCache = false) => {
      if (!orderData) return next(new ErrorHandler("Order not found.", 404));
      if (!req.user?._id)
        return next(new ErrorHandler("Authentication error.", 500));

      const isOwner =
        orderData.user?._id?.toString() === req.user._id.toString();
      const isAdminUser = req.user.role?.toLowerCase() === "admin";

      if (!isOwner && !isAdminUser) {
        return next(
          new ErrorHandler("Forbidden: You cannot access this order.", 403)
        );
      }
      res.json({ success: true, order: orderData, fromCache });
    };

    if (cachedOrder) return checkAuthAndRespond(cachedOrder, true);

    try {
      const order = await Order.findById(id).lean();
      if (order) orderCache.set(cacheKey, order);
      checkAuthAndRespond(order, false);
    } catch (dbError) {
      console.error(`Database error fetching order ${id}:`, dbError);
      return next(new ErrorHandler("Failed to retrieve order details.", 500));
    }
  })
);

router.get(
  "/get-seller-orders",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    if (!req.seller?._id || !isValidObjectId(req.seller._id)) {
      return next(new ErrorHandler("Invalid seller authentication.", 401));
    }
    const sellerId = req.seller._id;
    const sellerIdString = sellerId.toString();
    const cacheKey = CACHE_KEYS.SELLER_ORDERS(sellerIdString);
    const cachedData = orderCache.get(cacheKey);

    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, private"
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    if (cachedData) {
      return res.json({
        success: true,
        orders: cachedData.orders || [],
        count: (cachedData.orders || []).length,
        fromCache: true,
      });
    }

    try {
      const dbOrders = await Order.find({ "cart.shopId": sellerId })
        .sort({ createdAt: -1 })
        .lean();
      orderCache.set(cacheKey, { orders: dbOrders });
      res.json({
        success: true,
        orders: dbOrders,
        count: dbOrders.length,
        fromCache: false,
      });
    } catch (dbError) {
      console.error(
        `Database error fetching orders for seller ${sellerIdString}:`,
        dbError
      );
      return next(new ErrorHandler("Failed to retrieve seller orders.", 500));
    }
  })
);

router.put(
  "/accept-refund/:id",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const { status: newStatus } = req.body;

    if (!req.seller?._id || !isValidObjectId(req.seller._id)) {
      return next(new ErrorHandler("Invalid seller authentication.", 401));
    }
    const sellerId = req.seller._id.toString();

    if (!isValidObjectId(id))
      return next(new ErrorHandler("Invalid Order ID format.", 400));

    const allowedStatuses = [
      ORDER_STATUSES.REFUND_APPROVED,
      ORDER_STATUSES.REFUND_REJECTED,
    ];
    if (!newStatus || !allowedStatuses.includes(newStatus)) {
      return next(
        new ErrorHandler(
          `Invalid or missing status. Must be one of: ${allowedStatuses.join(
            ", "
          )}.`,
          400
        )
      );
    }

    try {
      const order = await Order.findById(id);
      if (!order) return next(new ErrorHandler("Order not found.", 404));

      const isSellerAssociated = order.cart.some(
        (item) => item.shopId?.toString() === sellerId
      );
      if (!isSellerAssociated)
        return next(
          new ErrorHandler(
            "You are not authorized to update this order's refund status.",
            403
          )
        );

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

      if (newStatus === ORDER_STATUSES.REFUND_APPROVED) {
        console.log(`REFUND APPROVED for order ${id} by seller ${sellerId}`);
      }

      const updatedOrder = await order.save();
      clearRelevantOrderCaches(id, order.user?._id, [sellerId]);

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

router.get(
  "/admin-all-orders",
  isAuthenticated,
  isAdmin,
  catchAsyncErrors(async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    const cacheKey = CACHE_KEYS.ADMIN_ORDERS_PAGE(page, limit);
    const cachedData = orderCache.get(cacheKey);

    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, private"
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    if (cachedData) {
      return res.json({ ...cachedData, success: true, fromCache: true });
    }

    try {
      const [totalOrders, orders] = await Promise.all([
        Order.countDocuments(),
        Order.find()
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .select("-__v")
          .lean(),
      ]);

      const totalPages = Math.ceil(totalOrders / limit);
      const responseData = {
        orders,
        totalOrders,
        currentPage: page,
        totalPages,
        limit,
      };
      orderCache.set(cacheKey, responseData);

      res.json({ ...responseData, success: true, fromCache: false });
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

router.put(
  "/admin-update-status/:id",
  isAuthenticated,
  isAdmin,
  catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const { status: newStatus } = req.body;
    const adminId = req.user._id.toString();

    if (!newStatus)
      return next(new ErrorHandler("New status is required.", 400));
    if (!Object.values(ORDER_STATUSES).includes(newStatus))
      return next(
        new ErrorHandler(`Invalid status value provided: "${newStatus}".`, 400)
      );
    if (!isValidObjectId(id))
      return next(new ErrorHandler("Invalid Order ID format.", 400));

    try {
      const order = await Order.findById(id).lean();

      if (!order) return next(new ErrorHandler("Order not found.", 404));
      if (order.status === newStatus) {
        return res.json({
          success: true,
          message: `Order status is already '${newStatus}'. No update needed.`,
          order: order,
        });
      }

      const previousStatus = order.status;
      const updateFields = { $set: {}, $push: {} };
      updateFields.$set.status = newStatus;

      if (newStatus === ORDER_STATUSES.DELIVERED && !order.deliveredAt) {
        updateFields.$set.deliveredAt = new Date();
        if (
          order.paymentInfo?.type === "Cash On Delivery" &&
          order.paymentInfo.status !== "Succeeded"
        ) {
          updateFields.$set["paymentInfo.status"] = "Succeeded";
          if (!order.paidAt) updateFields.$set.paidAt = new Date();
        }
      } else if (newStatus === ORDER_STATUSES.CANCELLED) {
        console.warn(
          `Order ${id} cancelled. Consider stock replenishment logic.`
        );
      }

      updateFields.$push.statusHistory = {
        status: newStatus,
        updatedBy: `admin:${adminId}`,
        timestamp: new Date(),
        details: `Admin changed status from '${previousStatus}' to '${newStatus}'.`,
      };

      const updatedOrderResult = await Order.findByIdAndUpdate(
        id,
        updateFields,
        { new: true, runValidators: false }
      );

      if (!updatedOrderResult) {
        console.error(
          `[Admin API] Update failed for order ${id} after initial find.`
        );
        return next(new ErrorHandler("Failed to update order.", 500));
      }

      console.log(
        `[Admin API] Successfully updated status for order ${id} to '${newStatus}'`
      );

      const involvedSellers = [
        ...new Set(
          updatedOrderResult.cart
            .map((i) => i.shopId?.toString())
            .filter(Boolean)
        ),
      ];
      clearRelevantOrderCaches(
        id,
        updatedOrderResult.user?._id,
        involvedSellers
      );

      res.json({
        success: true,
        message: `Order status updated to '${newStatus}'.`,
        order: updatedOrderResult.toObject(),
      });
    } catch (e) {
      console.error(
        `Admin status update SAVE error (Order ${id}, Status ${newStatus}):`,
        e
      );
      return next(
        new ErrorHandler(`Failed to save status update: ${e.message}`, 500)
      );
    }
  })
);

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

    try {
      const order = await Order.findById(orderId).lean();
      if (!order) return next(new ErrorHandler("Order not found.", 404));

      const item = order.cart.find(
        (cartItem) => cartItem._id?.toString() === itemId
      );
      if (!item)
        return next(new ErrorHandler("Item not found within this order.", 404));

      const designUrl = item.designImage?.url;
      if (!designUrl) {
        console.error(
          `Design URL missing for item ${itemId} in order ${orderId}.`
        );
        return next(
          new ErrorHandler(
            "Design image URL is missing for this item. Download unavailable.",
            404
          )
        );
      }

      Order.findByIdAndUpdate(
        orderId,
        {
          $push: {
            statusHistory: {
              status: order.status,
              updatedBy: `admin:${adminId}`,
              timestamp: new Date(),
              details: `Admin DL requested for item: ${
                item.DesignTitle || "Untitled"
              } (ID: ${itemId}).`,
            },
          },
        },
        { new: false, timestamps: false }
      )
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

      res.setHeader(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, private"
      );
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.json({ success: true, designData: payload });
    } catch (dbError) {
      console.error(
        `Error fetching data for design download (Order ${orderId}, Item ${itemId}):`,
        dbError
      );
      return next(
        new ErrorHandler("Failed to retrieve data for design download.", 500)
      );
    }
  })
);

router.delete(
  "/admin/delete/:id",
  isAuthenticated,
  isAdmin,
  catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    if (!isValidObjectId(id))
      return next(new ErrorHandler("Invalid Order ID format.", 400));

    try {
      const order = await Order.findById(id).select("user cart").lean();
      if (!order) return next(new ErrorHandler("Order not found.", 404));

      const userId = order.user?._id;
      const involvedSellers = [
        ...new Set(order.cart.map((i) => i.shopId?.toString()).filter(Boolean)),
      ];

      const result = await Order.deleteOne({ _id: id });
      if (result.deletedCount === 0) {
        console.error(
          `Admin delete failed for order ${id}, but order was found initially.`
        );
        return next(
          new ErrorHandler("Order deletion failed unexpectedly.", 500)
        );
      }

      clearRelevantOrderCaches(id, userId, involvedSellers);
      console.log(`Admin deleted order ${id} successfully.`);

      res
        .status(200)
        .json({ success: true, message: "Order deleted successfully." });
    } catch (error) {
      console.error(`Error deleting order ${id}:`, error);
      return next(
        new ErrorHandler(`Failed to delete order: ${error.message}`, 500)
      );
    }
  })
);

module.exports = router;
