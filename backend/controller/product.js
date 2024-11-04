const express = require("express");
const { isSeller, isAuthenticated, isAdmin } = require("../middleware/auth");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const router = express.Router();
const { 
    Product, 
    VALID_COLORS,
    VALID_PRODUCT_TYPES,
    VALID_VIEWS,
    VALID_STATUSES
} = require("../model/product");
const Order = require("../model/order");
const Shop = require("../model/shop");
const cloudinary = require("cloudinary").v2;
const mongoose = require("mongoose");
const ErrorHandler = require("../utils/ErrorHandler");
const multer = require('multer');
const { body, validationResult } = require('express-validator');

// Validation middleware
const validateProductData = [
  body('DesignTitle')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Design title must be between 3 and 100 characters'),
  
  body('Description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  
  body('Maintag')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Main tag must be between 2 and 50 characters'),
  
  body('ProductType')
    .isIn(VALID_PRODUCT_TYPES)
    .withMessage(`Product type must be one of: ${VALID_PRODUCT_TYPES.join(', ')}`),
  
  body('ProductColor')
    .isIn(VALID_COLORS)
    .withMessage(`Product color must be one of: ${VALID_COLORS.join(', ')}`),
  
  body('ProductView')
    .isIn(['front', 'back'])
    .withMessage('Product view must be either front or back'),
  
  body('DesignScale')
    .isFloat({ min: 0.1, max: 5.0 })
    .withMessage('Design scale must be between 0.1 and 5.0'),
  
  body('shopId')
    .custom(value => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid shop ID')
];

// File upload configuration
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 100 * 2048 * 2048 // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Utility function for shop owner notifications
async function notifyShopOwner(product, status) {
  try {
    const shop = await Shop.findById(product.shopId);
    if (shop) {
      console.log(`Notifying shop owner (${shop.owner}) about product ${product._id} status: ${status}`);
      // Implement actual notification logic here
    }
  } catch (error) {
    console.error('Error notifying shop owner:', error);
  }
}

// Get all products
router.get("/get-all-products", catchAsyncErrors(async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = { status: 'public' };
    const totalProducts = await Product.countDocuments(query);

    const products = await Product.find(query)
      .select('-__v')
      .sort(req.query.sort || '-createdAt')
      .skip(skip)
      .limit(limit)
      .populate('shopId', 'name email avatar');

    res.status(200).json({
      success: true,
      products,
      currentPage: page,
      totalPages: Math.ceil(totalProducts / limit),
      totalProducts,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
}));

// controller/product.js
router.post("/create-product", 
  isAuthenticated,
  isSeller,
  upload.single('designImage'),
  validateProductData,
  catchAsyncErrors(async (req, res, next) => {
    try {
      console.log('Create product request:', {
        body: req.body,
        file: req.file ? 'Present' : 'Missing',
        seller: req.seller._id
      });

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }

      if (!req.file) {
        return next(new ErrorHandler("Design image is required", 400));
      }

      // Ensure all required fields are present and properly formatted
      const designTags = Array.isArray(req.body.Designtags) 
        ? req.body.Designtags 
        : (typeof req.body.Designtags === 'string' 
          ? JSON.parse(req.body.Designtags) 
          : []);

      const productData = {
        DesignTitle: req.body.DesignTitle?.trim(),
        Description: req.body.Description?.trim(),
        Maintag: req.body.Maintag?.trim(),
        Designtags: designTags,
        ProductType: req.body.ProductType,
        ProductColor: req.body.ProductColor,
        ProductView: req.body.ProductView || 'front',
        DesignScale: parseFloat(req.body.DesignScale) || 1,
        originalPrice: parseFloat(req.body.originalPrice) || 0,
        discountPrice: req.body.discountPrice ? parseFloat(req.body.discountPrice) : null,
        shopId: req.seller._id,
        shop: req.seller._id,
        status: 'pending',
        createdBy: req.seller._id
      };

      // Upload image to cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "products",
        transformation: [
          { quality: "auto:best" },
          { fetch_format: "auto" }
        ]
      });

      productData.designImage = {
        public_id: result.public_id,
        url: result.secure_url
      };

      // Validate available colors
      productData.availableColors = [productData.ProductColor];

      // Create product
      const product = await Product.create(productData);

      // Send response
      res.status(201).json({
        success: true,
        message: "Product created successfully and is awaiting inspection!",
        product
      });

    } catch (error) {
      console.error("Product creation error:", {
        message: error.message,
        stack: error.stack
      });

      // Cleanup uploaded file if exists
      if (req.file?.path) {
        try {
          await fs.unlink(req.file.path);
        } catch (cleanupError) {
          console.error("Error cleaning up uploaded file:", cleanupError);
        }
      }

      // Cleanup cloudinary upload if exists
      if (productData?.designImage?.public_id) {
        try {
          await cloudinary.uploader.destroy(productData.designImage.public_id);
        } catch (cleanupError) {
          console.error("Error cleaning up cloudinary image:", cleanupError);
        }
      }

      return next(new ErrorHandler(error.message, 500));
    }
  })
);
// Get all products for admin
router.get(
  "/admin-all-products",
  isAuthenticated,
  isAdmin,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      const query = {};
      const totalProducts = await Product.countDocuments(query);

      const products = await Product.find(query)
        .select('-__v')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit)
        .populate('shopId', 'name email avatar')
        .lean()
        .maxTimeMS(30000);

      res.status(200).json({
        success: true,
        products,
        currentPage: page,
        totalPages: Math.ceil(totalProducts / limit),
        totalProducts,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Approve/reject product
router.put("/approve-reject-product/:id", 
  isAuthenticated, 
  isAdmin, 
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status, statusReason } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new ErrorHandler("Invalid product ID", 400));
      }

      const product = await Product.findById(id);
      if (!product) {
        return next(new ErrorHandler("Product not found", 404));
      }

      if (!status || !['public', 'pending', 'rejected'].includes(status)) {
        return next(new ErrorHandler("Invalid status value", 400));
      }

      const updateData = {
        status,
        visibility: status === 'public' ? 'public' : 'restricted',
        rejectionReason: status === 'rejected' ? statusReason || '' : '',
        lastModified: new Date(),
        lastModifiedBy: req.user._id
      };

      const updatedProduct = await Product.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!updatedProduct) {
        return next(new ErrorHandler("Failed to update product", 500));
      }

      await notifyShopOwner(updatedProduct, status);

      res.status(200).json({
        success: true,
        message: `Product ${status === 'public' ? 'approved' : 'rejected'} successfully`,
        product: updatedProduct
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Update product design
router.put("/update-product-design/:id", 
  isAuthenticated,
  isSeller,
  upload.single('designImage'),
  validateProductData,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { id } = req.params;
      
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new ErrorHandler("Invalid product ID", 400));
      }

      const product = await Product.findById(id);
      if (!product) {
        return next(new ErrorHandler("Product not found", 404));
      }

      const shop = await Shop.findById(product.shopId);
      if (!shop || shop.owner.toString() !== req.seller._id.toString()) {
        return next(new ErrorHandler("Unauthorized access to this product", 403));
      }

      // Handle design image update
      let designImage = product.designImage;
      if (req.file) {
        // Upload new image
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "products",
          transformation: [
            { quality: "auto:best" },
            { fetch_format: "auto" }
          ]
        });
        
        designImage = result.secure_url;

        // Delete old image if exists
        if (product.designImage) {
          try {
            // Extract public_id from the old URL
            const publicId = product.designImage.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(publicId);
          } catch (error) {
            console.error("Error deleting old image:", error);
          }
        }
      }

      const updateData = {
        ...req.body,
        designImage,
        status: 'pending',
        lastModified: new Date(),
        lastModifiedBy: req.seller._id
      };

      const updatedProduct = await Product.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      res.status(200).json({
        success: true,
        message: "Product design updated successfully and awaiting re-approval",
        product: updatedProduct
      });
    } catch (error) {
      if (req.file?.path) {
        try {
          await cloudinary.uploader.destroy(req.file.filename);
        } catch (cleanupError) {
          console.error("Error cleaning up uploaded file:", cleanupError);
        }
      }
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Get all products for a shop
router.get(
  "/get-all-products-shop/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return next(new ErrorHandler("Invalid shop ID", 400));
      }

      const shop = await Shop.findById(req.params.id);
      if (!shop) {
        return next(new ErrorHandler("Shop not found", 404));
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      const query = {
        shopId: req.params.id,
        status: { $in: ['public', 'restricted'] }
      };

      if (req.query.productType && VALID_PRODUCT_TYPES.includes(req.query.productType)) {
        query.ProductType = req.query.productType;
      }

      if (req.query.color && VALID_COLORS.includes(req.query.color)) {
        query.availableColors = req.query.color;
      }

      const totalProducts = await Product.countDocuments(query);

      const products = await Product.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-__v');

      res.status(200).json({
        success: true,
        products,
        currentPage: page,
        totalPages: Math.ceil(totalProducts / limit),
        totalProducts,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Get pending products (admin)
router.get(
  "/admin/pending-products",
  isAuthenticated,
  isAdmin,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      const totalPending = await Product.countDocuments({ status: 'pending' });

      const pendingProducts = await Product.find({ status: 'pending' })
        .select('DesignTitle Description Maintag Designtags ProductType ProductColor ProductView DesignScale designImage status availableColors createdAt shopId')
        .populate('shopId', 'name email')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit)
        .lean()
        .maxTimeMS(30000);

      res.status(200).json({
        success: true,
        products: pendingProducts,
        currentPage: page,
        totalPages: Math.ceil(totalPending / limit),
        totalPending,
      });
    } catch (error) {
      if (error.name === 'MongooseError' && error.message.includes('timeout')) {
        return next(new ErrorHandler("Request timeout. Please try again.", 504));
      }
      return next(new ErrorHandler(error.message, 500));
    }
  })
);// Create/Update review
router.put(
  "/create-new-review",
  isAuthenticated,
  [
    body('rating').isFloat({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),
    body('comment').trim().isLength({ min: 5, max: 500 })
      .withMessage('Comment must be between 5 and 500 characters'),
    body('productId').custom(value => mongoose.Types.ObjectId.isValid(value))
      .withMessage('Invalid product ID'),
    body('orderId').custom(value => mongoose.Types.ObjectId.isValid(value))
      .withMessage('Invalid order ID')
  ],
  catchAsyncErrors(async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }

      const { rating, comment, productId, orderId } = req.body;

      // Find the product
      const product = await Product.findById(productId);
      if (!product) {
        return next(new ErrorHandler("Product not found", 404));
      }

      // Verify purchase
      const order = await Order.findOne({
        _id: orderId,
        "user._id": req.user._id,
        "cart.productId": productId
      });

      if (!order) {
        return next(new ErrorHandler("You must purchase this product to review it", 403));
      }

      // Create review object
      const review = {
        user: req.user._id,
        name: req.user.name,
        rating: Number(rating),
        comment,
        productId
      };

      // Check if user has already reviewed
      const existingReviewIndex = product.reviews.findIndex(
        rev => rev.user.toString() === req.user._id.toString()
      );

      if (existingReviewIndex !== -1) {
        // Update existing review
        product.reviews[existingReviewIndex] = review;
      } else {
        // Add new review
        product.reviews.push(review);
      }

      // Update product rating
      product.ratings = product.reviews.reduce((acc, item) => item.rating + acc, 0) 
        / product.reviews.length;

      // Save product with new review
      await product.save({ validateBeforeSave: false });

      // Mark the product as reviewed in the order
      await Order.updateOne(
        { _id: orderId, "cart.productId": productId },
        { $set: { "cart.$.isReviewed": true } }
      );

      res.status(200).json({
        success: true,
        message: "Review submitted successfully!"
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Delete product
router.delete(
  "/delete-shop-product/:id",
  isAuthenticated,
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      // Validate product ID
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return next(new ErrorHandler("Invalid product ID", 400));
      }

      // Find product
      const product = await Product.findById(req.params.id);
      if (!product) {
        return next(new ErrorHandler("Product not found", 404));
      }

      // Verify ownership
      const shop = await Shop.findById(product.shopId);
      if (!shop || shop.owner.toString() !== req.seller._id.toString()) {
        return next(new ErrorHandler("Unauthorized access to this product", 403));
      }

      // Check for active orders
      const activeOrders = await Order.countDocuments({
        'cart.productId': product._id,
        status: { $nin: ['delivered', 'cancelled', 'refunded'] }
      });

      if (activeOrders > 0) {
        return next(new ErrorHandler("Cannot delete product with active orders", 400));
      }

      // Delete product image from cloudinary if exists
      if (product.designImage) {
        try {
          // Extract public_id from the URL
          const publicId = product.designImage.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(publicId);
        } catch (error) {
          console.error("Error deleting image from cloudinary:", error);
        }
      }

      // Delete product
      await Product.findByIdAndDelete(req.params.id);

      res.status(200).json({
        success: true,
        message: "Product deleted successfully!"
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Get product by ID with availability check
router.get(
  "/get-product/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return next(new ErrorHandler("Invalid product ID", 400));
      }

      const product = await Product.findById(req.params.id)
        .populate('shopId', 'name email avatar')
        .select('-__v');

      if (!product) {
        return next(new ErrorHandler("Product not found", 404));
      }

      // Check if product is public or user has permission
      if (product.status !== 'public' && (!req.user || 
          (req.user.role !== 'admin' && 
           (!product.shopId || product.shopId.owner !== req.user._id)))) {
        return next(new ErrorHandler("Product not available", 403));
      }

      res.status(200).json({
        success: true,
        product
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Search products
router.get(
  "/search",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { 
        query, 
        category, 
        priceRange, 
        sortBy, 
        page = 1, 
        limit = 20 
      } = req.query;

      const searchQuery = {
        status: 'public'
      };

      // Add search conditions
      if (query) {
        searchQuery.$or = [
          { DesignTitle: { $regex: query, $options: 'i' } },
          { Description: { $regex: query, $options: 'i' } },
          { Maintag: { $regex: query, $options: 'i' } },
          { Designtags: { $regex: query, $options: 'i' } }
        ];
      }

      // Add category filter
      if (category) {
        searchQuery.Maintag = category;
      }

      // Add price range filter
      if (priceRange) {
        const [min, max] = priceRange.split('-').map(Number);
        searchQuery.originalPrice = {
          $gte: min || 0,
          ...(max && { $lte: max })
        };
      }

      // Calculate skip value for pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Build sort object
      let sort = { createdAt: -1 }; // default sort
      if (sortBy) {
        switch (sortBy) {
          case 'price-asc':
            sort = { originalPrice: 1 };
            break;
          case 'price-desc':
            sort = { originalPrice: -1 };
            break;
          case 'rating':
            sort = { ratings: -1 };
            break;
          case 'newest':
            sort = { createdAt: -1 };
            break;
          case 'oldest':
            sort = { createdAt: 1 };
            break;
        }
      }

      // Get total count for pagination
      const total = await Product.countDocuments(searchQuery);

      // Execute search query
      const products = await Product.find(searchQuery)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('shopId', 'name email avatar')
        .select('-__v');

      res.status(200).json({
        success: true,
        products,
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        total
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Export router
module.exports = router;