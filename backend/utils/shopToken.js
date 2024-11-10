const sendShopToken = (shop, statusCode, res) => {
    const token = shop.getJwtToken();
  
    const options = {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'PRODUCTION',
      sameSite: 'strict',
      path: '/',
      domain: process.env.NODE_ENV === 'PRODUCTION' ? '.testpodokan.store' : undefined
    };
  
    const shopData = shop.toObject();
    delete shopData.password;
  
    res.status(statusCode)
      .cookie("seller_token", token, options)
      .json({
        success: true,
        seller: shopData,
        token
      });
  };
  
  module.exports = sendShopToken;