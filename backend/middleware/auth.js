const JWTUtils = require('../utils/jwt');

const authMiddleware = {
  verifyToken: (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // FIX: Use your JWT utility instead of jwt.verify()
    const decoded = JWTUtils.verifyAccessToken(token);

    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.userId = decoded.id; // From token payload
    next();
  },
};

module.exports = authMiddleware;
