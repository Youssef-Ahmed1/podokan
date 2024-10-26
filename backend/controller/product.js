const express = require("express");
const { isSeller, isAuthenticated, isAdmin } = require("../middleware/auth");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const router = express.Router();
const Product = require("../model/product");
const Order = require("../model/order");
const Shop = require("../model/shop");
const cloudinary = require("cloudinary").v2;
const mongoose = require("mongoose");
const ErrorHandler = require("../utils/ErrorHandler");
const multer = require('multer');
const { body, validationResult } = require('express-validator');

// Constants
const VALID_COLORS = ['white', 'black', 'red', 'blue', 'gray'];
const VALID_STATUSES = ['pending', 'public', 'restricted', 'rejected'];
const VALID_PRODUCT_TYPES = ['t-shirt', 'hoodie', 'long-sleeve'];
const VALID_VIEWS = ['front', 'back'];

// Multer configuration
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
    fileSize: 100 * 2048 * 2048, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Validation middleware
const validateProductData = [
  body('shopId')
    .notEmpty()
    .withMessage('Shop ID is required')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid shop ID format'),
  body('DesignTitle')
    .trim()
    .notEmpty()
    .withMessage('Design title is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Design title must be between 3 and 100 characters'),
  body('Description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('Maintag')
    .trim()
    .notEmpty()
    .withMessage('Main tag is required'),
  body('ProductType')
    .isIn(VALID_PRODUCT_TYPES)
    .withMessage('Invalid product type'),
  body('ProductColor')
    .isIn(VALID_COLORS)
    .withMessage('Invalid product color'),
  body('ProductView')
    .isIn(VALID_VIEWS)
    .withMessage('Invalid product view'),
  body('DesignScale')
    .isFloat({ min: 0.1, max: 5.0 })
    .withMessage('Design scale must be between 0.1 and 5.0'),
  body('availableColors')
    .optional()
    .isArray()
    .withMessage('Available colors must be an array')
    .custom((colors) => colors.every(color => VALID_COLORS.includes(color)))
    .withMessage(`Available colors must be one of: ${VALID_COLORS.join(', ')}`)
];

// CORS preflight handling
router.options('/approve-reject-product/:id', (req, res) => {
  res.header('Access-Control-Allow-Methods', 'PUT');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(204);
});

// Create product
router.post(
  "/create-product",
  isAuthenticated,
  isSeller,
  upload.single('designImage'),
  validateProductData,
  catchAsyncErrors(async (req, res, next) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }// productController.js - Add these new routes

// Update design position
router.put(
  "/update-design-position/:id",
  isAuthenticated,
  isAdmin("Admin"),
  [
    body('DesignPosition')
      .isObject()
      .withMessage('Design position must be an object')
      .custom((position) => {
        return position && 
               typeof position.x === 'number' && 
               typeof position.y === 'number' &&
               position.x >= 0 && position.x <= 100 &&
               position.y >= 0 && position.y <= 100;
      })
      .withMessage('Invalid position coordinates')
  ],
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { id } = req.params;
      const { DesignPosition } = req.body;

      const product = await Product.findById(id);
      if (!product) {
        return next(new ErrorHandler("Product not found", 404));
      }

      product.DesignPosition = DesignPosition;
      await product.save();

      res.status(200).json({
        success: true,
        message: "Design position updated successfully",
        position: DesignPosition
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Center design
router.put(
  "/center-design/:id",
  isAuthenticated,
  isAdmin("Admin"),
  [
    body('axis')
      .isIn(['x', 'y', 'both'])
      .withMessage('Invalid axis specified')
  ],
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { id } = req.params;
      const { axis } = req.body;

      const product = await Product.findById(id);
      if (!product) {
        return next(new ErrorHandler("Product not found", 404));
      }

      const newPosition = { ...product.DesignPosition };
      
      if (axis === 'x' || axis === 'both') {
        newPosition.x = 50; // Center horizontally
      }
      if (axis === 'y' || axis === 'both') {
        newPosition.y = 50; // Center vertically
      }

      product.DesignPosition = newPosition;
      await product.save();

      res.status(200).json({
        success: true,
        message: "Design centered successfully",
        position: newPosition
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

      const { 
        shopId, 
        DesignTitle, 
        Description, 
        Maintag, 
        Designtags, 
        ProductType, 
        ProductColor, 
        ProductView, 
        DesignScale,
        availableColors
      } = req.body;

      // Verify shop ownership
      const shop = await Shop.findById(shopId);
      if (!shop) {
        return next(new ErrorHandler("Shop not found", 404));
      }
      if (shop.owner.toString() !== req.seller._id.toString()) {
        return next(new ErrorHandler("Unauthorized access to this shop", 403));
      }

      // Handle image upload
      if (!req.file) {
        return next(new ErrorHandler("Design image is required", 400));
      }

      let designImage;
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "products",
          transformation: [
            { quality: "auto:best" },
            { fetch_format: "auto" }
          ]
        });
        designImage = {
          public_id: result.public_id,
          url: result.secure_url,
        };
      } catch (error) {
        return next(new ErrorHandler("Error uploading image to cloud storage", 500));
      }

      // Create product
      const productData = {
        DesignTitle: DesignTitle.trim(),
        Description: Description.trim(),
        Maintag: Maintag.trim(),
        Designtags: Designtags ? Designtags.split(',').map(tag => tag.trim()) : [],
        ProductType,
        ProductColor,
        ProductView,
        DesignScale: parseFloat(DesignScale),
        designImage,
        shopId,
        status: 'pending',
        availableColors: availableColors || [ProductColor],
        createdBy: req.seller._id
      };

      const product = await Product.create(productData);

      res.status(201).json({
        success: true,
        message: "Product created successfully and is awaiting inspection!",
        product,
      });
    } catch (error) {
      // Cleanup uploaded file if exists
      if (req.file) {
        try {
          await cloudinary.uploader.destroy(req.file.filename);
        } catch (cleanupError) {
          console.error("Error cleaning up uploaded file:", cleanupError);
        }
      }
      return next(new ErrorHandler(error.message, 500));
    }
  })
);// Approve/Reject Product route
router.put(
  '/approve-reject-product/:id',
  isAuthenticated,
  isAdmin("Admin"),
  [
    body('status')
      .isIn(VALID_STATUSES)
      .withMessage('Invalid status value'),
    body('originalPrice')
      .if(body('status').equals('public'))
      .isFloat({ min: 0.01 })
      .withMessage('Valid original price is required for public products'),
    body('discountPrice')
      .optional()
      .isFloat({ min: 0 })
      .custom((value, { req }) => {
        return !value || value <= req.body.originalPrice;
      })
      .withMessage('Discount price must be less than or equal to original price'),
    body('availableColors')
      .if(body('status').equals('public'))
      .isArray()
      .withMessage('Available colors must be an array')
      .custom((colors) => colors.every(color => VALID_COLORS.includes(color)))
      .withMessage(`Available colors must be from: ${VALID_COLORS.join(', ')}`)
      .custom((colors) => colors.length > 0)
      .withMessage('At least one color must be selected'),
    body('rejectionReason')
      .if(body('status').equals('rejected'))
      .notEmpty()
      .withMessage('Rejection reason is required when rejecting a product')
  ],
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status, rejectionReason, ...updates } = req.body;

      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }

      // Validate product ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new ErrorHandler("Invalid product ID", 400));
      }

      // Find product
      const product = await Product.findById(id);
      if (!product) {
        return next(new ErrorHandler("Product not found", 404));
      }

      // Validate status transition
      if (product.status === 'rejected' && status !== 'pending') {
        return next(new ErrorHandler("Rejected products must be resubmitted as pending", 400));
      }

      // Prepare update data
      const updateData = {
        status,
        rejectionReason: status === 'rejected' ? rejectionReason : undefined,
        originalPrice: status === 'public' ? parseFloat(updates.originalPrice) : undefined,
        discountPrice: updates.discountPrice ? parseFloat(updates.discountPrice) : undefined,
        availableColors: updates.availableColors,
        lastModified: new Date(),
        lastModifiedBy: req.user._id
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => 
        updateData[key] === undefined && delete updateData[key]
      );

      // Update product
      const updatedProduct = await Product.findByIdAndUpdate(
        id,
        { $set: updateData },
        { 
          new: true, 
          runValidators: true,
          select: '-__v' // Exclude version key
        }
      );

      // Notify shop owner about the status change
      await notifyShopOwner(updatedProduct, status);

      res.status(200).json({
        success: true,
        message: `Product ${status === 'rejected' ? 'rejected' : 'updated'} successfully`,
        product: updatedProduct
      });

    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Update product design
router.put(
  "/update-product-design/:id",
  isAuthenticated,
  isSeller,
  upload.single('designImage'),
  [
    ...validateProductData,
    body('status')
      .not()
      .exists()
      .withMessage('Status cannot be updated through this endpoint')
  ],
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { id } = req.params;

      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }

      // Validate product ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new ErrorHandler("Invalid product ID", 400));
      }

      // Find product and verify ownership
      const product = await Product.findById(id);
      if (!product) {
        return next(new ErrorHandler("Product not found", 404));
      }

      const shop = await Shop.findById(product.shopId);
      if (!shop || shop.owner.toString() !== req.seller._id.toString()) {
        return next(new ErrorHandler("Unauthorized access to this product", 403));
      }

      // Handle new image upload if provided
      let designImage = product.designImage;
      if (req.file) {
        try {
          // Delete old image
          if (product.designImage?.public_id) {
            await cloudinary.uploader.destroy(product.designImage.public_id);
          }

          // Upload new image
          const result = await cloudinary.uploader.upload(req.file.path, {
            folder: "products",
            transformation: [
              { quality: "auto:best" },
              { fetch_format: "auto" }
            ]
          });
          designImage = {
            public_id: result.public_id,
            url: result.secure_url,
          };
        } catch (error) {
          return next(new ErrorHandler("Error updating design image", 500));
        }
      }

      // Update product
      const updateData = {
        ...req.body,
        designImage,
        status: 'pending', // Reset to pending for re-approval
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
      // Cleanup uploaded file if exists
      if (req.file) {
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

// Utility function to notify shop owner
async function notifyShopOwner(product, status) {
  try {
    const shop = await Shop.findById(product.shopId);
    if (shop) {
      // Implement your notification logic here
      console.log(`Notifying shop owner (${shop.owner}) about product ${product._id} status: ${status}`);
    }
  } catch (error) {
    console.error('Error notifying shop owner:', error);
  }
}// Get all products of a shop
router.get(
  "/get-all-products-shop/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      // Validate shop ID
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return next(new ErrorHandler("Invalid shop ID", 400));
      }

      // Check if shop exists
      const shop = await Shop.findById(req.params.id);
      if (!shop) {
        return next(new ErrorHandler("Shop not found", 404));
      }

      // Get products with pagination
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      const query = {
        shopId: req.params.id,
        status: { $in: ['public', 'restricted'] }
      };

      // Add filters if provided
      if (req.query.productType) {
        if (VALID_PRODUCT_TYPES.includes(req.query.productType)) {
          query.ProductType = req.query.productType;
        }
      }

      if (req.query.color) {
        if (VALID_COLORS.includes(req.query.color)) {
          query.availableColors = req.query.color;
        }
      }

      // Get total count for pagination
      const totalProducts = await Product.countDocuments(query);

      // Get products
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
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      const totalPending = await Product.countDocuments({ status: 'pending' });

      const pendingProducts = await Product.find({ status: 'pending' })
        .select('DesignTitle Description Maintag Designtags ProductType ProductColor ProductView DesignScale designImage status availableColors createdAt shopId')
        .populate('shopId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      res.status(200).json({
        success: true,
        products: pendingProducts,
        currentPage: page,
        totalPages: Math.ceil(totalPending / limit),
        totalPending,
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
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return next(new ErrorHandler("Invalid product ID", 400));
      }

      const product = await Product.findById(req.params.id);

      if (!product) {
        return next(new ErrorHandler("Product not found", 404));
      }

      // Verify ownership
      const shop = await Shop.findById(product.shopId);
      if (!shop || shop.owner.toString() !== req.seller._id.toString()) {
        return next(new ErrorHandler("Unauthorized access to this product", 403));
      }

      // Check if product can be deleted (not in active orders)
      const activeOrders = await Order.countDocuments({
        'cart.productId': product._id,
        status: { $nin: ['delivered', 'cancelled', 'refunded'] }
      });

      if (activeOrders > 0) {
        return next(new ErrorHandler("Cannot delete product with active orders", 400));
      }

      // Delete image from cloudinary
      if (product.designImage?.public_id) {
        await cloudinary.uploader.destroy(product.designImage.public_id);
      }

      await product.remove();

      res.status(200).json({
        success: true,
        message: "Product deleted successfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Get all products (public)
router.get(
  "/get-all-products",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      // Build query
      let query = {
        status: { $in: ["public", "restricted"] }
      };

      // Add filters
      if (req.query.productType && VALID_PRODUCT_TYPES.includes(req.query.productType)) {
        query.ProductType = req.query.productType;
      }

      if (req.query.color && VALID_COLORS.includes(req.query.color)) {
        query.availableColors = req.query.color;
      }

      if (req.query.minPrice || req.query.maxPrice) {
        query.originalPrice = {};
        if (req.query.minPrice) query.originalPrice.$gte = parseFloat(req.query.minPrice);
        if (req.query.maxPrice) query.originalPrice.$lte = parseFloat(req.query.maxPrice);
      }

      if (req.query.search) {
        query.$or = [
          { DesignTitle: { $regex: req.query.search, $options: 'i' } },
          { Description: { $regex: req.query.search, $options: 'i' } },
          { Maintag: { $regex: req.query.search, $options: 'i' } },
          { Designtags: { $regex: req.query.search, $options: 'i' } }
        ];
      }

      // Get total count
      const totalProducts = await Product.countDocuments(query);

      // Get products
      let products = await Product.find(query)
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
  })
);

// Create/Update review
router.put(
  "/create-new-review",
  isAuthenticated,
  [
    body('rating')
      .isFloat({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),
    body('comment')
      .trim()
      .isLength({ min: 5, max: 500 })
      .withMessage('Comment must be between 5 and 500 characters'),
    body('productId')
      .custom(value => mongoose.Types.ObjectId.isValid(value))
      .withMessage('Invalid product ID'),
    body('orderId')
      .custom(value => mongoose.Types.ObjectId.isValid(value))
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

      // Verify product exists
      const product = await Product.findById(productId);
      if (!product) {
        return next(new ErrorHandler("Product not found", 404));
      }

      // Verify order exists and user purchased the product
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

      // Check if user already reviewed
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

      await product.save({ validateBeforeSave: false });

      // Mark product as reviewed in order
      await Order.updateOne(
        { 
          _id: orderId,
          "cart.productId": productId 
        },
        { 
          $set: { "cart.$.isReviewed": true }
        }
      );

      res.status(200).json({
        success: true,
        message: "Review submitted successfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

module.exports = router;