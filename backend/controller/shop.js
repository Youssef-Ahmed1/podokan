const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const sendMail = require("../utils/sendMail");
const Shop = require("../model/shop");
const { isAuthenticated, isSeller, isAdmin } = require("../middleware/auth");
const cloudinary = require("cloudinary");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ErrorHandler = require("../utils/ErrorHandler");
const sendShopToken = require("../utils/shopToken");

// Create shop
router.post("/create-shop", catchAsyncErrors(async (req, res, next) => {
  try {
    const { email, name, password, address, phoneNumber, zipCode, avatar } = req.body;

    const existingSeller = await Shop.findOne({ email });
    if (existingSeller) {
      return next(new ErrorHandler("Seller already exists", 400));
    }

    let avatarData = {};
    if (avatar) {
      const myCloud = await cloudinary.v2.uploader.upload(avatar, {
        folder: "avatars",
        width: 150,
        crop: "scale"
      });
      avatarData = {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      };
    }

    const seller = {
      name,
      email,
      password,
      avatar: avatarData,
      address,
      phoneNumber,
      zipCode,
    };

    const activationToken = createActivationToken(seller);
    const activationUrl = `https://testpodokan.store/seller/activation/${activationToken}`;

    try {
      await sendMail({
        email: seller.email,
        subject: "Activate your Shop",
        message: `Hello ${seller.name}, please click on the link to activate your shop: ${activationUrl}`,
      });

      res.status(201).json({
        success: true,
        message: `Please check your email: ${seller.email} to activate your shop!`,
      });
    } catch (error) {
      return next(new ErrorHandler(`Email send error: ${error.message}`, 500));
    }
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
}));

// Activation token creation
const createActivationToken = (seller) => {
  return jwt.sign(seller, process.env.ACTIVATION_SECRET, {
    expiresIn: "5m",
  });
};

// Activate shop
router.post("/activation", catchAsyncErrors(async (req, res, next) => {
  try {
    const { activation_token } = req.body;

    const newSeller = jwt.verify(activation_token, process.env.ACTIVATION_SECRET);
    if (!newSeller) {
      return next(new ErrorHandler("Invalid token", 400));
    }

    const { name, email, password, avatar, zipCode, address, phoneNumber } = newSeller;

    let seller = await Shop.findOne({ email });
    if (seller) {
      return next(new ErrorHandler("Seller already exists", 400));
    }

    seller = await Shop.create({
      name,
      email,
      avatar,
      password,
      zipCode,
      address,
      phoneNumber,
    });

    sendShopToken(seller, 201, res);
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
}));

// Login shop
router.post("/login-shop", catchAsyncErrors(async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new ErrorHandler("Please provide all fields!", 400));
    }

    const seller = await Shop.findOne({ email }).select("+password");

    if (!seller) {
      return next(new ErrorHandler("Seller doesn't exist!", 400));
    }

    const isPasswordValid = await seller.comparePassword(password);

    if (!isPasswordValid) {
      return next(new ErrorHandler("Invalid credentials", 400));
    }

    // Check if seller is approved
    if (seller.status !== "Approved") {
      return next(new ErrorHandler("Seller account is not approved yet", 403));
    }

    const token = seller.getJwtToken();

    const cookieOptions = {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      domain: process.env.NODE_ENV === 'PRODUCTION' ? '.testpodokan.store' : 'localhost'
  };
  
  // For user login
  res.cookie('token', token, cookieOptions)
     .header('Authorization', `Bearer ${token}`)
     .json({
          success: true,
          token,
          user
     });
  
  // For seller login
  res.cookie('seller_token', token, cookieOptions)
     .header('Seller-Authorization', `Bearer ${token}`)
     .json({
          success: true,
          token,
          seller
     });
  

    res.status(200)
      .cookie("seller_token", token, cookieOptions)
      .json({
        success: true,
        token,
        seller: {
          _id: seller._id,
          name: seller.name,
          email: seller.email,
          role: 'seller',
          avatar: seller.avatar,
          status: seller.status
        }
      });

  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
}));


// Get seller details
router.get("/getSeller", isSeller, catchAsyncErrors(async (req, res, next) => {
  try {
    const seller = await Shop.findById(req.seller._id);
    if (!seller) {
      return next(new ErrorHandler("Seller not found", 404));
    }

    res.status(200).json({
      success: true,
      seller,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
}));

// Logout shop
router.get("/logout", catchAsyncErrors(async (req, res, next) => {
  try {
    res.cookie("seller_token", "", {
      expires: new Date(0),
      httpOnly: true,
      sameSite: "none",
      secure: true,
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully!",
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
}));

// Get shop info
router.get("/get-shop-info/:id", catchAsyncErrors(async (req, res, next) => {
  try {
    const shop = await Shop.findById(req.params.id)
      .select('-password -createdAt -updatedAt -__v');
    
    if (!shop) {
      return next(new ErrorHandler("Shop not found", 404));
    }

    res.status(200).json({
      success: true,
      shop,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
}));

// Update shop avatar
router.put("/update-shop-avatar", isSeller, catchAsyncErrors(async (req, res, next) => {
  try {
    const seller = await Shop.findById(req.seller._id);
    if (!seller) {
      return next(new ErrorHandler("Seller not found", 404));
    }

    // Delete old avatar
    if (seller.avatar && seller.avatar.public_id) {
      await cloudinary.v2.uploader.destroy(seller.avatar.public_id);
    }

    const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
      folder: "avatars",
      width: 150,
      crop: "scale",
    });

    seller.avatar = {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    };

    await seller.save();

    res.status(200).json({
      success: true,
      seller,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
}));
router.put(
  "/admin-update-seller-status/:id",
  isAuthenticated,
  isAdmin,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { status } = req.body;
      const seller = await Shop.findById(req.params.id);

      if (!seller) {
        return next(new ErrorHandler("Seller not found", 404));
      }

      seller.status = status;
      await seller.save();

      res.status(200).json({
        success: true,
        message: "Seller status updated successfully",
        seller,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);
// Update seller info
router.put("/update-seller-info", isSeller, catchAsyncErrors(async (req, res, next) => {
  try {
    const { name, description, address, phoneNumber, zipCode } = req.body;

    const seller = await Shop.findById(req.seller._id);
    if (!seller) {
      return next(new ErrorHandler("Seller not found", 404));
    }

    if (name) seller.name = name;
    if (description) seller.description = description;
    if (address) seller.address = address;
    if (phoneNumber) seller.phoneNumber = phoneNumber;
    if (zipCode) seller.zipCode = zipCode;

    await seller.save();

    res.status(200).json({
      success: true,
      seller,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
}));

// Get all sellers (admin)
router.get(
  "/admin-all-sellers",
  isAuthenticated,
  isAdmin,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const sellers = await Shop.find()
        .select('-password')
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        sellers,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);
// Delete seller (admin)
router.delete("/delete-seller/:id", isAuthenticated, isAdmin, catchAsyncErrors(async (req, res, next) => {
  try {
    const seller = await Shop.findById(req.params.id);
    if (!seller) {
      return next(new ErrorHandler("Seller not found", 404));
    }

    // Delete seller avatar from cloudinary
    if (seller.avatar && seller.avatar.public_id) {
      await cloudinary.v2.uploader.destroy(seller.avatar.public_id);
    }

    await Shop.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Seller deleted successfully",
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
}));

// Update seller withdraw methods
router.put("/update-payment-methods", isSeller, catchAsyncErrors(async (req, res, next) => {
  try {
    const { withdrawMethod } = req.body;
    
    const seller = await Shop.findByIdAndUpdate(
      req.seller._id,
      { withdrawMethod },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      seller,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
}));

// Delete seller withdraw method
router.delete("/delete-withdraw-method", isSeller, catchAsyncErrors(async (req, res, next) => {
  try {
    const seller = await Shop.findById(req.seller._id);
    if (!seller) {
      return next(new ErrorHandler("Seller not found", 404));
    }

    seller.withdrawMethod = null;
    await seller.save();

    res.status(200).json({
      success: true,
      seller,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
}));

module.exports = router;