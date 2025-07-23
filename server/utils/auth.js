const jwt = require('jsonwebtoken');

const generateAccessToken = (userId) => {
  try {
    console.log(`[JWT] Generating access token for user ID: ${userId}`);
    const token = jwt.sign(
      { userId: userId },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    console.log(`[JWT] Access token generated successfully`);
    return token;
  } catch (error) {
    console.error(`[JWT] Error generating access token: ${error.message}`);
    throw new Error(`Token generation failed: ${error.message}`);
  }
};

const generateRefreshToken = (userId) => {
  try {
    console.log(`[JWT] Generating refresh token for user ID: ${userId}`);
    const token = jwt.sign(
      { userId: userId },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );
    console.log(`[JWT] Refresh token generated successfully`);
    return token;
  } catch (error) {
    console.error(`[JWT] Error generating refresh token: ${error.message}`);
    throw new Error(`Token generation failed: ${error.message}`);
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken
};