const jwt = require('jsonwebtoken');
const UserService = require('../../services/userService');

const requireAdmin = async (req, res, next) => {
  try {
    console.log('[ADMIN_AUTH_MIDDLEWARE] Checking admin authentication');

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[ADMIN_AUTH_MIDDLEWARE] No valid authorization header');
      return res.status(401).json({
        success: false,
        error: 'Access token required'
      });
    }

    const token = authHeader.substring(7);
    console.log('[ADMIN_AUTH_MIDDLEWARE] Token extracted, verifying...');

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('[ADMIN_AUTH_MIDDLEWARE] Token verified for user ID:', decoded.userId);

      const user = await UserService.get(decoded.userId);
      if (!user) {
        console.log('[ADMIN_AUTH_MIDDLEWARE] User not found for ID:', decoded.userId);
        return res.status(401).json({
          success: false,
          error: 'User not found'
        });
      }

      if (user.role !== 'admin') {
        console.log('[ADMIN_AUTH_MIDDLEWARE] User is not admin:', decoded.userId);
        return res.status(403).json({
          success: false,
          error: 'Admin access required'
        });
      }

      if (!user.is_active) {
        console.log('[ADMIN_AUTH_MIDDLEWARE] Admin account not active:', decoded.userId);
        return res.status(401).json({
          success: false,
          error: 'Account not active'
        });
      }

      console.log('[ADMIN_AUTH_MIDDLEWARE] Admin authentication successful for user:', user.email);
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role
      };

      next();
    } catch (jwtError) {
      console.error('[ADMIN_AUTH_MIDDLEWARE] JWT verification failed:', jwtError.message);
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }
  } catch (error) {
    console.error('[ADMIN_AUTH_MIDDLEWARE] Admin authentication error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Authentication error'
    });
  }
};

module.exports = {
  requireAdmin
};