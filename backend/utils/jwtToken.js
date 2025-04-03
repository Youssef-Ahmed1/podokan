const AuthUtils = require('./authUtils');

/**
 * Sets auth cookie and sends JSON response for regular users.
 * @param {object} user - User Mongoose document (must have .getJwtToken method).
 * @param {number} statusCode - HTTP status code for the response.
 * @param {object} res - Express response object.
 */
const sendToken = (user, statusCode, res) => {
  try {
    const { token, cookieOptions, userData } = AuthUtils.generateTokenResponse(
      user,
      "user"
    );

    res
      .status(statusCode)
      .cookie("token", token, cookieOptions) // Set the 'token' cookie
      // .header('Authorization', `Bearer ${token}`) // Optional: Set header
      .json({
        success: true,
        token: token, // Optional: Include token in body
        user: userData, // Send sanitized user data
      });
  } catch (error) {
    console.error("Error in sendToken utility:", error);
    res.status(500).json({
      success: false,
      message:
        "An internal error occurred during authentication response generation.",
    });
  }
};

module.exports = sendToken;