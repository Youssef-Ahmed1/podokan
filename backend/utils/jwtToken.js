// utils/jwtToken.js
const User = require('../model/user');
const Shop = require('../model/shop');

const sendToken = (user, statusCode, res) => {
    const token = user.getJwtToken();
    
    const cookieOptions = {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        httpOnly: true,
        sameSite: 'none',
        secure: true,
        domain: '.testpodokan.store'
    };

    res
      .status(statusCode)
      .cookie("token", token, cookieOptions)
      .header('Authorization', `Bearer ${token}`)
      .json({
        success: true,
        user,
        token
      });
};

module.exports = sendToken;