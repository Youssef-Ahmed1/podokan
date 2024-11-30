// In utils/shopToken.js
const sendShopToken = (shop, statusCode, res) => {
    const token = shop.getJwtToken();
    
    const cookieOptions = {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        httpOnly: true,
        sameSite: 'none',
        secure: true,
        domain: process.env.NODE_ENV === 'PRODUCTION' ? '.testpodokan.store' : undefined
    };

    // Remove password from response
    const shopData = shop.toObject();
    delete shopData.password;

    return res
        .status(statusCode)
        .cookie("seller_token", token, cookieOptions)
        .header('Seller-Authorization', `Bearer ${token}`)
        .json({
            success: true,
            seller: shopData,
            token,
        });
};

module.exports = sendShopToken;