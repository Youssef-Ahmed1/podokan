// File: backend/utils/jwtToken.js
const AuthUtils = require("./authUtils");
const sendToken = (user, statusCode, res) => {
  try {
    const { token, cookieOptions, userData } = AuthUtils.generateTokenResponse(
      user,
      "user"
    );
    console.log(
      `[sendToken User] Setting cookie 'token' for user ${userData._id}`
    );
    res.status(statusCode)
        .cookie("token", token, cookieOptions)
        .json({ success: true, user: userData });
  } catch (error) {
    console.error("[sendToken User Utility Error]:", error);
    // Avoid sending detailed errors in production
    res.status(500).json({
      success: false,
      message: "Authentication response generation failed.",
    });
  }
};

module.exports = sendToken;
