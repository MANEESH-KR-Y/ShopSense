const jwt = require('jsonwebtoken');
require('dotenv').config();

class JWTUtils {
  static generateAccessToken(user) {
    return jwt.sign({ id: user.id, email: user.email }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: '15m',
    });
  }

  static generateRefreshToken(user) {
    return jwt.sign({ id: user.id }, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: '7d',
    });
  }

  static verifyAccessToken(token) {
    try {
      return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch {
      return null;
    }
  }

  static verifyRefreshToken(token) {
    try {
      return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    } catch {
      return null;
    }
  }
}

module.exports = JWTUtils;
