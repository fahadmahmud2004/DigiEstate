const express = require('express');
const router = express.Router();
const UserService = require('../services/userService.js');
const PropertyService = require('../services/propertyService.js');
const BookingService = require('../services/bookingService.js');
const { requireUser } = require('./middleware/auth.js');

// Get current user's profile
router.get('/profile', requireUser, async (req, res) => {
  try {
    console.log(`[USER] GET /api/users/profile - Fetching profile for user ${req.user.id}`);

    const user = await UserService.get(req.user.id);
    if (!user) {
      console.log(`[USER] Profile not found for user ${req.user.id}`);
      return res.status(404).json({
        success: false,
        error: 'User profile not found'
      });
    }

    // Get additional profile statistics
    const userListings = await PropertyService.getByOwner(req.user.id);
    const userBookings = await BookingService.getByUserId(req.user.id);

    const profileData = {
      _id: user.id,
      name: user.name || user.email.split('@')[0],
      email: user.email,
      phone: user.phone || '',
      avatar: user.avatar || '',
      role: user.role || 'user',
      status: user.is_active ? 'active' : 'inactive',
      reputation: user.reputation || 4.5,
      totalListings: userListings.length,
      totalBookings: userBookings.length,
      joinDate: user.created_at,
      createdAt: user.created_at,
      updatedAt: user.updated_at || user.created_at
    };

    console.log(`[USER] Profile retrieved successfully for user ${req.user.id}`);

    res.json({
      success: true,
      user: profileData
    });
  } catch (error) {
    console.error('[USER] Error fetching user profile:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update current user's profile
router.put('/profile', requireUser, async (req, res) => {
  try {
    console.log(`[USER] PUT /api/users/profile - Updating profile for user ${req.user.id}`);
    console.log('[USER] Update data:', JSON.stringify(req.body, null, 2));

    const { name, phone, avatar } = req.body;
    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (avatar !== undefined) updateData.avatar = avatar;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No update data provided'
      });
    }

    const updatedUser = await UserService.update(req.user.id, updateData);
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get updated profile statistics
    const userListings = await PropertyService.getByOwner(req.user.id);
    const userBookings = await BookingService.getByUserId(req.user.id);

    const profileData = {
      _id: updatedUser.id,
      name: updatedUser.name || updatedUser.email.split('@')[0],
      email: updatedUser.email,
      phone: updatedUser.phone || '',
      avatar: updatedUser.avatar || '',
      role: updatedUser.role || 'user',
      status: updatedUser.is_active ? 'active' : 'inactive',
      reputation: updatedUser.reputation || 4.5,
      totalListings: userListings.length,
      totalBookings: userBookings.length,
      joinDate: updatedUser.created_at,
      createdAt: updatedUser.created_at,
      updatedAt: updatedUser.updated_at
    };

    console.log(`[USER] Profile updated successfully for user ${req.user.id}`);

    res.json({
      success: true,
      user: profileData,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('[USER] Error updating user profile:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

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