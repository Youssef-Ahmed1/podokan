// backend/model/order.js
const mongoose = require("mongoose");
const { Schema } = mongoose;
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
      required: [true, "Qty is required."],
      min: [1, "Min qty is 1."],
      default: 1,
    },
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: [true, "Shop ID is required."],
      index: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required."],
      min: [0, "Price cannot be negative."],
    },
    designImage: {
      public_id: { type: String, trim: true },
      url: {
        type: String,
        required: [true, "Design URL is required."],
        trim: true,
      },
    },
    DesignTitle: {
      type: String,
      required: [true, "Design title is required."],
      trim: true,
    },
    ProductType: {
      type: String,
      required: [true, "Product type is required."],
      trim: true,
    },
    ProductColor: {
      type: String,
      required: [true, "Color is required."],
      default: "White",
      trim: true,
    },
    size: {
      type: String,
      required: [true, "Size is required."],
      default: "One Size",
      trim: true,
    },
    designSpecs: {
      positionX: { type: Number, default: 50, min: 0, max: 100 },
      positionY: { type: Number, default: 50, min: 0, max: 100 },
      scale: { type: Number, default: 1, min: 0.1, max: 5 },
      rotation: { type: Number, default: 0, min: -360, max: 360 },
    },
    printReadyFile: { public_id: String, url: String },
    mockupImage: { public_id: String, url: String },
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
        "Cart must have items.",
      ],
    },
    shippingAddress: {
      address1: {
        type: String,
        required: [true, "Address required."],
        trim: true,
      },
      address2: { type: String, trim: true, default: "" },
      city: { type: String, required: [true, "City required."], trim: true },
      country: {
        type: String,
        required: [true, "Country required."],
        trim: true,
      },
      postalCode: { type: String, trim: true, default: "" },
      phoneNumber: {
        type: String,
        required: [true, "Phone required."],
        trim: true,
      },
      shippingPrice: { type: Number, default: 50, min: 0 },
    },
    shippingCost: {
      type: Number,
      required: [true, "Shipping cost required."],
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
      name: { type: String, required: [true, "User name required."] },
      email: { type: String, required: [true, "User email required."] },
    },
    subtotal: {
      type: Number,
      required: [true, "Subtotal required."],
      default: 0,
      min: 0,
    },
    totalPrice: {
      type: Number,
      required: [true, "Total price required."],
      default: 0,
      min: 0,
      validate: {
        validator: function (v) {
          const calc = this.subtotal + (this.shippingCost || 0);
          return Math.abs(v - calc) < 0.01;
        },
        message: (props) =>
          `TotalPrice (${props.value}) validation failed. Expected ~${
            this.subtotal + (this.shippingCost || 0)
          }`,
      },
    },
    status: {
      type: String,
      required: true,
      default: ORDER_STATUSES.PROCESSING,
      enum: {
        values: Object.values(ORDER_STATUSES),
        message: '"{VALUE}" is not a valid status.',
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
  if (
    this.isModified("cart") ||
    this.isModified("shippingCost") ||
    this.isNew
  ) {
    this.subtotal = this.cart.reduce(
      (sum, item) => sum + (item.price || 0) * (item.qty || 1),
      0
    );
    this.shippingCost =
      this.shippingCost ?? this.shippingAddress?.shippingPrice ?? 50;
    this.totalPrice = this.subtotal + this.shippingCost;
  }
  if (this.isNew && (!this.statusHistory || this.statusHistory.length === 0)) {
    this.statusHistory = [
      {
        status: this.status,
        updatedBy: `user:${this.user._id}`,
        timestamp: this.createdAt || new Date(),
        details: "Order created.",
      },
    ];
  }
  next();
});

orderSchema.methods.updateStatus = function (
  newStatus,
  updatedBy,
  details = ""
) {
  if (!Object.values(ORDER_STATUSES).includes(newStatus))
    throw new Error(`Invalid status: ${newStatus}`);
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    updatedBy,
    timestamp: new Date(),
    details,
  });
  if (newStatus === ORDER_STATUSES.DELIVERED && !this.deliveredAt) {
    this.deliveredAt = new Date();
    if (
      this.paymentInfo?.type === "Cash On Delivery" &&
      this.paymentInfo.status !== "Succeeded"
    ) {
      this.paymentInfo.status = "Succeeded";
      if (!this.paidAt) this.paidAt = new Date();
      this.markModified("paymentInfo");
    }
  }
};

module.exports = mongoose.model("Order", orderSchema);
