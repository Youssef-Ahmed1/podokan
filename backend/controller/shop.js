const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const sendMail = require("../utils/sendMail");
const Shop = require("../model/shop");
const { isAuthenticated, isSeller, isAdmin } = require("../middleware/auth");
const cloudinary = require("cloudinary");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ErrorHandler = require("../utils/ErrorHandler");
const sendShopToken = require("../utils/shopToken"); // Ensure this path is correct
const mongoose = require("mongoose"); // Import mongoose

router.post(
  "/create-shop",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { email, name, password, avatar, address, phoneNumber, zipCode } =
        req.body;
      if (
        !email ||
        !name ||
        !password ||
        !avatar ||
        !address ||
        !phoneNumber ||
        !zipCode
      ) {
        return next(
          new ErrorHandler("Please provide all required shop information", 400)
        );
      }

      const sellerEmail = await Shop.findOne({ email: email.toLowerCase() });
      if (sellerEmail) {
        return next(new ErrorHandler("Shop email already exists", 400));
      }

      let myCloud;
      try {
        myCloud = await cloudinary.v2.uploader.upload(avatar, {
          folder: "avatars",
        });
      } catch (uploadError) {
        console.error("Shop avatar upload error:", uploadError);
        return next(new ErrorHandler("Failed to upload shop avatar", 500));
      }

      const seller = {
        name: name.trim(),
        email: email.toLowerCase(),
        password,
        avatar: { public_id: myCloud.public_id, url: myCloud.secure_url },
        address: address.trim(),
        phoneNumber,
        zipCode,
        status: "Pending",
      };

      const activationToken = createActivationToken(seller);
      const activationUrl = `${
        process.env.FRONTEND_URL || "https://testpodokan.store"
      }/seller/activation/${activationToken}`;

      try {
        await sendMail({
          email: seller.email,
          subject: "Activate your PODokan Shop",
          html: `<div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px;"> <h2 style="color: #333; text-align: center;">Activate Your PODokan Shop!</h2> <p>Hello ${seller.name},</p> <p>Thank you for registering your shop. Please click the button below to activate your account:</p> <div style="text-align: center; margin: 25px 0;"> <a href="${activationUrl}" style="background-color: #5e72e4; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-size: 16px;">Activate Shop</a> </div> <p>If the button doesn't work, copy and paste this link into your browser:</p> <p style="word-break: break-all; color: #555;">${activationUrl}</p> <p style="color: #888; font-size: 12px;">This link will expire in 5 minutes.</p> <p>Thanks,<br/>The PODokan Team</p> </div>`,
        });
        res.status(201).json({
          success: true,
          message: `Activation email sent to ${seller.email}. Please check your inbox!`,
        });
      } catch (error) {
        console.error("Shop activation email send error:", error);
        if (myCloud)
          await cloudinary.v2.uploader
            .destroy(myCloud.public_id)
            .catch((err) =>
              console.error("Failed to destroy shop avatar on email fail:", err)
            );
        return next(new ErrorHandler("Failed to send activation email", 500));
      }
    } catch (error) {
      console.error("Create shop error:", error);
      return next(
        new ErrorHandler(error.message || "Shop creation failed", 400)
      );
    }
  })
);

const createActivationToken = (seller) => {
  return jwt.sign(seller, process.env.ACTIVATION_SECRET, { expiresIn: "5m" });
};

router.post(
  "/activation",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { activation_token } = req.body;
      if (!activation_token)
        return next(new ErrorHandler("Activation token missing", 400));

      const newSeller = jwt.verify(
        activation_token,
        process.env.ACTIVATION_SECRET
      );
      if (!newSeller)
        return next(new ErrorHandler("Invalid or expired token", 400));

      const { name, email, password, avatar, zipCode, address, phoneNumber } =
        newSeller;
      if (
        !name ||
        !email ||
        !password ||
        !avatar ||
        !zipCode ||
        !address ||
        !phoneNumber
      ) {
        return next(new ErrorHandler("Token data incomplete", 400));
      }

      let seller = await Shop.findOne({ email: email.toLowerCase() });
      if (seller)
        return next(new ErrorHandler("Shop email already registered", 400));

      seller = await Shop.create({
        name,
        email: email.toLowerCase(),
        avatar,
        password,
        zipCode,
        address,
        phoneNumber,
        status: "Active",
      });

      // *** Ensure sendShopToken is called correctly ***
      if (typeof sendShopToken !== "function") {
        console.error(
          "CRITICAL: sendShopToken is not loaded correctly in shop /activation"
        );
        return next(
          new ErrorHandler("Internal server error during shop activation.", 500)
        );
      }
      sendShopToken(seller, 201, res);
    } catch (error) {
      if (
        error.name === "JsonWebTokenError" ||
        error.name === "TokenExpiredError"
      ) {
        return next(
          new ErrorHandler("Invalid or expired activation token.", 400)
        );
      }
      console.error("Shop Activation Error:", error);
      return next(
        new ErrorHandler(error.message || "Shop activation failed", 500)
      );
    }
  })
);

router.post(
  "/login-shop",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { email, password } = req.body;
      if (!email || !password)
        return next(new ErrorHandler("Please provide email and password", 400));

      const shop = await Shop.findOne({ email: email.toLowerCase() }).select(
        "+password"
      );
      if (!shop) return next(new ErrorHandler("Invalid credentials", 401));

      const isPasswordValid = await shop.comparePassword(password);
      if (!isPasswordValid)
        return next(new ErrorHandler("Invalid credentials", 401));

      const allowedStatus = ["active", "approved"]; // Case-insensitive check
      if (!allowedStatus.includes((shop.status || "").toLowerCase())) {
        return next(
          new ErrorHandler(
            `Your seller account status is '${shop.status}'. Access denied.`,
            403
          )
        );
      }

      // *** Ensure sendShopToken is called correctly ***
      if (typeof sendShopToken !== "function") {
        console.error(
          "CRITICAL: sendShopToken is not loaded correctly in /login-shop"
        );
        return next(
          new ErrorHandler("Internal server error during shop login.", 500)
        );
      }
      sendShopToken(shop, 200, res); // Use the utility function
    } catch (error) {
      console.error("Shop login error:", error);
      return next(new ErrorHandler(error.message || "Login failed", 500));
    }
  })
);

router.get(
  "/getSeller",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const seller = await Shop.findById(req.seller._id).select("-password");
      if (!seller) return next(new ErrorHandler("Seller not found", 404));
      res.status(200).json({ success: true, seller });
    } catch (error) {
      console.error("Get seller error:", error);
      return next(new ErrorHandler("Failed to get seller information", 500));
    }
  })
);

router.get(
  "/logout",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const AuthUtils = require("../utils/authUtils");
      // Clear the seller token cookie
      res.cookie("seller_token", "", {
        ...AuthUtils.getCookieOptions("seller"),
        expires: new Date(0),
      });
      res
        .status(200)
        .json({ success: true, message: "Shop logout successful!" });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

router.get(
  "/get-shop-info/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const shopId = req.params.id;
      if (!mongoose.Types.ObjectId.isValid(shopId))
        return next(new ErrorHandler("Invalid shop ID", 400));
      const shop = await Shop.findById(shopId).select("-password");
      if (!shop) return next(new ErrorHandler("Shop not found", 404));
      res.status(200).json({ success: true, shop });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

router.put(
  "/update-shop-avatar",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      if (!req.body.avatar || typeof req.body.avatar !== "string") {
        return next(new ErrorHandler("Avatar data missing or invalid", 400));
      }
      let existsSeller = await Shop.findById(req.seller._id);
      if (!existsSeller) return next(new ErrorHandler("Seller not found", 404));

      if (existsSeller.avatar && existsSeller.avatar.public_id) {
        await cloudinary.v2.uploader
          .destroy(existsSeller.avatar.public_id)
          .catch((err) =>
            console.error("Failed to destroy old shop avatar:", err)
          );
      }

      const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
        folder: "avatars",
        width: 150,
        crop: "scale",
      });
      existsSeller.avatar = {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      };
      await existsSeller.save();

      const sellerResponse = existsSeller.toObject();
      delete sellerResponse.password;
      res.status(200).json({ success: true, seller: sellerResponse });
    } catch (error) {
      console.error("Shop avatar update error:", error);
      return next(
        new ErrorHandler(error.message || "Failed to update shop avatar", 500)
      );
    }
  })
);

router.put(
  "/update-seller-info",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { name, description, address, phoneNumber, zipCode } = req.body;
      if (!name || !address || !phoneNumber || !zipCode) {
        return next(
          new ErrorHandler(
            "Name, address, phone number, and zip code are required",
            400
          )
        );
      }

      const shop = await Shop.findById(req.seller._id);
      if (!shop) return next(new ErrorHandler("Seller not found", 404));

      shop.name = name.trim();
      shop.description = description || shop.description;
      shop.address = address.trim();
      shop.phoneNumber = phoneNumber;
      shop.zipCode = zipCode;
      await shop.save();

      const shopResponse = shop.toObject();
      delete shopResponse.password;
      res.status(200).json({ success: true, shop: shopResponse });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

router.get(
  "/admin-all-sellers",
  isAuthenticated,
  isAdmin,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const [sellersCount, sellers] = await Promise.all([
        Shop.countDocuments(),
        Shop.find().select("-password -__v").sort({ createdAt: -1 }).lean(),
      ]);
      res.status(200).json({ success: true, sellers, sellersCount });
    } catch (error) {
      console.error("Admin sellers fetch error:", error);
      return next(
        new ErrorHandler(error.message || "Failed to fetch sellers", 500)
      );
    }
  })
);

router.delete(
  "/delete-seller/:id",
  isAuthenticated,
  isAdmin,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const sellerId = req.params.id;
      if (!mongoose.Types.ObjectId.isValid(sellerId))
        return next(new ErrorHandler("Invalid seller ID", 400));
      const seller = await Shop.findById(sellerId);
      if (!seller) return next(new ErrorHandler("Seller not found", 404));

      if (seller.avatar && seller.avatar.public_id) {
        await cloudinary.v2.uploader
          .destroy(seller.avatar.public_id)
          .catch((err) =>
            console.error("Failed to delete seller avatar:", err)
          );
      }
      await Shop.findByIdAndDelete(sellerId);
      res
        .status(200)
        .json({ success: true, message: "Seller deleted successfully" });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

router.put(
  "/update-payment-methods",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { withdrawMethod } = req.body;
      if (!withdrawMethod)
        return next(new ErrorHandler("Withdraw method data is required", 400));

      const seller = await Shop.findByIdAndUpdate(
        req.seller._id,
        { withdrawMethod },
        { new: true, runValidators: true }
      ).select("-password");
      if (!seller) return next(new ErrorHandler("Seller not found", 404));
      res.status(200).json({ success: true, seller });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

router.delete(
  "/delete-withdraw-method/",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const seller = await Shop.findById(req.seller._id);
      if (!seller) return next(new ErrorHandler("Seller not found", 404));
      seller.withdrawMethod = undefined;
      await seller.save();
      const sellerResponse = seller.toObject();
      delete sellerResponse.password;
      res.status(200).json({ success: true, seller: sellerResponse });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

module.exports = router;