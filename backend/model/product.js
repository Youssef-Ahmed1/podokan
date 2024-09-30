const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true
  },
  DesignTitle: {
    type: String,
    required: [true, "Please enter your product name!"],
  },
  Description: {
    type: String,
    required: [true, "Please enter your product Description!"],
  },
  Maintag: {
    type: String,
    required: [true, "Please enter a main tag!"],
  },
  Designtags: String,

  ProductType: {
    type: String,
    required: [true, "Please enter your product type!"],
  },
  ProductColor: {
    type: String,
    required: [true, "Please select a product color!"],
  },
  ProductView: {
    type: String,
    enum: ['front', 'back'],
    default: 'front',
  },
  DesignScale: {
    type: Number,
    default: 1,
  },
  originalPrice: {
    type: Number,
  },
  discountPrice: {
    type: Number,
  },
  designImage: {
    public_id: String,
    url: String,
  },
  status: {
    type: String,
    enum: ['pending', 'public', 'rejected'],
    default: 'pending'
  },
  visibility: {
    type: String,
    enum: ['restricted', 'public' ],
    default: 'restricted'
  },
  rejectionReason: {
    type: String,
    default: ''
  },


  
  reviews: [
    {
      user: {
        type: Object,
      },
      rating: {
        type: Number,
      },
      comment: {
        type: String,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      }
    },
  ],
  ratings: {
    type: Number,
    default: 0,
  },

  sold_out: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  
});

module.exports = mongoose.model("Product", productSchema);
