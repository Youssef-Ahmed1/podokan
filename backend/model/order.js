const mongoose = require("mongoose");
const { Schema } = mongoose;
const { ORDER_STATUSES } = require("../constants/orderStatuses"); // Assuming you have this enum definition

const statusEnum = Object.values(
  ORDER_STATUSES || {
    // Default enum if file not found
    PROCESSING: "Processing",
    TRANSFERRED: "Transferred to delivery partner",
    SHIPPING: "Shipping",
    RECEIVED: "Received",
    ON_THE_WAY: "On the way",
    DELIVERED: "Delivered",
    REFUND_REQUESTED: "Processing refund", // Use 'Processing refund' as value based on frontend code
    REFUND_APPROVED: "Refund Approved",
    REFUND_REJECTED: "Refund Rejected",
    REFUND_SUCCESS: "Refund Success",
    CANCELLED: "Cancelled", // Added Cancelled
  }
);

const orderSchema = new mongoose.Schema(
  {
    cart: [
      {
        // _id: false, // Usually let mongoose handle item _id unless needed from client
        _id: {
          // Allow client-generated _id initially if needed for UI keys
          type: String,
          required: true,
          default: () => new mongoose.Types.ObjectId().toString(), // Default to Mongoose ObjectId string
        },
        productId: {
          // Optional link back to the base product
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: false, // Design might exist without a specific Product base
        },
        qty: {
          type: Number,
          required: [true, "Item quantity is required."],
          min: [1, "Item quantity must be at least 1."],
          default: 1,
        },
        shopId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Shop",
          required: [true, "Shop ID is required for each item."],
        },
        price: {
          // Unit price of the item at the time of order
          type: Number,
          required: [true, "Item price is required."],
          min: [0, "Item price cannot be negative."],
        },
        designImage: {
          // Allow flexibility, but URL preferred
          type: Schema.Types.Mixed, // Could be { url, public_id } or just url string
          required: [true, "Design image is required."],
          // Getter can normalize access, but storing structure preferred
          get: function (val) {
            if (!val) return null;
            if (typeof val === "string") return { url: val, public_id: null }; // Normalize string to object
            return { url: val.url, public_id: val.public_id }; // Assume object structure
          },
          set: function (val) {
            if (!val) return undefined;
            if (typeof val === "string") return { url: val, public_id: null };
            return { url: val.url, public_id: val.public_id }; // Ensure object structure on set
          },
        },
        DesignTitle: {
          type: String,
          required: [true, "Design title is required."],
          trim: true,
        },
        ProductType: {
          // e.g., "Hoodie", "T-Shirt"
          type: String,
          required: [true, "Product type is required."],
          trim: true,
        },
        ProductColor: {
          type: String,
          required: [true, "Product color is required."],
          default: "White",
          trim: true,
        },
        size: {
          type: String,
          required: [true, "Product size is required."],
          default: "One Size",
          trim: true,
        },
        designSpecs: {
          // Detailed placement, etc.
          positionX: { type: Number, default: 50, min: 0, max: 100 },
          positionY: { type: Number, default: 50, min: 0, max: 100 },
          scale: { type: Number, default: 1, min: 0.1, max: 5 },
          rotation: { type: Number, default: 0, min: -360, max: 360 },
        },
        printReadyFile: {
          // URL to file for printing machine
          url: String,
          public_id: String,
        },
        mockupImage: {
          // URL to generated mockup
          url: String,
          public_id: String,
        },
      },
    ],
    shippingAddress: {
      // Embed directly
      address1: { type: String, required: true },
      address2: { type: String },
      city: { type: String, required: true },
      country: { type: String, required: true },
      postalCode: { type: String },
      phoneNumber: { type: String }, // Store phone here if primarily for shipping
      // shippingPrice: Number // Can store the cost used here too
    },
    // Explicit shipping cost for the order
    shippingCost: {
      type: Number,
      required: [true, "Shipping cost must be provided."],
      default: 50, // **FIX: Set a default shipping cost**
      min: [0, "Shipping cost cannot be negative."],
    },
    user: {
      // Embed user info relevant to the order
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      name: { type: String, required: true },
      email: { type: String, required: true },
      // Avoid storing password or sensitive fields here
      phoneNumber: { type: String }, // Can also store primary phone here
    },
    subtotal: {
      // Calculated sum of (item.price * item.qty)
      type: Number,
      required: [true, "Subtotal calculation is required."], // Make required
      default: 0, // Add default value
      min: [0, "Subtotal cannot be negative."],
    },
    totalPrice: {
      // subtotal + shippingCost
      type: Number,
      required: [true, "Total price calculation is required."], // Make required
      validate: {
        validator: function (value) {
          // Allow for minor floating point inaccuracies
          const expectedTotal = (this.subtotal || 0) + (this.shippingCost || 0);
          return Math.abs(value - expectedTotal) < 0.01; // Check within 1 cent tolerance
        },
        // Improved validation message
        message: (props) =>
          `Total price (${props.value}) must match subtotal (${
            this.subtotal || 0
          }) + shipping (${this.shippingCost || 0}) = ${
            (this.subtotal || 0) + (this.shippingCost || 0)
          }`,
      },
      default: 0, // Add default value
      min: [0, "Total price cannot be negative."],
    },
    status: {
      type: String,
      default: statusEnum[0], // Default to the first status ('Processing')
      enum: {
        values: statusEnum,
        message: "Invalid order status: {VALUE}", // Custom error message for enum
      },
      required: true,
    },
    paymentInfo: {
      id: { type: String }, // Payment gateway transaction ID
      status: { type: String, default: "Processing" }, // e.g., 'Processing', 'Succeeded', 'Failed'
      type: { type: String, default: "Cash On Delivery" }, // e.g., 'Cash On Delivery', 'Stripe', 'PayPal'
    },
    paidAt: {
      // Timestamp when payment succeeded
      type: Date,
      default: null,
    },
    deliveredAt: {
      // Timestamp when order reached final 'Delivered' status
      type: Date,
      default: null,
    },
    createdAt: {
      // When the order was created
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      // Mongoose automatically handles this with { timestamps: true }
      type: Date,
    },
    // Optional: Detailed Delivery Info (if using integrated partners)
    deliveryInfo: {
      partnerId: String, // Internal ID or name of the delivery partner
      trackingNumber: String,
      status: String, // Status from delivery partner (e.g., "pickup_scheduled", "in_transit")
      currentLocation: String, // Last known location from tracking
      lastUpdate: Date, // Timestamp of last webhook update or tracking poll
      assignedAt: Date, // When the delivery partner was assigned
      estimatedDelivery: Date, // ETA if provided
      notes: [
        // History/notes from delivery provider or internal
        {
          message: String,
          timestamp: { type: Date, default: Date.now },
          source: String, // e.g., "webhook", "manual_update"
        },
      ],
      signature: {
        // Proof of delivery if applicable
        url: String,
        timestamp: Date,
      },
    },
    // History of main status changes
    statusHistory: [
      {
        _id: false, // No need for subdocument ID
        status: { type: String, required: true },
        updatedBy: { type: String, required: true }, // User ID, Seller ID, Admin ID, 'SYSTEM', 'webhook' etc.
        timestamp: { type: Date, default: Date.now },
        details: String, // Optional notes about the change
      },
    ],
    // Optional: Detailed Printing/Production Info
    printingDetails: {
      printStatus: {
        type: String,
        enum: ["pending", "in_queue", "printing", "completed", "failed"],
        default: "pending",
      },
      printerId: String,
      printStartTime: Date,
      printEndTime: Date,
      printNotes: String,
      qualityCheck: {
        _id: false,
        checked: { type: Boolean, default: false },
        checkedBy: String, // Admin/Staff ID
        checkedAt: Date,
        notes: String,
        status: { type: String, enum: ["pending", "passed", "failed"] },
      },
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    toJSON: { getters: true }, // Ensure virtuals and getters are included in toJSON
    toObject: { getters: true }, // Ensure virtuals and getters are included in toObject
  }
);

// === Indexes for Performance ===
orderSchema.index({ createdAt: -1 });
orderSchema.index({ "user._id": 1, createdAt: -1 }); // User's orders, sorted
orderSchema.index({ "cart.shopId": 1, createdAt: -1 }); // Seller's orders, sorted
orderSchema.index({ status: 1, createdAt: -1 }); // Orders by status
orderSchema.index(
  { "deliveryInfo.trackingNumber": 1 },
  { unique: false, sparse: true }
); // Tracking number lookup
orderSchema.index({ "paymentInfo.id": 1 }, { unique: false, sparse: true }); // Payment ID lookup

// === Mongoose Middleware (Hooks) ===

// Pre-save hook to calculate subtotal and totalPrice
orderSchema.pre("save", function (next) {
  // Only calculate if cart or shippingCost has been modified, or if it's a new document
  if (
    this.isModified("cart") ||
    this.isModified("shippingCost") ||
    this.isNew
  ) {
    try {
      this.subtotal = this.cart.reduce(
        (total, item) => {
          if (typeof item.price !== "number" || typeof item.qty !== "number") {
            throw new Error(
              `Invalid price (${item.price}) or quantity (${item.qty}) for item "${item.DesignTitle}".`
            );
          }
          return total + item.price * item.qty;
        },
        0 // Start total at 0
      );

      // Ensure shippingCost has a valid number before calculating total
      const validShippingCost =
        typeof this.shippingCost === "number" && !isNaN(this.shippingCost)
          ? this.shippingCost
          : 0; // Default to 0 if invalid, rely on required validation later

      this.totalPrice = this.subtotal + validShippingCost;
    } catch (error) {
      // Pass calculation error to mongoose save error handling
      return next(new Error(`Calculation error: ${error.message}`));
    }
  }
  // Update the 'updatedAt' timestamp manually if needed (Mongoose does it with { timestamps: true })
  // this.updatedAt = new Date();
  next(); // Continue with the save operation
});

// === Virtuals (Computed properties not stored in DB) ===
orderSchema.virtual("orderNumber").get(function () {
  return this._id.toString().slice(0, 8).toUpperCase();
});

// === Instance Methods ===

// Update main order status and history
orderSchema.methods.updateStatus = async function (
  newStatus,
  updatedById,
  details = ""
) {
  if (!statusEnum.includes(newStatus)) {
    throw new Error(`Invalid status provided: ${newStatus}`);
  }
  const previousStatus = this.status;
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    updatedBy: updatedById.toString(), // Ensure it's a string
    timestamp: new Date(),
    details: details || `Status changed from ${previousStatus} to ${newStatus}`,
  });

  if (newStatus === (ORDER_STATUSES.DELIVERED || "Delivered")) {
    this.deliveredAt = new Date();
    // Handle COD payment on delivery confirmation if needed
    if (
      this.paymentInfo?.type === "Cash On Delivery" &&
      this.paymentInfo?.status !== "Succeeded"
    ) {
      this.paymentInfo.status = "Succeeded";
    }
  }
  return this.save(); // Return the promise from save()
};

// Update delivery status within deliveryInfo and optionally main status
orderSchema.methods.updateDeliveryStatus = function (
  deliveryUpdate = {},
  source = "webhook"
) {
  // Requires deliveryUpdate: { status, location?, notes?, timestamp? }
  if (!this.deliveryInfo) {
    console.warn(
      `Attempted to update delivery status for order ${this._id} but deliveryInfo is missing.`
    );
    return; // Or initialize it: this.deliveryInfo = { status: deliveryUpdate.status, ... };
  }

  const updateTimestamp = deliveryUpdate.timestamp
    ? new Date(deliveryUpdate.timestamp)
    : new Date();

  // Check for stale updates
  if (
    this.deliveryInfo.lastUpdate &&
    updateTimestamp <= new Date(this.deliveryInfo.lastUpdate)
  ) {
    console.log(`Ignoring stale delivery update for ${this._id}`);
    return;
  }

  this.deliveryInfo.status = deliveryUpdate.status;
  if (deliveryUpdate.location) {
    this.deliveryInfo.currentLocation = deliveryUpdate.location;
  }
  this.deliveryInfo.lastUpdate = updateTimestamp;

  if (deliveryUpdate.notes) {
    this.deliveryInfo.notes = this.deliveryInfo.notes || [];
    this.deliveryInfo.notes.push({
      message: deliveryUpdate.notes,
      timestamp: updateTimestamp,
      source: source,
    });
  }

  // --- Logic to potentially update the main order status ---
  let newMainStatus = this.status;
  if (deliveryUpdate.status?.toLowerCase() === "delivered") {
    newMainStatus = ORDER_STATUSES.DELIVERED || "Delivered";
    if (!this.deliveredAt) this.deliveredAt = updateTimestamp;
    // Handle COD payment on delivery confirmation
    if (
      this.paymentInfo?.type === "Cash On Delivery" &&
      this.paymentInfo?.status !== "Succeeded"
    ) {
      this.paymentInfo.status = "Succeeded";
    }
  } else if (
    deliveryUpdate.status?.toLowerCase().includes("in_transit") ||
    deliveryUpdate.status?.toLowerCase().includes("shipping")
  ) {
    newMainStatus = ORDER_STATUSES.SHIPPING || "Shipping";
  } else if (
    deliveryUpdate.status?.toLowerCase().includes("out_for_delivery")
  ) {
    newMainStatus = ORDER_STATUSES.ON_THE_WAY || "On the way";
  } // etc.

  if (newMainStatus !== this.status) {
    this.statusHistory = this.statusHistory || [];
    this.statusHistory.push({
      status: newMainStatus,
      updatedBy: source,
      timestamp: updateTimestamp,
      details: `Delivery update trigger: ${deliveryUpdate.status}`,
    });
    this.status = newMainStatus;
  }
  // --- End Main Status Update ---

  // No save() here, expect caller to save
};

// Method to get formatted summary (useful for emails/display)
orderSchema.methods.getFormattedDetails = function () {
  // Recalculate totals for safety
  const subtotal = this.cart.reduce((total, item) => {
    return total + (item.price || 0) * (item.qty || 1);
  }, 0);
  const shipping = this.shippingCost ?? 50;
  const total = subtotal + shipping;

  return {
    orderId: this._id.toString(),
    orderNumber: this.orderNumber, // Use virtual
    orderDate: this.createdAt,
    status: this.status,
    subtotal: subtotal,
    shippingCost: shipping,
    total: total,
    paymentMethod: this.paymentInfo?.type || "N/A",
    paymentStatus: this.paymentInfo?.status || "N/A",
    customer: {
      name: this.user?.name || "N/A",
      email: this.user?.email || "N/A",
    },
    shippingAddress: {
      fullAddress: `${this.shippingAddress?.address1}${
        this.shippingAddress?.address2
          ? ", " + this.shippingAddress.address2
          : ""
      }`,
      cityCountry: `${this.shippingAddress?.city}, ${this.shippingAddress?.country}`,
    },
    items: this.cart.map((item) => ({
      id: item._id?.toString(),
      title: item.DesignTitle || "Untitled Design",
      type: item.ProductType || "N/A",
      color: item.ProductColor || "N/A",
      size: item.size || "N/A",
      quantity: item.qty || 1,
      price: item.price || 0,
      itemTotal: (item.price || 0) * (item.qty || 1),
      designImage: item.designImage?.url || null, // Access normalized URL
    })),
  };
};

// Method to check if all items have a print-ready file (Example)
orderSchema.methods.isPrintReady = function () {
  if (!this.cart || this.cart.length === 0) return false;
  return this.cart.every(
    (item) => item.printReadyFile && item.printReadyFile.url
  );
};

module.exports = mongoose.model("Order", orderSchema);
