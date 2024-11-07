const sendShopToken = (shop, statusCode, res) => {
    const token = shop.getJwtToken();
    
    const cookieOptions = {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        httpOnly: true,
        sameSite: 'none',
        secure: true,
        domain: '.testpodokan.store'
    };

    // Clean shop data
    const shopData = shop.toJSON ? shop.toJSON() : shop;
    delete shopData.password;

    res.cookie("seller_token", token, cookieOptions)
       .header('Seller-Authorization', `Bearer ${token}`)
       .status(statusCode)
       .json({
            success: true,
            seller: shopData,
            token
       });
};

module.exports = sendShopToken;