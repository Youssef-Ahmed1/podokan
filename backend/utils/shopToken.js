const AuthUtils = require('./authUtils');

/**
 * Sets auth cookie and sends JSON response for sellers (shops).
 * @param {object} shop - Shop Mongoose document (must have .getJwtToken method).
 * @param {number} statusCode - HTTP status code for the response.
 * @param {object} res - Express response object.
 */
const sendShopToken = (shop, statusCode, res) => {
 try {
   if (!shop || typeof shop.getJwtToken !== "function") {
     console.error(
       "Invalid shop object passed to sendShopToken or getJwtToken method missing."
     );
     throw new Error("Invalid shop data for token generation.");
   }

   const { token, cookieOptions, userData } = AuthUtils.generateTokenResponse(
     shop,
     "seller"
   );

   res
     .status(statusCode)
     .cookie("seller_token", token, cookieOptions) // Set the 'seller_token' cookie
     // .header('Seller-Authorization', `Bearer ${token}`) // Optional: Set header
     .json({
       success: true,
       token: token, // Optional: Include token in body
       seller: userData, // Send sanitized shop data as 'seller'
     });
 } catch (error) {
   console.error("Error in sendShopToken utility:", error);
   res.status(500).json({
     success: false,
     message:
       "An internal error occurred during seller authentication response generation.",
   });
 }
};

module.exports = sendShopToken;