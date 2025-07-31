const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const UserService = require('../services/userService.js');
const PropertyService = require('../services/propertyService.js');
const BookingService = require('../services/bookingService.js');
const { requireUser } = require('./middleware/auth.js');
const { comparePassword } = require('../utils/password.js');

// --- Multer Configuration ---
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Get current user's profile
router.get('/', requireUser, async (req, res) => {
  try {
    const user = await UserService.get(req.user.id);
    if (!user) {
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

    res.json({
      success: true,
      user: profileData
    });
  } catch (error) {
    console.error('[PROFILE] Error fetching user profile:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update user profile
router.put('/', requireUser, upload.single('avatar'), async (req, res) => {
  try {
    const { id } = req.user;
    const { name, phone } = req.body;
    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (req.file) {
      updateData.avatar = req.file.path;
    }

    const updatedUser = await UserService.update(id, updateData);

    // Get updated profile statistics to return a consistent user object
    const userListings = await PropertyService.getByOwner(id);
    const userBookings = await BookingService.getByUserId(id);

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

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: profileData
    });
  } catch (error) {
    console.error('[PROFILE] Error updating profile:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

// Change password
router.put('/change-password', requireUser, async (req, res) => {
  try {
    const { id } = req.user;
    const { currentPassword, newPassword } = req.body;

    console.log(`[PROFILE] PUT /api/profile/change-password - Password change request for user: ${id}`);

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters long'
      });
    }

    // Get current user to verify current password
    const user = await UserService.get(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      console.log(`[PROFILE] Invalid current password for user: ${id}`);
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Update password
    await UserService.update(id, { password: newPassword });

    console.log(`[PROFILE] Password changed successfully for user: ${id}`);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('[PROFILE] Error changing password:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to change password'
    });
  }
});

module.exports = router; 