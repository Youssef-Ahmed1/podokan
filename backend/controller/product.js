const express = require("express");
const { isSeller, isAuthenticated, isAdmin } = require("../middleware/auth");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const router = express.Router();
const Product = require("../model/product");
const Order = require("../model/order");
const Shop = require("../model/shop");
const  useSelector = require('react-redux');
const cloudinary = require("cloudinary").v2
const mongoose = require("mongoose");  // Ensure mongoose is imported
const ErrorHandler = require("../utils/ErrorHandler");
router.post(
  "/create-product",
  catchAsyncErrors(async (req, res, next) => {
    
    const { shopId, DesignTitle, Description, Maintag, Designtags, MatureContent, ProductType, ProductColor, ProductView, DesignScale } = req.body;

    const designImage = req.files.designImage ? req.files.designImage[0] : null;
    const tshirtImage = req.files.tshirtImage ? req.files.tshirtImage[0] : null;
    
    if (!designImage || !tshirtImage) {
      return next(new ErrorHandler("Both designImage and tshirtImage are required", 400));
    }
    upload.fields([{ name: 'designImage' }, { name: 'tshirtImage' }]),
    // Log the received shopId for debugging
    console.log("Received shopId:", shopId);

    // Validate shopId
    if (!shopId || !mongoose.Types.ObjectId.isValid(shopId)) {
      return next(new ErrorHandler("Invalid shop Id", 400));
    }

    // Find the shop by shopId
    const shop = await Shop.findById(shopId);
    if (!shop) {
      return next(new ErrorHandler("Shop not found", 404));
    }



// In your component
const { isLoading, error, success } = useSelector((state) => state.product);

useEffect(() => {
  if (error) {
    toast.error(error);
    dispatch({ type: "clearErrors" });
  }
  if (success) {
    toast.success("Product created successfully!");
    navigate("/dashboard");
    dispatch({ type: "resetProductSuccess" });
  }
}, [dispatch, error, success, navigate]);


    let imagesArray = [];

    // Handle images input
    if (typeof images === "string") {
      imagesArray.push(images);
    } else if (Array.isArray(images)) {
      imagesArray = images;
    } else {
      return next(new ErrorHandler("Images should be a string or an array", 400));
    }

    // Upload images to Cloudinary
    const imagesLinks = await Promise.all(
      imagesArray.map(async (img) => {
        try {
          const result = await cloudinary.uploader.upload(img, { folder: "products" });
          return { public_id: result.public_id, url: result.secure_url };
        } catch (error) {
          return next(new ErrorHandler("Image upload failed", 500));
        }
      })
    );

    try {
      const { designImage, tshirtImage } = req.files;
      const designResult = await cloudinary.uploader.upload(designImage.tempFilePath, {
        folder: "designs",
      });
  
      // Generate the final t-shirt image with the design
      const tshirtResult = await cloudinary.uploader.upload(tshirtImage.tempFilePath, {
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
// update product design
router.put(
  "/update-product-design/:id",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const { newDesignImage } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new ErrorHandler("Invalid product Id", 400));
    }

    const product = await Product.findById(id);

    if (!product) {
      return next(new ErrorHandler("Product not found", 404));
    }

    // Delete old design image from Cloudinary
    if (product.designImage && product.designImage.public_id) {
      await cloudinary.uploader.destroy(product.designImage.public_id);
    }

    // Upload new design image
    const designResult = await cloudinary.uploader.upload(newDesignImage, {
      folder: "designs",
    });

    // Update product with new design
    product.designImage = {
      public_id: designResult.public_id,
      url: designResult.secure_url,
    };

    await product.save();

    res.status(200).json({
      success: true,
      message: "Product design updated successfully!",
    });
  })
);

      // Create product data
      const productData = {
        DesignTitle,
        Description,
        Maintag,
        Designtags,
        MatureContent,
        ProductType,
        ProductColor,
        ProductView,
        DesignScale,
        designImage: {
          public_id: designResult.public_id,
          url: designResult.secure_url,
        },
        tshirtImage: {
          public_id: tshirtResult.public_id,
          url: tshirtResult.secure_url,
        },
        shop: shop._id,
        shopId,
        status: 'pending',
      };
      // Create the product
      const product = await Product.create(productData);
            res.status(201).json({
        success: true,
        product,
      });
    } catch (error) {
      return next(new ErrorHandler("Image processing failed", 500));
    }
  })
);


// get all products of a shop
router.get(
  "/get-all-products-shop/:id",
  catchAsyncErrors(async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return next(new ErrorHandler("Invalid shop Id", 400));
    }

    const products = await Product.find({ shopId: req.params.id });

    res.status(201).json({
      success: true,
      product: createdProduct,
    });
  })
);


// delete product of a shop
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

    res.status(200).json({
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