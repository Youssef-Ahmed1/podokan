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
const upload = multer({ dest: 'uploads/' });
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;




router.options('/approve-reject-product/:id', (req, res) => {
  res.header('Access-Control-Allow-Methods', 'PUT');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(204);
});
router.post(
  "/create-product",
  upload.single('designImage'),
  catchAsyncErrors(async (req, res, next) => {
    try {
      console.log("Received request body:", req.body);
      console.log("Received file:", req.file);

      const { 
        shopId, 
        DesignTitle, 
        Description, 
        Maintag, 
        Designtags, 
        ProductType, 
        ProductColor, 
        ProductView, 
        DesignScale 
      } = req.body;

      if (!shopId) {
        return next(new ErrorHandler("Shop ID is required", 400));
      }

      if (!mongoose.Types.ObjectId.isValid(shopId)) {
        return next(new ErrorHandler("Invalid shop Id", 400));
      }

      const shop = await Shop.findById(shopId);
      if (!shop) {
        return next(new ErrorHandler("Shop not found", 404));
      }

      if (!req.file) {
        return next(new ErrorHandler("Design image is required", 400));
      }

      // Get the base image URL from Cloudinary
      const baseImageUrl = `https://res.cloudinary.com/dkot9tyjm/image/upload/v1724807956/shirts/${ProductType}-${ProductColor}-${ProductView}.png`;

      // Download the base image
      const baseImageResponse = await fetch(baseImageUrl);
      const baseImageBuffer = await baseImageResponse.buffer();

      // Load the base image with Sharp
      const baseImage = sharp(baseImageBuffer);
      const baseMetadata = await baseImage.metadata();

      // Resize and position the design
      const designBuffer = await sharp(req.file.buffer)
        .resize({ 
          width: Math.round(baseMetadata.width * 0.5 * DesignScale),
          height: Math.round(baseMetadata.height * 0.5 * DesignScale),
          fit: 'inside',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .toBuffer();

      // Calculate position to place the design
      const left = Math.round((baseMetadata.width - (baseMetadata.width * 0.5 * DesignScale)) / 2);
      const top = Math.round((baseMetadata.height - (baseMetadata.height * 0.5 * DesignScale)) / 2);

      // Composite the images
      const outputBuffer = await baseImage
        .composite([
          { 
            input: designBuffer,
            top: top,
            left: left
          }
        ])
        .toBuffer();

      // Upload the combined image to Cloudinary
      const result = await cloudinary.uploader.upload(`data:image/png;base64,${outputBuffer.toString('base64')}`, {
        folder: "products",
      });

      const productData = {
        DesignTitle,
        Description,
        Maintag,
        Designtags,
        ProductType,
        ProductColor,
        ProductView,
        DesignScale: parseFloat(DesignScale),
        designImage: {
          public_id: result.public_id,
          url: result.secure_url,
        },
        shopId,
        status: 'pending',
      };

      const product = await Product.create(productData);

      res.status(201).json({
        success: true,
        message: "Product created successfully and is awaiting inspection!",
        product,
      });
    } catch (error) {
      console.error("Error in create-product route:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  })
);
  console.log("PUT request received for product approval/rejection");



  router.put('/approve-reject-product/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { status, rejectionReason, ...updates } = req.body;
  
      console.log("Received request to update product:", id);
      console.log("Status:", status);
      console.log("Rejection Reason:", rejectionReason);
      console.log("Updates:", updates);
  
      // Ensure originalPrice is a number
      const parsedOriginalPrice = parseFloat(updates.originalPrice);
      if (isNaN(parsedOriginalPrice) || parsedOriginalPrice <= 0) {
        return res.status(400).json({ success: false, message: "Invalid original price" });
      }
  
      const updatedProduct = await Product.findByIdAndUpdate(
        id,
        { 
          status, 
          rejectionReason, 
          originalPrice: parsedOriginalPrice,
          discountPrice: parseFloat(updates.discountPrice) || parsedOriginalPrice,
          ...updates
        },
        { new: true, runValidators: true }
      );
  
      if (!updatedProduct) {
        return res.status(404).json({ success: false, message: "Product not found" });
      }
  
      console.log("Updated product:", updatedProduct);
  
      res.status(200).json({ success: true, message: "Product updated successfully", product: updatedProduct });
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
router.put(
  "/update-product-design/:id",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new ErrorHandler("Invalid product Id", 400));
    }

    const product = await Product.findById(id);

    if (!product) {
      return next(new ErrorHandler("Product not found", 404));
    }

  

    await product.save();

    res.status(200).json({
      success: true,
      message: "Product design updated successfully!",
    });
  })
);

router.get(
  "/get-all-products-shop/:id",
  catchAsyncErrors(async (req, res, next) => {
    const products = await Product.find({ 
      shopId: req.params.id,
      status: { $in: [ 'public', 'restricted'] }
    });

    res.status(200).json({
      success: true,
      products,
    });
  })
);

router.get(
  "/admin/pending-products",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    const pendingProducts = await Product.find({ status: 'pending' })
      .select('DesignTitle Description Maintag Designtags  ProductType ProductColor ProductView DesignScale designImage status');
    
    console.log("Pending products:", pendingProducts);
    
    res.status(200).json({
      success: true,
      products: pendingProducts,
    });
  })
);



router.delete(
  "/delete-shop-product/:id",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return next(new ErrorHandler("Invalid product Id", 400));
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return next(new ErrorHandler("Product is not found with this id", 404));
    }

    await Promise.all(
      product.images.map((img) => cloudinary.uploader.destroy(img.public_id))
    );

    await product.remove();

    res.status(200).json({
      success: true,
      message: "Product Deleted successfully!",
    });
  })
);

router.get("/get-all-products", async (req, res) => {
  try {
    const products = await Product.find({
      $or: [
        { status: "public" },
        { status: "restricted" }
      ]
    });
    res.status(200).json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.put(
  "/create-new-review",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    const { user, rating, comment, productId, orderId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return next(new ErrorHandler("Invalid product Id", 400));
    }

    const product = await Product.findById(productId);

    if (!product) {
      return next(new ErrorHandler("Product not found", 404));
    }

    const review = { user, rating, comment, productId };

    const isReviewed = product.reviews.find((rev) => rev.user.equals(req.user._id));

    if (isReviewed) {
      product.reviews.forEach((rev) => {
        if (rev.user.equals(req.user._id)) {
          rev.rating = rating;
          rev.comment = comment;
          rev.user = user;
        }
      });
    } else {
      product.reviews.push(review);
    }

    product.ratings =
      product.reviews.reduce((acc, rev) => acc + rev.rating, 0) / product.reviews.length;

    await product.save({ validateBeforeSave: false });

    await Order.findByIdAndUpdate(
      orderId,
      { $set: { "cart.$[elem].isReviewed": true } },
      { arrayFilters: [{ "elem._id": productId }], new: true }
    );

    res.status(200).json({
      success: true,
      message: "Reviewed successfully!",
    });
  })
);

router.get(
  "/admin-all-products",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    const products = await Product.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      products,
    });
  })
);

module.exports = router;
