const AuthUtils = require("./authUtils"); // Ensure path is correct

/**
 * Utility to set authentication cookie and send JSON response for SELLER login/activation.
 * @param {object} shop - The Mongoose Shop document (must have .getJwtToken method).
 * @param {number} statusCode - HTTP status code for the response (e.g., 200, 201).
 * @param {object} res - Express response object.
 */
const sendShopToken = (shop, statusCode, res) => {
  try {
    // Generate token, cookie options, and sanitized shop data using AuthUtils
    const {
      token,
      cookieOptions,
      userData: shopData,
    } = AuthUtils.generateTokenResponse(
      shop,
      "seller" // Specify type as 'seller'
    );

    // console.log(`[sendShopToken] Setting cookie 'seller_token' for shop ${shopData._id}`);

    res.status(statusCode)
        .cookie("seller_token", token, cookieOptions) // Set the 'seller_token' cookie
        // Optional: Include token in response body
        .json({
            success: true,
            seller: shopData, // Send sanitized shop data (password removed by AuthUtils)
        });
  } catch (error) {
    console.error("[sendShopToken Utility Error]:", error);
    // Send a generic server error response
    res.status(500).json({
      success: false,
      message:
        "An internal server error occurred during seller authentication response.",
    });
  }
};

module.exports = sendShopToken;
