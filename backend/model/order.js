const mongoose = require("mongoose");
const { ORDER_STATUSES } = require("../constants/orderStatuses");

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },
    qty: {
      type: Number,
      required: [true, "Item quantity is required."],
      min: [1, "Minimum quantity must be 1."],
      default: 1,
    },
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: [true, "Item must belong to a specific Shop."],
      index: true,
    },
    price: {
      type: Number,
      required: [true, "Item price is required."],
      min: [0, "Price cannot be negative."],
      default: 0,
    },
    designImage: {
      public_id: { type: String, trim: true, default: null },
      url: {
        type: String,
        required: [true, "Item design image URL is required."],
        trim: true,
      },
    },
    DesignTitle: {
      type: String,
      required: [true, "Item design title is required."],
      trim: true,
      default: "Untitled Design",
    },
    ProductType: {
      type: String,
      required: [true, "Item product type is required."],
      trim: true,
      default: "Unknown",
    },
    ProductColor: {
      type: String,
      required: [true, "Item product color is required."],
      default: "White",
      trim: true,
    },
    Size: {
      type: String,
      required: [true, "Item Size is required."],
      default: "One Size",
      trim: true,
    },
    designSpecs: {
      positionX: { type: Number, default: 50, min: 0, max: 100 },
      positionY: { type: Number, default: 50, min: 0, max: 100 },
      scale: { type: Number, default: 1, min: 0.1, max: 5 },
      rotation: { type: Number, default: 0, min: -360, max: 360 },
    },
  },
  { _id: true }
);

const orderSchema = new mongoose.Schema(
  {
    cart: {
      type: [orderItemSchema],
      required: true,
      validate: [
        (v) => Array.isArray(v) && v.length > 0,
        "Order cart cannot be empty.",
      ],
    },
    shippingAddress: {
      address1: {
        type: String,
        required: [true, "Shipping address line 1 is required."],
        trim: true,
      },
      address2: { type: String, trim: true, default: "" },
      city: {
        type: String,
        required: [true, "Shipping city is required."],
        trim: true,
      },

      postalCode: { type: String, trim: true, default: "" },
      phoneNumber: {
        type: String,
        required: [true, "Shipping phone number is required."],
        trim: true,
      },
      shippingPrice: { type: Number, default: 50, min: 0 },
    },
    shippingCost: {
      type: Number,
      required: [true, "Order shipping cost is required."],
      default: 50,
      min: 0,
    },
    user: {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },
      name: { type: String, required: [true, "User name is required."] },
      email: { type: String, required: [true, "User email is required."] },
    },
    subtotal: {
      type: Number,
      required: [true, "Order subtotal is required."],
      default: 0,
      min: 0,
    },
    totalPrice: {
      type: Number,
      required: [true, "Order total price is required."],
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      required: true,
      default: ORDER_STATUSES.PROCESSING,
      enum: {
        values: Object.values(ORDER_STATUSES),
        message: '"{VALUE}" is not a valid order status.',
      },
      index: true,
    },
    paymentInfo: {
      id: { type: String, trim: true },
      status: { type: String, default: "Processing", trim: true },
      type: { type: String, default: "Cash On Delivery", trim: true },
    },
    paidAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    statusHistory: [
      {
        status: { type: String, required: true },
        updatedBy: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        details: { type: String, trim: true, default: "" },
        _id: false,
      },
    ],
  },
  { timestamps: true }
);

orderSchema.index({ "user._id": 1, createdAt: -1 });
orderSchema.index({ "cart.shopId": 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });

orderSchema.pre("save", function (next) {
  // Always recalculate subtotal based on current cart
  this.subtotal = this.cart.reduce(
    (sum, item) => sum + (item.price || 0) * (item.qty || 1),
    0
  );

  // Ensure shippingCost is valid
  this.shippingCost =
    typeof this.shippingCost === "number" && this.shippingCost >= 0
      ? this.shippingCost
      : this.shippingAddress?.shippingPrice ?? 50;

  // Always recalculate totalPrice
  this.totalPrice = this.subtotal + this.shippingCost;

  // Add initial status history entry if new order
  if (this.isNew && (!this.statusHistory || this.statusHistory.length === 0)) {
    const userIdStr = this.user?._id ? `user:${this.user._id}` : "system";
    this.statusHistory = [
      {
        status: this.status,
        updatedBy: userIdStr,
        timestamp: this.createdAt || new Date(),
        details: "Order created.",
      },
    ];
  }

  next();
});

module.exports = mongoose.model("Order", orderSchema);
