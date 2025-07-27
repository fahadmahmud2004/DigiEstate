const express = require('express');
const router = express.Router();
const UserService = require('../services/userService.js');
const PropertyService = require('../services/propertyService.js');
const BookingService = require('../services/bookingService.js');
const { requireUser } = require('./middleware/auth.js');

// Get all users (for messaging - already implemented in users.ts)
router.get('/', requireUser, async (req, res) => {
  try {
    console.log('[USER] GET /api/users - Fetching all users');

    const users = await UserService.list();
    const formattedUsers = users.map(user => ({
      _id: user.id,
      name: user.name || user.email.split('@')[0],
      email: user.email,
      avatar: user.avatar || null,
      role: user.role || 'user',
      status: user.is_active ? 'active' : 'inactive'
    }));

    console.log(`[USER] Retrieved ${formattedUsers.length} users`);

    res.json({
      success: true,
      users: formattedUsers
    });
  } catch (error) {
    console.error('[USER] Error fetching users:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Search users by name or email (for messaging - already implemented in users.ts)
router.get('/search', requireUser, async (req, res) => {
  try {
    const { q: query } = req.query;
    console.log(`[USER] GET /api/users/search - Searching users with query: ${query}`);

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const allUsers = await UserService.list();
    const filteredUsers = allUsers.filter(user => {
      const name = user.name || user.email.split('@')[0];
      return name.toLowerCase().includes(query.toLowerCase()) ||
             user.email.toLowerCase().includes(query.toLowerCase());
    }).map(user => ({
      _id: user.id,
      name: user.name || user.email.split('@')[0],
      email: user.email,
      avatar: user.avatar || null,
      role: user.role || 'user',
      status: user.is_active ? 'active' : 'inactive'
    }));

    console.log(`[USER] Found ${filteredUsers.length} users matching query: ${query}`);

    res.json({
      success: true,
      users: filteredUsers
    });
  } catch (error) {
    console.error('[USER] Error searching users:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;