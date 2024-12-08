const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
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
        // Add other cart item fields you need
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
        id: String,
        status: String,
        type: String,
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
});

orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ "user._id": 1 });
orderSchema.index({ "cart.shopId": 1 });

module.exports = mongoose.model("Order", orderSchema);