const express = require("express");
const { isSeller, isAuthenticated, isAdmin } = require("../middleware/auth");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const router = express.Router();
const Product = require("../model/product");
const Order = require("../model/order");
const Shop = require("../model/shop");
const cloudinary = require("cloudinary");
const { ErrorHandler } = require("../utils/ErrorHandler");

// create product
router.post(
  "/create-product",
  catchAsyncErrors(async (req, res, next) => {
    const { shopId, images, designImage, tshirtImage } = req.body;
    const shop = await Shop.findById(shopId);

    if (!shop) {
      return next(new ErrorHandler("Shop Id is invalid!", 400));
    }

    let imagesArray = [];

    if (typeof images === "string") {
      imagesArray.push(images);
    } else {
      imagesArray = images;
    }

    const imagesLinks = await Promise.all(
      imagesArray.map(async (img) => {
        const result = await cloudinary.v2.uploader.upload(img, { folder: "products" });
        return { public_id: result.public_id, url: result.secure_url };
      })
    );

    // Upload the design image
    const designResult = await cloudinary.v2.uploader.upload(designImage, {
      folder: "designs",
    });

    // Generate the final t-shirt image with the design
    const tshirtResult = await cloudinary.v2.uploader.upload(tshirtImage, {
      folder: "tshirts",
      transformation: [
        {
          overlay: designResult.public_id,
          gravity: "center",
          width: 500,
          height: 500,
          crop: "fit",
        },
      ],
    });

    const productData = {
      ...req.body,
      images: imagesLinks,
      designImage: {
        public_id: designResult.public_id,
        url: designResult.secure_url,
      },
      tshirtImage: {
        public_id: tshirtResult.public_id,
        url: tshirtResult.secure_url,
      },
      shop,
    };

    const product = await Product.create(productData);

    res.status(201).json({
      success: true,
      product,
    });
  })
);

// get all products of a shop
router.get(
  "/get-all-products-shop/:id",
  catchAsyncErrors(async (req, res, next) => {
    const products = await Product.find({ shopId: req.params.id });

    res.status(201).json({
      success: true,
      products,
    });
  })
);

// delete product of a shop
router.delete(
  "/delete-shop-product/:id",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return next(new ErrorHandler("Product is not found with this id", 404));
    }

    await Promise.all(
      product.images.map((img) => cloudinary.v2.uploader.destroy(img.public_id))
    );

    await product.remove();

    res.status(200).json({
      success: true,
      message: "Product Deleted successfully!",
    });
  })
);

// get all products
router.get(
  "/get-all-products",
  catchAsyncErrors(async (req, res, next) => {
    const products = await Product.find().sort({ createdAt: -1 });

    res.status(201).json({
      success: true,
      products,
    });
  })
);

// review for a product
router.put(
  "/create-new-review",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    const { user, rating, comment, productId, orderId } = req.body;

    const product = await Product.findById(productId);

    const review = { user, rating, comment, productId };

    const isReviewed = product.reviews.find((rev) => rev.user._id === req.user._id);

    if (isReviewed) {
      product.reviews.forEach((rev) => {
        if (rev.user._id === req.user._id) {
          rev.rating = rating;
          rev.comment = comment;
          rev.user = user;
        }
      });
    } else {
      product.reviews.push(review);
    }

    product.ratings = product.reviews.reduce((acc, rev) => acc + rev.rating, 0) / product.reviews.length;

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

// all products --- for admin
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