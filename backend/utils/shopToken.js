const sendShopToken = (shop, statusCode, res) => {
    const token = shop.getJwtToken();
    
    // Options for cookies
    const cookieOptions = {
        expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        httpOnly: true,
        sameSite: "none",
        secure: true,
        path: '/',
        domain: process.env.NODE_ENV === 'PRODUCTION' ? '.testpodokan.store' : undefined
    };

    // Set authorization header
    const authHeader = `Bearer ${token}`;
    
    // Remove password from response
    if (shop.toJSON) {
        shop = shop.toJSON();
    }
    if (shop.password) {
        delete shop.password;
    }

    return res
        .status(statusCode)
        .cookie("seller_token", token, cookieOptions)
        .set('Seller-Authorization', authHeader)
        .json({
            success: true,
            seller: shop,
            token,
        });
};
module.exports = sendShopToken;