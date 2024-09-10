const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  DesignTitle: {
    type: String,
    required: [true, "Please enter your product name!"],
  },
  Description: {
    type: String,
    required: [true, "Please enter your product Description!"],
  },
  ProductType: {
    type: String,
    required: [true, "Please enter your product type!"],
  },
  Maintag: {
    type: String,
    required: [true, "Please enter a main tag!"],
  },
  Designtags: {
    type: String,
  },
  ProductColor: {
    type: String,
    required: [true, "Please select a product color!"],
  },
  MatureContent: {
    type: Boolean,
    default: false,
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
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  visibility: {
    type: String,
    enum: ['restricted', 'public', 'site_pick'],
    default: 'restricted'
  },
  rejectionReason: {
    type: String,
    default: ''
  },
  designImage: {
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  tshirtImage: {
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
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
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true,
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
