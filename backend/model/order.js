const mongoose = require("mongoose");

const designSpecSchema = new mongoose.Schema({
  size: { type: String, required: true },
  positionX: { type: Number, required: true },
  positionY: { type: Number, required: true },
  scale: { type: Number, required: true },
  productType: { type: String, required: true }
}, { _id: false });

const orderSchema = new mongoose.Schema({
    designSpecs: {
        size: String,
        positionX: Number,
        positionY: Number,
        scale: Number,
        productType: String
      },
  cart: [{
    _id: String,
    qty: Number,
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop'
    },
    price: Number,
    designImage: String,
    DesignTitle: String,
    ProductType: String,
    ProductColor: String,
    designSpecs: designSpecSchema
  }],
    shippingAddress: {
        type: Object,
        required: true,
    },
    user: {
        type: Object,
        required: true,
    },
    totalPrice: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        default: "Processing",
    },
    paymentInfo: {
        id: { type: String, default: null },
        status: { type: String, default: "Processing" },
        type: { type: String, default: "Cash On Delivery" }
    },
    paidAt: {
        type: Date,
        default: Date.now(),
    },
    deliveredAt: {
        type: Date,
    },
    createdAt: {
        type: Date,
        default: Date.now(),
    },

  estimatedDelivery: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 7*24*60*60*1000)
  },
  statusHistory: [{
    status: String,
    changedBy: { type: String, enum: ['system', 'admin'] },
    timestamp: Date
  }]
});


orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ "user._id": 1 });
orderSchema.index({ "cart.shopId": 1 });

module.exports = mongoose.model("Order", orderSchema);