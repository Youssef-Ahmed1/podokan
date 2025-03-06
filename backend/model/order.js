// backend/model/order.js

const mongoose = require("mongoose");
const { Schema } = mongoose;  

const orderSchema = new mongoose.Schema({
  cart: [
    {
      _id: String,
      qty: {
        type: Number,
        required: true,
        default: 1,
      },
      shopId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Shop",
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      designImage: {
        type: Schema.Types.Mixed,
        required: true,
        get: function (val) {
          if (typeof val === "string") return val;
          return val?.url || null;
        },
      },
      DesignTitle: {
        type: String,
        required: true,
      },
      ProductType: {
        type: String,
        required: true,
      },
      ProductColor: {
        type: String,
        default: null, // Changed from 'Default' to null
      },
      size: {
        type: String,
        default: null, // Changed from 'One Size' to null
      },
      designSpecs: {
        positionX: {
          type: Number,
          default: 50,
        },
        positionY: {
          type: Number,
          default: 50,
        },
        scale: {
          type: Number,
          default: 1,
        },
        rotation: {
          type: Number,
          default: 0,
        },
      },
      printReadyFile: {
        url: String,
        public_id: String,
      },
      mockupImage: {
        url: String,
        public_id: String,
      },
    },
  ],
  shippingAddress: {
    type: Object,
    required: true,
  },
  // Add explicit shipping price field to store this separately
  shippingCost: {
    type: Number,
    default: 100, // Default shipping cost is 50
  },
  user: {
    type: Object,
    required: true,
  },
  // Subtotal (just the items, no shipping)
  subtotal: {
    type: Number,
    required: false,
  },
  // Total price (includes shipping)
  totalPrice: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    default: "Processing",
    enum: [
      "Processing",
      "Transferred to delivery partner",
      "Shipping",
      "Received",
      "On the way",
      "Delivered",
      "Processing refund",
      "Refund Success",
      "Cancelled",
    ],
  },
  paymentInfo: {
    id: {
      type: String,
    },
    status: {
      type: String,
      default: "Processing",
    },
    type: {
      type: String,
      default: "Cash On Delivery",
    },
  },
  paidAt: {
    type: Date,
    default: null,
  },
  deliveredAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  deliveryInfo: {
    partnerId: String,
    trackingNumber: String,
    status: {
      type: String,
      enum: [
        "pending",
        "picked_up",
        "in_transit",
        "out_for_delivery",
        "delivered",
        "failed",
      ],
      default: "pending",
    },
    currentLocation: String,
    lastUpdate: Date,
    assignedAt: Date,
    estimatedDelivery: Date,
    notes: [
      {
        message: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    signature: {
      url: String,
      timestamp: Date,
    },
  },
  statusHistory: [
    {
      status: {
        type: String,
        required: true,
      },
      updatedBy: {
        type: String,
        required: true,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
      details: String,
    },
  ],
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
      checked: {
        type: Boolean,
        default: false,
      },
      checkedBy: String,
      checkedAt: Date,
      notes: String,
      status: {
        type: String,
        enum: ["pending", "passed", "failed"],
      },
    },
  },
});
// Indexes for better query performance
orderSchema.index({ createdAt: -1 });
orderSchema.index({ "user._id": 1 });
orderSchema.index({ "cart.shopId": 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ "deliveryInfo.trackingNumber": 1 });

// Methods
orderSchema.methods.updateStatus = function (
  newStatus,
  updatedBy,
  details = ""
) {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    updatedBy,
    timestamp: new Date(),
    details,
  });

  if (newStatus === "Delivered") {
    this.deliveredAt = new Date();
  }
};
orderSchema.methods.getFormattedDetails = function () {
  // Calculate subtotal from items
  const subtotal = this.cart.reduce((total, item) => {
    return total + item.price * (item.qty || 1);
  }, 0);

  // Use stored shipping cost or default to 50
  const shippingCost = this.shippingCost || 50;

  return {
    subtotal: subtotal,
    shippingCost: shippingCost,
    total: subtotal + shippingCost,
    items: this.cart.map((item) => ({
      id: item._id,
      title: item.DesignTitle || "Untitled Design",
      type: item.ProductType || "N/A",
      color: item.ProductColor || "N/A",
      size: item.size || "N/A",
      quantity: item.qty || 1,
      price: item.price || 0,
      total: (item.price || 0) * (item.qty || 1),
      designImage: item.designImage?.url || item.designImage || null,
      mockupImage: item.mockupImage?.url || item.mockupImage || null,
    })),
  };
};
orderSchema.methods.updateDeliveryStatus = function(status, location, notes) {
  this.deliveryInfo = {
    ...this.deliveryInfo,
    status,
    currentLocation: location,
    lastUpdate: new Date()
  };

  if (notes) {
    this.deliveryInfo.notes.push({
      message: notes,
      timestamp: new Date()
    });
  }
};
orderSchema.methods.getOrderDetails = function () {
  const subtotal = this.cart.reduce((total, item) => {
    return total + item.price * (item.qty || 1);
  }, 0);

  const shippingCost = this.shippingAddress?.shippingPrice || 0;

  return {
    subtotal,
    shippingCost,
    total: subtotal + shippingCost,
    discounts: 0, // Add discount handling if needed
    items: this.cart.length,
    totalQuantity: this.cart.reduce(
      (total, item) => total + (item.qty || 1),
      0
    ),
  };
};
orderSchema.methods.calculateTotalAmount = function() {
  return this.cart.reduce((total, item) => {
    return total + (item.price * item.qty);
  }, 0);
};

orderSchema.methods.isPrintReady = function() {
  return this.cart.every(item => item.printReadyFile && item.printReadyFile.url);
};

// Pre-save hook
orderSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    // Additional logic for status changes
    if (this.status === "Delivered" && !this.deliveredAt) {
      this.deliveredAt = new Date();
    }
  }
  next();
});

module.exports = mongoose.model("Order", orderSchema);