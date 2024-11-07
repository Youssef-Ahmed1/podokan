const sendShopToken = (shop, statusCode, res) => {
    const token = shop.getJwtToken();
    
    // Options for cookies
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