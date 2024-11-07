// utils/userToken.js
const sendToken = (user, statusCode, res) => {
    const token = user.getJwtToken();
    
    const cookieOptions = {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        httpOnly: true,
        sameSite: 'none',
        secure: true,
        domain: '.testpodokan.store'
    };

    // Clean user data
    const userData = user.toJSON ? user.toJSON() : user;
    delete userData.password;

    res.cookie("token", token, cookieOptions)
       .header('Authorization', `Bearer ${token}`)
       .status(statusCode)
       .json({
            success: true,
            user: userData,
            token
       });
};

// model/shop.js and model/user.js should have the getJwtToken method:
userSchema.methods.getJwtToken = function() {
    return jwt.sign(
        { id: this._id },
        process.env.JWT_SECRET_KEY,
        { expiresIn: "7d" }
    );
};

shopSchema.methods.getJwtToken = function() {
    return jwt.sign(
        { id: this._id },
        process.env.JWT_SECRET_KEY,
        { expiresIn: "7d" }
    );
};


module.exports = sendToken;