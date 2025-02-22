const AuthUtils = require('./authUtils');

const sendShopToken = (shop, statusCode, res) => {
  const { token, cookieOptions, userData } = AuthUtils.generateTokenResponse(shop, 'seller');

  res
    .status(statusCode)
    .cookie('seller_token', token, cookieOptions)
    .header('Seller-Authorization', `Bearer ${token}`)
    .json({
      success: true,
      seller: userData,
      token
    });
};

module.exports = sendShopToken;
