const express = require("express");
const User = require("../model/user");
const sendMail = require("../utils/sendMail"); // Corrected path if needed
const router = express.Router();
const cloudinary = require("cloudinary");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const jwt = require("jsonwebtoken");
const sendToken = require("../utils/jwtToken"); // Corrected path if needed
const { isAuthenticated, isAdmin } = require("../middleware/auth"); // Corrected path if needed

router.post("/create-user", async (req, res, next) => {
  try {
    const { name, email, password, avatar } = req.body;
    if (!name || !email || !password || !avatar) {
      return next(new ErrorHandler("Please provide all required fields", 400));
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return next(new ErrorHandler("Email already registered", 400));
    }

    let uploadedImage;
    try {
      uploadedImage = await cloudinary.v2.uploader.upload(avatar, {
        folder: "avatars",
        width: 150,
        crop: "scale",
      });
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      return next(new ErrorHandler("Failed to upload profile picture", 400));
    }

    const userData = {
      name: name.trim(),
      email: email.toLowerCase(),
      password,
      avatar: {
        public_id: uploadedImage.public_id,
        url: uploadedImage.secure_url,
      },
    };
    const activationToken = createActivationToken(userData);
    const activationUrl = `${
      process.env.FRONTEND_URL || "https://testpodokan.store"
    }/activation/${activationToken}`; // Use env var for frontend URL

    try {
      await sendMail({
        email: userData.email,
        subject: "Activate your PODokan Account",
        html: `<div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px;"> <h2 style="color: #333; text-align: center;">Welcome to PODokan!</h2> <p>Hello ${userData.name},</p> <p>Thank you for registering. Please click the button below to activate your account:</p> <div style="text-align: center; margin: 25px 0;"> <a href="${activationUrl}" style="background-color: #5e72e4; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-size: 16px;">Activate Account</a> </div> <p>If the button doesn't work, copy and paste this link into your browser:</p> <p style="word-break: break-all; color: #555;">${activationUrl}</p> <p style="color: #888; font-size: 12px;">This link will expire in 5 minutes.</p> <p>Thanks,<br/>The PODokan Team</p> </div>`,
      });
      return res
        .status(201)
        .json({
          success: true,
          message: `Activation email sent to ${userData.email}. Please check your inbox.`,
        });
    } catch (error) {
      console.error("Email send error:", error);
      if (uploadedImage)
        await cloudinary.v2.uploader
          .destroy(uploadedImage.public_id)
          .catch((err) =>
            console.error(
              "Failed to destroy uploaded avatar on email fail:",
              err
            )
          );
      return next(new ErrorHandler("Failed to send activation email", 500));
    }
  } catch (error) {
    console.error("Registration error:", error);
    return next(new ErrorHandler(error.message || "Registration failed", 500));
  }
});

const createActivationToken = (user) => {
  return jwt.sign(user, process.env.ACTIVATION_SECRET, { expiresIn: "5m" });
};

router.post(
  "/activation",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { activation_token } = req.body;
      if (!activation_token)
        return next(new ErrorHandler("Activation token missing", 400));

      const newUser = jwt.verify(
        activation_token,
        process.env.ACTIVATION_SECRET
      );
      if (!newUser)
        return next(new ErrorHandler("Invalid or expired token", 400));

      const { name, email, password, avatar } = newUser;
      if (!name || !email || !password || !avatar)
        return next(new ErrorHandler("Token data incomplete", 400));

      let user = await User.findOne({ email });
      if (user) return next(new ErrorHandler("User already exists", 400));

      user = await User.create({ name, email, avatar, password });

      // *** Use sendToken here ***
      sendToken(user, 201, res);
    } catch (error) {
      if (
        error.name === "JsonWebTokenError" ||
        error.name === "TokenExpiredError"
      ) {
        return next(
          new ErrorHandler("Invalid or expired activation token.", 400)
        );
      }
      console.error("Activation Error:", error);
      return next(new ErrorHandler(error.message || "Activation failed", 500));
    }
  })
);

router.post(
  "/login-user",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { email, password } = req.body;
      if (!email || !password)
        return next(new ErrorHandler("Please provide email and password", 400));

      const user = await User.findOne({ email: email.toLowerCase() }).select(
        "+password"
      );
      if (!user) return next(new ErrorHandler("Invalid credentials", 401));

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid)
        return next(new ErrorHandler("Invalid credentials", 401));

      // *** Use sendToken here ***
      sendToken(user, 200, res);
    } catch (error) {
      console.error("Login error:", error);
      return next(new ErrorHandler(error.message || "Login failed", 500));
    }
  })
);

router.get(
  "/getuser",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      // req.user is populated by isAuthenticated middleware
      const user = await User.findById(req.user._id).select("-password");
      if (!user) return next(new ErrorHandler("User not found", 404));
      res.status(200).json({ success: true, user });
    } catch (error) {
      console.error("Get user error:", error);
      return next(new ErrorHandler("Failed to get user information", 500));
    }
  })
);

router.get(
  "/logout",
  catchAsyncErrors(async (req, res, next) => {
    try {
      // Use AuthUtils to get standard cookie options for clearing
      const AuthUtils = require("../utils/authUtils"); // Assuming path
      res.cookie("token", "", {
        ...AuthUtils.getCookieOptions(),
        expires: new Date(0),
      });
      res
        .status(200)
        .json({ success: true, message: "Logged out successfully!" });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

router.put(
  "/update-user-info",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { email, password, phoneNumber, name } = req.body;
      if (!email || !password || !name)
        return next(
          new ErrorHandler(
            "Name, email, and current password are required",
            400
          )
        );

      // Find user by ID from token, select password for comparison
      const user = await User.findById(req.user.id).select("+password");
      if (!user) return next(new ErrorHandler("User not found", 404));

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid)
        return next(new ErrorHandler("Incorrect password", 401));

      // Check if email is changing and if the new email already exists
      if (email.toLowerCase() !== user.email) {
        const emailExists = await User.findOne({ email: email.toLowerCase() });
        if (emailExists)
          return next(new ErrorHandler("Email already in use", 400));
        user.email = email.toLowerCase();
      }

      user.name = name.trim();
      user.phoneNumber = phoneNumber || user.phoneNumber; // Update only if provided
      await user.save();

      // Exclude password from response
      const userResponse = user.toObject();
      delete userResponse.password;

      res.status(200).json({ success: true, user: userResponse });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

router.put(
  "/update-avatar",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      if (!req.body.avatar || typeof req.body.avatar !== "string") {
        return next(new ErrorHandler("Avatar data missing or invalid", 400));
      }

      let existsUser = await User.findById(req.user.id);
      if (!existsUser) return next(new ErrorHandler("User not found", 404));

      // Destroy old avatar if it exists
      if (existsUser.avatar && existsUser.avatar.public_id) {
        const imageId = existsUser.avatar.public_id;
        await cloudinary.v2.uploader
          .destroy(imageId)
          .catch((err) => console.error("Failed to destroy old avatar:", err));
      }

      // Upload new avatar
      const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
        folder: "avatars",
        width: 150,
        crop: "scale",
      });
      existsUser.avatar = {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      };
      await existsUser.save();

      // Exclude password from response
      const userResponse = existsUser.toObject();
      delete userResponse.password;

      res.status(200).json({ success: true, user: userResponse });
    } catch (error) {
      console.error("Avatar update error:", error);
      return next(
        new ErrorHandler(error.message || "Failed to update avatar", 500)
      );
    }
  })
);

router.put(
  "/update-user-addresses",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) return next(new ErrorHandler("User not found", 404));

      const { _id, addressType, ...addressData } = req.body; // Separate ID and type from data

      if (
        !addressType ||
        !addressData.country ||
        !addressData.city ||
        !addressData.address1
      ) {
        return next(
          new ErrorHandler(
            "Address type, country, city, and address line 1 are required",
            400
          )
        );
      }

      const addressIndex = user.addresses.findIndex(
        (a) => a._id.toString() === _id
      );

      if (addressIndex > -1) {
        // Update existing address
        // Check if changing type conflicts with another existing address
        if (addressType !== user.addresses[addressIndex].addressType) {
          const typeExists = user.addresses.some(
            (a, i) => i !== addressIndex && a.addressType === addressType
          );
          if (typeExists)
            return next(
              new ErrorHandler(`${addressType} address already exists`, 400)
            );
        }
        // Update fields - Mongoose handles this update within the array
        Object.assign(user.addresses[addressIndex], {
          addressType,
          ...addressData,
        });
      } else {
        // Add new address
        const typeExists = user.addresses.some(
          (a) => a.addressType === addressType
        );
        if (typeExists)
          return next(
            new ErrorHandler(`${addressType} address already exists`, 400)
          );
        user.addresses.push({ addressType, ...addressData }); // Add the new address object
      }

      await user.save();
      // Exclude password from response
      const userResponse = user.toObject();
      delete userResponse.password;
      res.status(200).json({ success: true, user: userResponse });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

router.delete(
  "/delete-user-address/:id",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const userId = req.user._id;
      const addressId = req.params.id;
      if (!mongoose.Types.ObjectId.isValid(addressId))
        return next(new ErrorHandler("Invalid address ID", 400));

      const result = await User.updateOne(
        { _id: userId },
        { $pull: { addresses: { _id: addressId } } }
      );

      if (result.modifiedCount === 0) {
        // Could mean user not found or address not found
        const userExists = await User.findById(userId);
        if (!userExists) return next(new ErrorHandler("User not found", 404));
        return next(
          new ErrorHandler("Address not found or already deleted", 404)
        );
      }

      const user = await User.findById(userId).select("-password"); // Get updated user
      res.status(200).json({ success: true, user });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

router.put(
  "/update-user-password",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { oldPassword, newPassword, confirmPassword } = req.body;
      if (!oldPassword || !newPassword || !confirmPassword) {
        return next(
          new ErrorHandler(
            "Please provide old password, new password, and confirm password",
            400
          )
        );
      }

      const user = await User.findById(req.user.id).select("+password");
      if (!user) return next(new ErrorHandler("User not found", 404));

      const isPasswordMatched = await user.comparePassword(oldPassword);
      if (!isPasswordMatched)
        return next(new ErrorHandler("Old password incorrect", 401));

      if (newPassword !== confirmPassword)
        return next(new ErrorHandler("New passwords do not match", 400));
      if (newPassword.length < 6)
        return next(
          new ErrorHandler("Password must be at least 6 characters", 400)
        ); // Add length check

      user.password = newPassword;
      await user.save();

      res
        .status(200)
        .json({ success: true, message: "Password updated successfully!" });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

router.get(
  "/user-info/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const userId = req.params.id;
      if (!mongoose.Types.ObjectId.isValid(userId))
        return next(new ErrorHandler("Invalid user ID", 400));

      const user = await User.findById(userId).select("-password"); // Exclude password
      if (!user) return next(new ErrorHandler("User not found", 404));

      res.status(200).json({ success: true, user });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

router.get(
  "/admin-all-users",
  isAuthenticated,
  isAdmin,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      const [totalUsers, users] = await Promise.all([
        User.countDocuments(),
        User.find()
          .select("-password -__v")
          .sort("-createdAt")
          .skip(skip)
          .limit(limit)
          .lean(),
      ]);

      res.status(200).json({
        success: true,
        users,
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

router.delete(
  "/delete-user/:id",
  isAuthenticated,
  isAdmin,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const userId = req.params.id;
      if (!mongoose.Types.ObjectId.isValid(userId))
        return next(new ErrorHandler("Invalid user ID", 400));

      const user = await User.findById(userId);
      if (!user) return next(new ErrorHandler("User not found", 404));

      // Consider deleting avatar from Cloudinary
      if (user.avatar && user.avatar.public_id) {
        await cloudinary.v2.uploader
          .destroy(user.avatar.public_id)
          .catch((err) =>
            console.error("Failed to delete user avatar from Cloudinary:", err)
          );
      }

      await User.findByIdAndDelete(userId);

      res
        .status(200)
        .json({ success: true, message: "User deleted successfully" });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

module.exports = router;