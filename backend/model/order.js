const mongoose = require("mongoose");

const designSpecSchema = new mongoose.Schema({
  size: {
    type: String,
    required: [true, 'Size is required'],
    enum: ['S', 'M', 'L', 'XL', 'XXL']
  },
  positionX: {
    type: Number,
    required: true,
    min: [0, 'Position X cannot be negative'],
    max: [100, 'Position X cannot exceed 100%']
  },
  positionY: {
    type: Number,
    required: true,
    min: [0, 'Position Y cannot be negative'],
    max: [100, 'Position Y cannot exceed 100%']
  },
  scale: {
    type: Number,
    required: true,
    min: [0.1, 'Scale must be at least 0.1'],
    max: [5, 'Scale cannot exceed 5']
  },
  rotation: {
    type: Number,
    default: 0,
    min: [0, 'Rotation must be at least 0 degrees'],
    max: [360, 'Rotation cannot exceed 360 degrees']
  }
}, { _id: false, versionKey: false });

const productSnapshotSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Product title is required']
  },
  description: String,
  color: {
    type: String,
    required: [true, 'Product color is required']
  },
  size: {
    type: String,
    required: [true, 'Product size is required']
  },
  designTags: [String],
  originalProductId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Product'
  }
}, { _id: false, versionKey: false });

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product reference is required']
  },
  qty: {
    type: Number,
    required: true,
    min: [1, 'Quantity cannot be less than 1']
  },
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: [true, 'Shop reference is required']
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative']
  },
  designImage: {
    public_id: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    }
  },
  designSpecs: {
    type: designSpecSchema,
    required: [true, 'Design specifications are required']
  },
  ProductType: {
    type: String,
    required: [true, 'Product type is required']
  },
  ProductColor: {
    type: String,
    required: [true, 'Product color is required']
  }
}, { _id: false, versionKey: false });

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    required: true
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'statusHistory.userType'
  },
  userType: {
    type: String,
    required: true,
    enum: ['User', 'Shop', 'Admin']
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false, versionKey: false });

const orderSchema = new mongoose.Schema({
  productSnapshots: [productSnapshotSchema],
  cart: [cartItemSchema],
  shippingAddress: {
    type: {
      address1: String,
      address2: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
      phoneNumber: String
    },
    required: [true, 'Shipping address is required']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required']
  },
  totalPrice: {
    type: Number,
    required: [true, 'Total price is required'],
    min: [0, 'Total price cannot be negative']
  },
  status: {
    type: String,
    enum: Object.values(ORDER_STATUSES),
    default: ORDER_STATUSES.PROCESSING
  },
  paymentInfo: {
    id: String,
    status: {
      type: String,
      default: 'Processing'
    },
    type: {
      type: String,
      required: [true, 'Payment type is required']
    },
    amount: Number,
    currency: String
  },
  estimatedDelivery: Date,
  deliveredAt: Date,
  statusHistory: [statusHistorySchema]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'user': 1 });
orderSchema.index({ 'cart.shop': 1 });
orderSchema.index({ estimatedDelivery: 1 });

// Virtuals
orderSchema.virtual('isDelivered').get(function() {
  return this.status === ORDER_STATUSES.DELIVERED;
});

orderSchema.virtual('deliveryStatus').get(function() {
  return {
    isDelivered: this.status === ORDER_STATUSES.DELIVERED,
    estimatedDelivery: this.estimatedDelivery,
    deliveredAt: this.deliveredAt
  };
});

module.exports = mongoose.model("Order", orderSchema);