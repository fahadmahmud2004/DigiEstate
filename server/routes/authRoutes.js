const express = require('express');
const router = express.Router();
const UserService = require('../services/userService.js');
const { generateAccessToken, generateRefreshToken } = require('../utils/auth.js');
const { requireUser } = require('./middleware/auth.js');
const jwt = require('jsonwebtoken');

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`[AUTH] Login attempt for: ${email}`);
    console.log(`[AUTH] Request body:`, JSON.stringify(req.body));

    if (!email || !password) {
      console.log('[AUTH] Missing email or password');
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    console.log('[AUTH] About to call UserService.authenticate');
    const user = await UserService.authenticate(email, password);
    console.log('[AUTH] UserService.authenticate returned:', user ? 'USER_OBJECT' : 'NULL');

    if (!user) {
      console.log(`[AUTH] Authentication failed for: ${email}`);
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Check if user account is active
    if (!user.is_active) {
      console.log(`[AUTH] Login blocked - account not active for: ${email}`);
      return res.status(401).json({
        success: false,
        error: 'Account not active'
      });
    }

    console.log(`[AUTH] About to generate tokens for user: ${user.id}`);
    const accessToken = await generateAccessToken(user.id);
    const refreshToken = await generateRefreshToken(user.id);

    console.log(`[AUTH] Login successful for: ${email} User ID: ${user.id}`);
    console.log('[AUTH] Generated tokens - AccessToken:', accessToken ? 'EXISTS' : 'NULL', 'RefreshToken:', refreshToken ? 'EXISTS' : 'NULL');

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name || '',
          role: user.role || 'user'
        }
      }
    });
  } catch (error) {
    console.error('[AUTH] Login error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Register route
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    console.log(`[AUTH] Registration attempt for: ${email}`);
    console.log(`[AUTH] Request body:`, JSON.stringify(req.body));

    if (!email || !password) {
      console.log('[AUTH] Missing email or password');
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    console.log('[AUTH] About to call UserService.create');
    const userData = {
      email,
      password,
      name: name || '',
      role: 'user',
      is_active: true  // Ensure new users are active by default
    };

    const user = await UserService.create(userData);
    console.log('[AUTH] UserService.create returned:', user ? 'USER_OBJECT' : 'NULL');

    if (!user) {
      console.log(`[AUTH] User creation failed for: ${email}`);
      return res.status(500).json({
        success: false,
        error: 'Failed to create user'
      });
    }

    console.log(`[AUTH] About to generate tokens for new user: ${user.id}`);
    const accessToken = await generateAccessToken(user.id);

    console.log(`[AUTH] Registration successful for: ${email} User ID: ${user.id}`);
    console.log('[AUTH] Generated AccessToken:', accessToken ? 'EXISTS' : 'NULL');

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name || '',
          role: user.role || 'user'
        }
      }
    });
  } catch (error) {
    console.error('[AUTH] Registration error:', error.message);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Token refresh route
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    console.log('[AUTH] Token refresh attempt');

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token required'
      });
    }

    console.log('[AUTH] Verifying refresh token');
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    console.log(`[AUTH] Refresh token verified for user: ${decoded.userId}`);

    const user = await UserService.get(decoded.userId);
    if (!user) {
      console.log(`[AUTH] User not found for refresh token: ${decoded.userId}`);
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if user account is still active
    if (!user.is_active) {
      console.log(`[AUTH] Refresh blocked - account not active for user: ${decoded.userId}`);
      return res.status(401).json({
        success: false,
        error: 'Account not active'
      });
    }

    const newAccessToken = await generateAccessToken(user.id);
    const newRefreshToken = await generateRefreshToken(user.id);

    console.log(`[AUTH] New tokens generated for user: ${user.id}`);
    console.log('[AUTH] New AccessToken:', newAccessToken ? 'EXISTS' : 'NULL', 'New RefreshToken:', newRefreshToken ? 'EXISTS' : 'NULL');

    res.json({
      success: true,
      message: 'Tokens refreshed successfully',
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    console.error('[AUTH] Token refresh error:', error.message);
    res.status(401).json({
      success: false,
      error: 'Invalid refresh token'
    });
  }
});

// Logout route
router.post('/logout', requireUser, async (req, res) => {
  try {
    console.log(`[AUTH] Logout for user: ${req.user.id}`);

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('[AUTH] Logout error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get current user
router.get('/me', requireUser, async (req, res) => {
  try {
    console.log(`[AUTH] Get current user: ${req.user.id}`);

    const user = await UserService.get(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || '',
        role: user.role || 'user'
      }
    });
  } catch (error) {
    console.error('[AUTH] Get current user error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;