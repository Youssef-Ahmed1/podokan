// backend/utils/jwtToken.js
const AuthUtils = require("./authUtils"); // Ensure path is correct

/**
 * @param {object} user - The Mongoose User document (must have .getJwtToken method).
 * @param {number} statusCode - HTTP status code for the response (e.g., 200, 201).
 * @param {object} res - Express response object.
 */
const sendToken = (user, statusCode, res) => {
  try {
    // Generate token, cookie options, and sanitized user data using AuthUtils
    const { token, cookieOptions, userData } = AuthUtils.generateTokenResponse(
      user,
      "user" // Specify type as 'user'
    );

    console.log(
      `[sendToken User] Setting cookie 'token' for user ${userData._id}`
    );

    res
      .status(statusCode)
      .cookie("token", token, cookieOptions) // Set the 'token' cookie (NOT seller_token)
      // Optional: Include token in response body if needed by frontend state management immediately
      .json({
        success: true,
        token: token,
        user: userData, // Send sanitized user data (password removed by AuthUtils)
      });
  } catch (error) {
    console.error("[sendToken User Utility Error]:", error);
    // Send a generic server error response if token generation/sending fails
    res.status(500).json({
      success: false,
      message:
        "An internal server error occurred during authentication response.",
    });
  }
};

module.exports = sendToken;
