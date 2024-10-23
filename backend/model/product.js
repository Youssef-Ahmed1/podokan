const mongoose = require("mongoose");

// Constants for validation
const VALID_COLORS = ['white', 'black', 'red', 'blue', 'gray'];
const VALID_PRODUCT_TYPES = ['t-shirt', 'hoodie', 'long-sleeve'];
const VALID_VIEWS = ['front', 'back'];
const VALID_STATUSES = ['pending', 'public', 'rejected'];
const VALID_VISIBILITY = ['restricted', 'public'];

const productSchema = new mongoose.Schema({
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: [true, "Shop ID is required"],
    index: true
  },
  DesignTitle: {
    type: String,
    required: [true, "Please enter your product name!"],
    trim: true,
    minLength: [3, "Design title must be at least 3 characters"],
    maxLength: [100, "Design title cannot exceed 100 characters"]
  },
  Description: {
    type: String,
    required: [true, "Please enter your product Description!"],
    trim: true,
    minLength: [10, "Description must be at least 10 characters"],
    maxLength: [1000, "Description cannot exceed 1000 characters"]
  },
  Maintag: {
    type: String,
    required: [true, "Please enter a main tag!"],
    trim: true,
    index: true
  },
  Designtags: {
    type: [String],
    validate: {
      validator: function(tags) {
        return tags.every(tag => tag.length > 0 && tag.length <= 50);
      },
      message: "Each design tag must be between 1 and 50 characters"
    },
    default: []
  },
  ProductType: {
    type: String,
    required: [true, "Please enter your product type!"],
    enum: {
      values: VALID_PRODUCT_TYPES,
      message: `Product type must be one of: ${VALID_PRODUCT_TYPES.join(', ')}`
    }
  },
  ProductColor: {
    type: String,
    required: [true, "Please select a product color!"],
    enum: {
      values: VALID_COLORS,
      message: `Product color must be one of: ${VALID_COLORS.join(', ')}`
    }
  },
  availableColors: {
    type: [{
      type: String,
      enum: {
        values: VALID_COLORS,
        message: `Available colors must be one of: ${VALID_COLORS.join(', ')}`
      }
    }],
    validate: {
      validator: function(colors) {
        return colors.length > 0;
      },
      message: "At least one color must be selected"
    },
    default: function() {
      return [this.ProductColor];
    }
  },
  ProductView: {
    type: String,
    enum: {
      values: VALID_VIEWS,
      message: `Product view must be one of: ${VALID_VIEWS.join(', ')}`
    },
    default: 'front'
  },
  DesignScale: {
    type: Number,
    default: 1,
    min: [0.1, "Design scale cannot be less than 0.1"],
    max: [5.0, "Design scale cannot exceed 5.0"]
  },
  originalPrice: {
    type: Number,
    validate: {
      validator: function(price) {
        return this.status === 'public' ? price > 0 : true;
      },
      message: "Original price is required for public products and must be greater than 0"
    }
  },
  discountPrice: {
    type: Number,
    validate: {
      validator: function(price) {
        return !price || price <= this.originalPrice;
      },
      message: "Discount price must be less than or equal to original price"
    }
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
  status: {
    type: String,
    enum: {
      values: VALID_STATUSES,
      message: `Status must be one of: ${VALID_STATUSES.join(', ')}`
    },
    default: 'pending',
    index: true
  },
  visibility: {
    type: String,
    enum: {
      values: VALID_VISIBILITY,
      message: `Visibility must be one of: ${VALID_VISIBILITY.join(', ')}`
    },
    default: 'restricted'
  },
  rejectionReason: {
    type: String,
    default: '',
    validate: {
      validator: function(reason) {
        return this.status !== 'rejected' || reason.length > 0;
      },
      message: "Rejection reason is required when status is 'rejected'"
    }
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"]
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      minLength: [5, "Review comment must be at least 5 characters"],
      maxLength: [500, "Review comment cannot exceed 500 characters"]
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  ratings: {
    type: Number,
    default: 0,
    min: [0, "Overall rating cannot be negative"],
    max: [5, "Overall rating cannot exceed 5"]
  },
  sold_out: {
    type: Number,
    default: 0,
    min: [0, "Sold out count cannot be negative"]
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastModified: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
productSchema.index({ DesignTitle: 'text', Description: 'text', Maintag: 'text', Designtags: 'text' });
productSchema.index({ status: 1, visibility: 1 });
productSchema.index({ shopId: 1, status: 1 });
productSchema.index({ createdAt: -1 });

// Pre-save middleware
productSchema.pre('save', function(next) {
  this.lastModified = new Date();
  
  // Ensure availableColors includes ProductColor
  if (!this.availableColors.includes(this.ProductColor)) {
    this.availableColors.push(this.ProductColor);
  }
  
  next();
});

// Virtual for discounted percentage
productSchema.virtual('discountPercentage').get(function() {
  if (this.originalPrice && this.discountPrice) {
    return Math.round(((this.originalPrice - this.discountPrice) / this.originalPrice) * 100);
  }
  return 0;
});

// Method to check if product can be purchased
productSchema.methods.canBePurchased = function() {
  return this.status === 'public' && this.visibility === 'public';
};

module.exports = mongoose.model("Product", productSchema);