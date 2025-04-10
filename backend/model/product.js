const mongoose = require("mongoose");

const VALID_COLORS = ['white', 'black'];
const VALID_PRODUCT_TYPES = ['hoodie'];
const VALID_VIEWS = ['front', 'back'];
const VALID_STATUSES = ['pending', 'public', 'rejected'];
const VALID_VISIBILITY = ['public', 'restricted'];

const productSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: [true, "Shop ID is required"],
      index: true,
      validate: {
        validator: function (v) {
          return mongoose.Types.ObjectId.isValid(v);
        },
        message: "Invalid Shop ID format",
      },
    },
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: [true, "Shop reference is required"],
      validate: {
        validator: function (v) {
          return mongoose.Types.ObjectId.isValid(v);
        },
        message: "Invalid Shop reference format",
      },
    },
    DesignTitle: {
      type: String,
      required: [true, "Please enter your product name!"],
      trim: true,
      minLength: [3, "Design title must be at least 3 characters"],
      maxLength: [100, "Design title cannot exceed 100 characters"],
      index: true,
    },
    Description: {
      type: String,
      required: [true, "Please enter your product Description!"],
      trim: true,
      minLength: [10, "Description must be at least 10 characters"],
      maxLength: [1000, "Description cannot exceed 1000 characters"],
    },
    Maintag: {
      type: String,
      required: [true, "Please enter a main tag!"],
      trim: true,
      index: true,
      validate: {
        validator: function (v) {
          return v.length >= 2 && v.length <= 50;
        },
        message: "Main tag must be between 2 and 50 characters",
      },
    },
    designSpecs: {
      position: {
        x: Number,
        y: Number,
      },
      scale: Number,
      productType: String,
      productColor: String,
      productView: String,
    },
    Designtags: {
      type: [String],
      validate: {
        validator: function (tags) {
          return tags.every((tag) => tag.length > 0 && tag.length <= 50);
        },
        message: "Each design tag must be between 1 and 50 characters",
      },
      default: [],
      set: function (tags) {
        // Remove duplicates and trim each tag
        return Array.from(new Set(tags.map((tag) => tag.trim())));
      },
    },
    ProductType: {
      type: String,
      required: [true, "Please enter your product type!"],
      enum: {
        values: VALID_PRODUCT_TYPES,
        message: `Product type must be one of: ${VALID_PRODUCT_TYPES.join(
          ", "
        )}`,
      },
      index: true,
    },
    ProductColor: {
      type: String,
      required: [true, "Please select a product color!"],
      enum: {
        values: VALID_COLORS,
        message: `Product color must be one of: ${VALID_COLORS.join(", ")}`,
      },
    },
    availableColors: {
      type: [
        {
          type: String,
          enum: {
            values: VALID_COLORS,
            message: `Available colors must be one of: ${VALID_COLORS.join(
              ", "
            )}`,
          },
        },
      ],
      validate: {
        validator: function (colors) {
          return colors.length > 0 && new Set(colors).size === colors.length;
        },
        message: "At least one unique color must be selected",
      },
      default: function () {
        return [this.ProductColor];
      },
    },
    ProductView: {
      type: String,
      enum: {
        values: VALID_VIEWS,
        message: `Product view must be one of: ${VALID_VIEWS.join(", ")}`,
      },
      default: "front",
    },
    DesignPosition: {
      x: {
        type: Number,
        default: 50,
        min: [0, "X position cannot be less than 0"],
        max: [100, "X position cannot exceed 100"],
        set: function (value) {
          return parseFloat(parseFloat(value).toFixed(1));
        },
      },
      y: {
        type: Number,
        default: 50,
        min: [0, "Y position cannot be less than 0"],
        max: [100, "Y position cannot exceed 100"],
        set: function (value) {
          return parseFloat(parseFloat(value).toFixed(1));
        },
      },
    },

    DesignScale: {
      type: Number,
      default: 0.8,
      min: [0.5, "Design scale cannot be less than 0.5"],
      max: [1.2, "Design scale cannot exceed 1.2"],
      set: function (value) {
        return parseFloat(parseFloat(value).toFixed(1));
      },
    },
    originalPrice: {
      type: Number,
      validate: {
        validator: function (price) {
          return this.status === "public" ? price > 0 : true;
        },
        message:
          "Original price is required for public products and must be greater than 0",
      },
      set: function (value) {
        return parseFloat(parseFloat(value).toFixed(2));
      },
    },
    discountPrice: {
      type: Number,
      validate: {
        validator: function (price) {
          if (price === undefined || price === null) return true;
          if (this.status !== "public") return true;
          return price <= this.originalPrice;
        },
        message: "Discount price must be less than or equal to original price",
      },
      set: function (value) {
        return value ? parseFloat(parseFloat(value).toFixed(2)) : undefined;
      },
    },
    designImage: {
      public_id: {
        type: String,
        required: [true, "Design image public ID is required"],
      },
      url: {
        type: String,
        required: [true, "Design image URL is required"],
        validate: {
          validator: function (v) {
            return /^https?:\/\/.+/.test(v);
          },
          message: "Invalid image URL format",
        },
      },
    },
    status: {
      type: String,
      enum: {
        values: VALID_STATUSES,
        message: `Status must be one of: ${VALID_STATUSES.join(", ")}`,
      },
      default: "pending",
      index: true,
    },
    visibility: {
      type: String,
      enum: {
        values: VALID_VISIBILITY,
        message: `Visibility must be one of: ${VALID_VISIBILITY.join(", ")}`,
      },
      default: "restricted",
    },
    rejectionReason: {
      type: String,
      default: "",
      validate: {
        validator: function (reason) {
          return this.status !== "rejected" || (reason && reason.length >= 10);
        },
        message:
          "A detailed rejection reason (min 10 characters) is required when status is 'rejected'",
      },
    },
    reviews: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
          validate: {
            validator: function (v) {
              return mongoose.Types.ObjectId.isValid(v);
            },
            message: "Invalid User ID format",
          },
        },
        name: {
          type: String,
          required: true,
          trim: true,
        },
        rating: {
          type: Number,
          required: true,
          min: [1, "Rating must be at least 1"],
          max: [5, "Rating cannot exceed 5"],
        },
        comment: {
          type: String,
          required: true,
          trim: true,
          minLength: [5, "Review comment must be at least 5 characters"],
          maxLength: [500, "Review comment cannot exceed 500 characters"],
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    ratings: {
      type: Number,
      default: 0,
      min: [0, "Overall rating cannot be negative"],
      max: [5, "Overall rating cannot exceed 5"],
      set: function (value) {
        return parseFloat(parseFloat(value).toFixed(2));
      },
    },
    sold_out: {
      type: Number,
      default: 0,
      min: [0, "Sold out count cannot be negative"],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    lastModified: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
      validate: {
        validator: function (v) {
          return mongoose.Types.ObjectId.isValid(v);
        },
        message: "Invalid creator ID format",
      },
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      validate: {
        validator: function (v) {
          return mongoose.Types.ObjectId.isValid(v);
        },
        message: "Invalid modifier ID format",
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
// Indexes for better query performance
productSchema.index({ DesignTitle: 'text', Description: 'text', Maintag: 'text', Designtags: 'text' });
productSchema.index({ status: 1, visibility: 1 });
productSchema.index({ shopId: 1, status: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ 'reviews.rating': 1 });
productSchema.index({ originalPrice: 1 });

// Pre-save middleware
productSchema.pre('save', function(next) {
  this.lastModified = new Date();
  
  // Ensure availableColors includes ProductColor
  if (!this.availableColors.includes(this.ProductColor)) {
    this.availableColors.push(this.ProductColor);
  }

  // Update ratings when reviews change
  if (this.reviews?.length > 0) {
    this.ratings = parseFloat((this.reviews.reduce((acc, item) => item.rating + acc, 0) / 
      this.reviews.length).toFixed(2));
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

// Virtual for stock status
productSchema.virtual('isInStock').get(function() {
  return this.sold_out < 999999; // Assuming unlimited stock for digital products
});

// Method to check if product can be purchased
productSchema.methods.canBePurchased = function() {
  return this.status === 'public' && 
         this.visibility === 'public' && 
         this.isInStock;
};

// Export constants for use in other files
const Product = mongoose.model("Product", productSchema);

module.exports = {
  Product,
  VALID_COLORS,
  VALID_PRODUCT_TYPES,
  VALID_VIEWS,
  VALID_STATUSES,
  VALID_VISIBILITY
};