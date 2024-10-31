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
      }

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
router.put("/approve-reject-product/:id", 
  isAuthenticated, 
  isAdmin("Admin"), 
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

// Update product design route
router.put("/update-product-design/:id",
  isAuthenticated,
  isSeller,
  upload.single('designImage'),
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

      let designImage = product.designImage;
      if (req.file) {
        if (product.designImage?.public_id) {
          await cloudinary.uploader.destroy(product.designImage.public_id);
        }

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

router.get("/get-all-products", catchAsyncErrors(async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    let query = {
      status: 'public'
    };

    // Get total count first
    const totalProducts = await Product.countDocuments(query);

    // Get products
    const products = await Product.find(query)
      .select('-__v')
      .sort(req.query.sort || '-createdAt')
      .skip(skip)
      .limit(limit)
      .populate('shopId', 'name email avatar');

    console.log('Found products:', products.length);

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