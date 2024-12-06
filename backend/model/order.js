const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    cart: [{
        _id: String,
        qty: Number,
        shopId: String,
        productId: String,
        price: Number,
        // add other cart item fields you need
    }],
    shippingAddress: {
        type: Object,
        required: true,
    },
    user: {
        _id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name: String,
        email: String
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
        id: String,
        status: String,
        type: String,
    },
    paidAt: {
        type: Date,
        default: Date.now,
    },
    deliveredAt: {
        type: Date,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ "user._id": 1 });

module.exports = mongoose.model("Order", orderSchema);