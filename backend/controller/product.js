const express = require("express");
const fs = require('fs').promises; 
const path = require('path');
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



(async function createUploadsDir() {
  try {
    await fs.access('uploads');
  } catch {
    await fs.mkdir('uploads', { recursive: true });
    console.log('Created uploads directory');
  }
})().catch(console.error);



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
    .optional()
    .isIn(['front', 'back'])
    .withMessage('Product view must be either front or back'),
  
  body('DesignScale')
    .optional()
    .isFloat({ min: 0.1, max: 5.0 })
    .withMessage('Design scale must be between 0.1 and 5.0'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }
    next();
  }
];



const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload only images.'), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  }
});

// Create uploads directory if it doesn't exist
(async () => {
  try {
    await fs.access('uploads');
  } catch {
    await fs.mkdir('uploads', { recursive: true });
  }
})();

// Product routes
router.post("/create-product", 
  isAuthenticated,
  isSeller,
  upload.single('designImage'),
  validateProductData,
  catchAsyncErrors(async (req, res, next) => {
    try {
      console.log('Request data:', {
        body: req.body,
        file: req.file,
        seller: req.seller?._id
      });

      // Parse design position and tags
      let designPosition = { x: 50, y: 50 };
      try {
        if (req.body.designPosition) {
          designPosition = JSON.parse(req.body.designPosition);
        }
      } catch (e) {
        console.error('Error parsing designPosition:', e);
      }

      let designTags = [];
      try {
        if (req.body.Designtags) {
          designTags = JSON.parse(req.body.Designtags);
        }
      } catch (e) {
        console.error('Error parsing Designtags:', e);
      }

      // Validate required data
      if (!req.file) {
        return next(new ErrorHandler("Design image is required", 400));
      }

      if (!req.body.ProductColor || !VALID_COLORS.includes(req.body.ProductColor)) {
        return next(new ErrorHandler(`Invalid color. Must be one of: ${VALID_COLORS.join(', ')}`, 400));
      }

      // Upload to cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "products",
        transformation: [
          { quality: "auto:best" },
          { fetch_format: "auto" }
        ]
      });

      // Create product data object
      const productData = {
        DesignTitle: req.body.DesignTitle,
        Description: req.body.Description,
        Maintag: req.body.Maintag,
        Designtags: designTags,
        ProductType: req.body.ProductType,
        ProductColor: req.body.ProductColor,
        ProductView: req.body.ProductView || 'front',
        DesignScale: parseFloat(req.body.DesignScale) || 1,
        designPosition,
        shopId: req.seller._id,
        shop: req.seller._id,
        designImage: {
          public_id: result.public_id,
          url: result.secure_url
        },
        availableColors: [req.body.ProductColor],
        status: 'pending',
        createdBy: req.seller._id
      };

      // Create product
      const product = await Product.create(productData);

      // Clean up uploaded file
      if (req.file.path) {
        await fs.unlink(req.file.path).catch(err => 
          console.error('Error deleting file:', err)
        );
      }

      res.status(201).json({
        success: true,
        message: "Product created successfully and awaiting approval",
        product
      });

    } catch (error) {
      // Clean up on error
      if (req.file?.path) {
        await fs.unlink(req.file.path).catch(() => {});
      }
      console.error('Product creation error:', {
        message: error.message,
        stack: error.stack,
        body: req.body
      });
      return next(new ErrorHandler(error.message || "Failed to create product", 500));
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

      // Basic validation
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid product ID"
        });
      }

      // Find and update in one operation
      const updatedProduct = await Product.findByIdAndUpdate(
        id,
        {
          $set: {
            status,
            statusReason: statusReason || '',
            lastModified: new Date(),
            lastModifiedBy: req.user._id
          }
        },
        { 
          new: true,
          runValidators: true,
          maxTimeMS: 20000 // 20 second timeout
        }
      ).lean();

      if (!updatedProduct) {
        return res.status(404).json({
          success: false,
          message: "Product not found"
        });
      }

      res.status(200).json({
        success: true,
        message: `Product ${status} successfully`,
        product: updatedProduct
      });

    } catch (error) {
      console.error("Product approval error:", {
        id: req.params.id,
        error: error.message,
        stack: error.stack
      });

      // Handle specific errors
      if (error.name === 'MongoServerError' && error.code === 50) {
        return res.status(503).json({
          success: false,
          message: "Database operation timed out. Please try again."
        });
      }

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
router.get("/get-all-products", catchAsyncErrors(async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = { status: 'public' };

    // Get total count
    const totalProducts = await Product.countDocuments(query);

    // Get products
    const products = await Product.find(query)
      .populate('shopId', 'name email avatar')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .select('-__v');

    res.status(200).json({
      success: true,
      products,
      currentPage: page,
      totalPages: Math.ceil(totalProducts / limit),
      totalProducts
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    return next(new ErrorHandler(error.message, 500));
  }
}));
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

router.get("/admin/pending-products", // Remove extra api/v2 prefix
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const [totalPending, pendingProducts] = await Promise.all([
        Product.countDocuments({ status: 'pending' }),
        Product.find({ status: 'pending' })
          .populate('shopId', 'name email')
          .sort('-createdAt')
          .lean()
      ]);

      res.status(200).json({
        success: true,
        products: pendingProducts,
        totalPending
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

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