const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  DesignTitle: {
    type: String,
    required: [true, "Please enter design title"],
    trim: true,
  },
  Description: {
    type: String,
    required: [true, "Please enter design description"],
  },
  Maintag: {
    type: String,
    required: [true, "Please enter main tag"],
  },
  Designtags: [{
    type: String,
  }],
  ProductType: {
    type: String,
    required: [true, "Please select product type"],
    enum: ["hoodie", "t-shirt", "sweatshirt"], // Add other types as needed
  },
  ProductColor: {
    type: String,
    required: [true, "Please select base color"],
  },
  availableColors: [{
    type: String,
    default: ["white", "black"]
  }],
  ProductView: {
    type: String,
    enum: ["front", "back"],
    default: "front"
  },
  DesignScale: {
    type: Number,
    default: 1
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
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Shop",
    required: true,
  },
  shopId: {
    type: Object,
    required: true,
  },
  originalPrice: {
    type: Number,
    required: [true, "Please enter product price"],
  },
  discountPrice: {
    type: Number,
  },
  discountPercentage: {
    type: Number,
    default: 0,
  },
  stock: {
    type: Number,
    required: [true, "Please enter product stock"],
    default: 100,
    validate: {
      validator: Number.isInteger,
      message: "Stock must be an integer"
    },
    min: [0, "Stock cannot be negative"]
  },
  availableSizes: {
    type: [String],
    default: ["S", "M", "L", "XL", "2XL"],
    validate: {
      validator: function(sizes) {
        return sizes.every(size => 
          ["S", "M", "L", "XL", "2XL"].includes(size)
        );
      },
      message: "Invalid size provided"
    }
  },
  sold_out: {
    type: Number,
    default: 0,
    min: [0, "Sold out count cannot be negative"]
  },
  viewCount: {
    type: Number,
    default: 0,
    min: [0, "View count cannot be negative"]
  },
  ratings: {
    type: Number,
    default: 0,
  },
  reviews: [{
    user: {
      type: Object,
    },
    rating: {
      type: Number,
    },
    comment: {
      type: String,
    },
    productId: {
      type: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    }
  }],
  status: {
    type: String,
    enum: ["draft", "pending", "public", "rejected", "restricted"],
    default: "pending"
  },
  visibility: {
    type: String,
    enum: ["public", "private", "restricted"],
    default: "public"
  },
  rejectionReason: {
    type: String,
    default: ""
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Shop",
    required: true,
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  lastModified: {
    type: Date,
    default: Date.now
  },
  isInStock: {
    type: Boolean,
    default: true,
    get: function() {
      return this.stock > 0;
    }
  }
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

// Pre-save middleware to update isInStock
productSchema.pre('save', function(next) {
  this.isInStock = this.stock > 0;
  
  // Update discountPercentage if originalPrice and discountPrice exist
  if (this.originalPrice && this.discountPrice) {
    this.discountPercentage = Math.round(
      ((this.originalPrice - this.discountPrice) / this.originalPrice) * 100
    );
  }
  
  next();
});

// Method to update stock
productSchema.methods.updateStock = async function(quantity, action = 'decrease') {
  if (action === 'decrease') {
    if (this.stock < quantity) {
      throw new Error('Insufficient stock');
    }
    this.stock -= quantity;
    this.sold_out += quantity;
  } else {
    this.stock += quantity;
    this.sold_out = Math.max(0, this.sold_out - quantity);
  }
  
  this.isInStock = this.stock > 0;
  return this.save();
};

// Method to increment view count
productSchema.methods.incrementViewCount = async function() {
  this.viewCount += 1;
  return this.save();
};

// Index for better query performance
productSchema.index({ shop: 1, status: 1 });
productSchema.index({ ProductType: 1, status: 1 });
productSchema.index({ Maintag: 1 });
productSchema.index({ viewCount: -1 });

const Product = mongoose.model("Product", productSchema);
module.exports = Product;