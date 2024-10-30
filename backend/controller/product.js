const express = require("express");
const { isSeller, isAuthenticated, isAdmin } = require("../middleware/auth");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const router = express.Router();
const { Product, VALID_COLORS, VALID_PRODUCT_TYPES, VALID_STATUSES = ['pending', 'public', 'rejected'] } = require("../model/product");
const Order = require("../model/order");
const Shop = require("../model/shop");
const cloudinary = require("cloudinary").v2;
const mongoose = require("mongoose");
const ErrorHandler = require("../utils/ErrorHandler");
const multer = require('multer');
const { body, validationResult } = require('express-validator');

console.log('Loading routes...');

const validateProductData = [
  body('DesignTitle').trim().isLength({ min: 3, max: 100 }).withMessage('Design title must be between 3 and 100 characters'),
  body('Description').trim().isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10 and 1000 characters'),
  body('Maintag').trim().isLength({ min: 2, max: 50 }).withMessage('Main tag must be between 2 and 50 characters'),
  body('ProductType').isIn(VALID_PRODUCT_TYPES).withMessage(`Product type must be one of: ${VALID_PRODUCT_TYPES.join(', ')}`),
  body('ProductColor').isIn(VALID_COLORS).withMessage(`Product color must be one of: ${VALID_COLORS.join(', ')}`),
  body('ProductView').isIn(['front', 'back']).withMessage('Product view must be either front or back'),
  body('DesignScale').isFloat({ min: 0.1, max: 5.0 }).withMessage('Design scale must be between 0.1 and 5.0'),
  body('shopId').custom(value => mongoose.Types.ObjectId.isValid(value)).withMessage('Invalid shop ID')
];

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

router.options('/approve-reject-product/:id', (req, res) => {
  res.header('Access-Control-Allow-Methods', 'PUT');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(204);
});

router.post("/create-product", isAuthenticated, isSeller, upload.single('designImage'), validateProductData, catchAsyncErrors(async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const { shopId, DesignTitle, Description, Maintag, Designtags, ProductType, ProductColor, ProductView, DesignScale, availableColors } = req.body;
    const shop = await Shop.findById(shopId);
    if (!shop) {
      return next(new ErrorHandler("Shop not found", 404));
    }
    if (shop.owner.toString() !== req.seller._id.toString()) {
      return next(new ErrorHandler("Unauthorized access to this shop", 403));
    }
    if (!req.file) {
      return next(new ErrorHandler("Design image is required", 400));
    }
    let designImage;
    try {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "products",
        transformation: [{ quality: "auto:best" }, { fetch_format: "auto" }]
      });
      designImage = { public_id: result.public_id, url: result.secure_url };
    } catch (error) {
      return next(new ErrorHandler("Error uploading image to cloud storage", 500));
    }
    const product = await Product.create({
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
    });
    res.status(201).json({
      success: true,
      message: "Product created successfully and is awaiting inspection!",
      product,
    });
  } catch (error) {
    if (req.file) {
      try {
        await cloudinary.uploader.destroy(req.file.filename);
      } catch (cleanupError) {
        console.error("Error cleaning up uploaded file:", cleanupError);
      }
    }
    return next(new ErrorHandler(error.message, 500));
  }
}));

router.put('/approve-reject-product/:id', isAuthenticated, isAdmin("Admin"), catchAsyncErrors(async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new ErrorHandler("Invalid product ID", 400));
    }
    if (!status || !VALID_STATUSES.includes(status)) {
      return next(new ErrorHandler(`Status must be one of: ${VALID_STATUSES.join(', ')}`, 400));
    }
    const product = await Product.findById(id);
    if (!product) {
      return next(new ErrorHandler("Product not found", 404));
    }
    product.status = status;
    if (status === 'rejected') {
      if (!rejectionReason) {
        return next(new ErrorHandler("Rejection reason is required", 400));
      }
      product.rejectionReason = rejectionReason;
    }
    product.lastModified = new Date();
    product.lastModifiedBy = req.user._id;
    await product.save();
    await notifyShopOwner(product, status);
    res.status(200).json({
      success: true,
      message: `Product ${status === 'public' ? 'approved' : 'rejected'} successfully`,
      product
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
}));

router.put("/update-product-design/:id", isAuthenticated, isSeller, upload.single('designImage'), [...validateProductData, body('status').not().exists().withMessage('Status cannot be updated through this endpoint')], catchAsyncErrors(async (req, res, next) => {
  try {
    const { id } = req.params;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
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
      try {
        if (product.designImage?.public_id) {
          await cloudinary.uploader.destroy(product.designImage.public_id);
        }
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "products",
          transformation: [{ quality: "auto:best" }, { fetch_format: "auto" }]
        });
        designImage = { public_id: result.public_id, url: result.secure_url };
      } catch (error) {
        return next(new ErrorHandler("Error updating design image", 500));
      }
    }
    const updateData = {
      ...req.body,
      designImage,
      status: 'pending',
      lastModified: new Date(),
      lastModifiedBy: req.seller._id
    };
    const updatedProduct = await Product.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true });
    res.status(200).json({
      success: true,
      message: "Product design updated successfully and awaiting re-approval",
      product: updatedProduct
    });
  } catch (error) {
    if (req.file) {
      try {
        await cloudinary.uploader.destroy(req.file.filename);
      } catch (cleanupError) {
        console.error("Error cleaning up uploaded file:", cleanupError);
      }
    }
    return next(new ErrorHandler(error.message, 500));
  }
}));

router.put("/create-new-review", isAuthenticated, [
  body('rating').isFloat({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').trim().isLength({ min: 5, max: 500 }).withMessage('Comment must be between 5 and 500 characters'),
  body('productId').custom(value => mongoose.Types.ObjectId.isValid(value)).withMessage('Invalid product ID'),
  body('orderId').custom(value => mongoose.Types.ObjectId.isValid(value)).withMessage('Invalid order ID')
], catchAsyncErrors(async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const { rating, comment, productId, orderId } = req.body;
    const product = await Product.findById(productId);
    if (!product) {
      return next(new ErrorHandler("Product not found", 404));
    }
    const hasOrdered = await Order.findOne({
      _id: orderId,
      "cart.productId": productId,
      "user._id": req.user._id
    });
    if (!hasOrdered) {
      return next(new ErrorHandler("You must purchase this product to review it", 403));
    }
    const review = {
      user: req.user._id,
      name: req.user.name,
      rating: Number(rating),
      comment,
      productId
    };
    const existingReviewIndex = product.reviews.findIndex(
      rev => rev.user.toString() === req.user._id.toString()
    );
    if (existingReviewIndex !== -1) {
      product.reviews[existingReviewIndex] = review;
    } else {
      product.reviews.push(review);
    }
    product.ratings = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;
    await product.save({ validateBeforeSave: false });
    await Order.updateOne(
      { _id: orderId, "cart.productId": productId },
      { $set: { "cart.$.isReviewed": true } }
    );
    res.status(200).json({
      success: true,
      message: "Review added successfully"
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
}));

router.delete("/delete-shop-product/:id", isAuthenticated, isSeller, catchAsyncErrors(async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return next(new ErrorHandler("Invalid product ID", 400));
    }
    const product = await Product.findById(req.params.id);
    if (!product) {
      return next(new ErrorHandler("Product not found", 404));
    }
    const shop = await Shop.findById(product.shopId);
    if (!shop || shop.owner.toString() !== req.seller._id.toString()) {
      return next(new ErrorHandler("Unauthorized access to this product", 403));
    }
    const activeOrders = await Order.countDocuments({
      'cart.productId': product._id,
      status: { $nin: ['delivered', 'cancelled', 'refunded'] }
    });
    if (activeOrders > 0) {
      return next(new ErrorHandler("Cannot delete product with active orders", 400));
    }
    if (product.designImage?.public_id) {
      try {
        await cloudinary.uploader.destroy(product.designImage.public_id);
      } catch (error) {
        console.error('Error deleting image from cloudinary:', error);
      }
    }
    await Product.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      message: "Product deleted successfully!"
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
}));

async function notifyShopOwner(product, status) {
  try {
    const shop = await Shop.findById(product.shopId);
    if (!shop) {
      console.error('Shop not found for notification:', product.shopId);
      return;
    }
    console.log(`Notifying shop owner (${shop.owner}) about product ${product._id} status: ${status}`);
  } catch (error) {
    console.error('Error in notifyShopOwner:', error);
  }
}

function validateProduct(data) {
  const errors = [];
  if (!data.DesignTitle || data.DesignTitle.length < 3) errors.push('Invalid design title');
  if (!data.Description || data.Description.length < 10) errors.push('Invalid description');
  if (!VALID_PRODUCT_TYPES.includes(data.ProductType)) errors.push('Invalid product type');
  if (!VALID_COLORS.includes(data.ProductColor)) errors.push('Invalid product color');
  return errors;
}

module.exports = router;