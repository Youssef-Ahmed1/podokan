const mongoose = require("mongoose");
const { Schema } = mongoose;
const { ORDER_STATUSES } = require("../constants/orderStatuses");

// --- Subdocument Schema for Order Items ---
const orderItemSchema = new mongoose.Schema(
  {
    // Optional link to a specific Product document
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null, // Allow items not directly linked to a Product
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
      index: true, // Index for efficient seller order lookup
    },
    price: {
      type: Number,
      required: [true, "Item price is required."],
      min: [0, "Price cannot be negative."],
    },
    // Design details are crucial
    designImage: {
      public_id: { type: String, trim: true }, // Optional Cloudinary ID
      url: {
        type: String,
        required: [true, "Item design image URL is required."], // Make URL mandatory
        trim: true,
      },
    },
    DesignTitle: {
      type: String,
      required: [true, "Item design title is required."], // Make title mandatory
      trim: true,
    },
    ProductType: {
      type: String,
      required: [true, "Item product type is required."], // Make type mandatory
      trim: true,
    },
    ProductColor: {
      type: String,
      required: [true, "Item product color is required."], // Make color mandatory
      default: "White", // Sensible default
      trim: true,
    },
    size: {
      type: String,
      required: [true, "Item size is required."], // Make size mandatory
      default: "One Size", // Sensible default
      trim: true,
    },
    // Design placement/scaling details
    designSpecs: {
      positionX: { type: Number, default: 50, min: 0, max: 100 },
      positionY: { type: Number, default: 50, min: 0, max: 100 },
      scale: { type: Number, default: 1, min: 0.1, max: 5 }, // Allow scaling down/up
      rotation: { type: Number, default: 0, min: -360, max: 360 }, // Allow full rotation
    },
  },
  { _id: true } // Ensure items get their own _id for easier updates/refs
);

// --- Main Order Schema ---
const orderSchema = new mongoose.Schema(
  {
    cart: {
      type: [orderItemSchema], // Array of order items
      required: true,
      validate: [
        // Ensure cart is not empty
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
      country: {
        type: String,
        required: [true, "Shipping country is required."],
        trim: true,
      }, // REQUIRED
      postalCode: { type: String, trim: true, default: "" },
      phoneNumber: {
        type: String,
        required: [true, "Shipping phone number is required."],
        trim: true,
      }, // REQUIRED
      shippingPrice: { type: Number, default: 50, min: 0 }, // Price associated with this address (can be overridden by shippingCost)
    },
    shippingCost: {
      type: Number,
      required: [true, "Order shipping cost is required."],
      default: 50, // Default cost for this sub-order
      min: 0,
    },
    user: {
      // Denormalized user info for quick access
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      }, // Index for user order lookup
      name: { type: String, required: [true, "User name is required."] },
      email: { type: String, required: [true, "User email is required."] },
    },
    subtotal: {
      // Calculated sum of (item.price * item.qty)
      type: Number,
      required: [true, "Order subtotal is required."],
      default: 0,
      min: 0,
    },
    totalPrice: {
      // Calculated subtotal + shippingCost
      type: Number,
      required: [true, "Order total price is required."],
      default: 0,
      min: 0,
      validate: {
        // Basic validation: totalPrice should be roughly subtotal + shipping
        validator: function (v) {
          // Allow for small floating point discrepancies
          const calculatedTotal =
            (this.subtotal || 0) + (this.shippingCost || 0);
          return Math.abs(v - calculatedTotal) < 0.01;
        },
        message: (props) =>
          `TotalPrice (${props.value}) validation failed. Expected ~${
            (this.subtotal || 0) + (this.shippingCost || 0)
          } based on subtotal and shippingCost.`,
      },
    },
    status: {
      type: String,
      required: true,
      default: ORDER_STATUSES.PROCESSING,
      enum: {
        values: Object.values(ORDER_STATUSES), // Use predefined statuses
        message: '"{VALUE}" is not a valid order status.',
      },
      index: true, // Index for filtering by status
    },
    paymentInfo: {
      // Details about the payment
      id: { type: String, trim: true }, // e.g., Stripe charge ID
      status: { type: String, default: "Processing", trim: true }, // e.g., Processing, Succeeded, Failed
      type: { type: String, default: "Cash On Delivery", trim: true }, // e.g., Stripe, COD
    },
    paidAt: { type: Date, default: null }, // Timestamp when payment succeeded
    deliveredAt: { type: Date, default: null }, // Timestamp when order was delivered
    statusHistory: [
      // Log of status changes
      {
        status: { type: String, required: true },
        updatedBy: { type: String, required: true }, // e.g., "user:<id>", "admin:<id>", "seller:<id>", "system"
        timestamp: { type: Date, default: Date.now },
        details: { type: String, trim: true, default: "" }, // Optional notes about the change
        _id: false, // Don't create separate IDs for history entries
      },
    ],
  },
  { timestamps: true } // Adds createdAt and updatedAt automatically
);

// --- Indexes ---
// Compound index for efficient user order lookup, sorted by date
orderSchema.index({ "user._id": 1, createdAt: -1 });
// Compound index for efficient seller order lookup, sorted by date
orderSchema.index({ "cart.shopId": 1, createdAt: -1 });
// Index for filtering by status, sorted by date
orderSchema.index({ status: 1, createdAt: -1 });
// General index on creation date for sorting all orders
orderSchema.index({ createdAt: -1 });

// --- Pre-Save Hook ---
orderSchema.pre("save", function (next) {
  // Recalculate totals if cart or shippingCost changes, or if it's a new document
  if (
    this.isModified("cart") ||
    this.isModified("shippingCost") ||
    this.isNew
  ) {
    this.subtotal = this.cart.reduce(
      (sum, item) => sum + (item.price || 0) * (item.qty || 1),
      0
    );
    // Ensure shippingCost has a valid non-negative value
    this.shippingCost =
      typeof this.shippingCost === "number" && this.shippingCost >= 0
        ? this.shippingCost
        : this.shippingAddress?.shippingPrice ?? 50; // Fallback if needed

    this.totalPrice = this.subtotal + this.shippingCost;
  }

  // Initialize status history if it's a new order and history is empty
  if (this.isNew && (!this.statusHistory || this.statusHistory.length === 0)) {
    // Ensure user._id exists before creating history entry
    const userIdStr = this.user?._id ? `user:${this.user._id}` : "system";
    this.statusHistory = [
      {
        status: this.status,
        updatedBy: userIdStr, // Log who created it (user or system if user missing)
        timestamp: this.createdAt || new Date(), // Use createdAt if available
        details: "Order created.",
      },
    ];
  }

  next(); // Continue with the save operation
});

module.exports = mongoose.model("Order", orderSchema);