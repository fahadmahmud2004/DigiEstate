const express = require('express');
const router = express.Router();
const NotificationService = require('../services/notificationService.js');
const { requireUser } = require('./middleware/auth.js');

// Get user notifications
router.get('/', requireUser, async (req, res) => {
  try {
    console.log(`[NOTIFICATION] GET /api/notifications - Fetching notifications for user ${req.user.id}`);

    const notifications = await NotificationService.getNotificationsByUserId(req.user.id);
    
    const formattedNotifications = notifications.map(notification => ({
      _id: notification.id.toString(),
      type: notification.type,
      title: notification.title,
      message: notification.message,
      isRead: notification.is_read,
      data: notification.data,
      createdAt: notification.created_at
    }));

    console.log(`[NOTIFICATION] Retrieved ${formattedNotifications.length} notifications for user ${req.user.id}`);

    res.json({
      success: true,
      notifications: formattedNotifications
    });
  } catch (error) {
    console.error('[NOTIFICATION] Error fetching notifications:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Mark notification as read
router.put('/:id/read', requireUser, async (req, res) => {
  try {
    const notificationId = req.params.id;
    console.log(`[NOTIFICATION] PUT /api/notifications/${notificationId}/read - Marking as read for user ${req.user.id}`);

    await NotificationService.markAsRead(notificationId, req.user.id);

    console.log(`[NOTIFICATION] Notification ${notificationId} marked as read for user ${req.user.id}`);

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('[NOTIFICATION] Error marking notification as read:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete notification
router.delete('/:id', requireUser, async (req, res) => {
  try {
    const notificationId = req.params.id;
    console.log(`[NOTIFICATION] DELETE /api/notifications/${notificationId} - Deleting for user ${req.user.id}`);

    await NotificationService.deleteNotification(notificationId, req.user.id);

    console.log(`[NOTIFICATION] Notification ${notificationId} deleted for user ${req.user.id}`);

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('[NOTIFICATION] Error deleting notification:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get notification preferences
router.get('/preferences', requireUser, async (req, res) => {
  try {
    console.log(`[NOTIFICATION] GET /api/notifications/preferences - Fetching preferences for user ${req.user.id}`);

    const preferences = await NotificationService.getNotificationPreferences(req.user.id);

    const formattedPreferences = {
      _id: preferences.id.toString(),
      userId: preferences.user_id.toString(),
      bookingNotifications: preferences.booking_notifications,
      paymentNotifications: preferences.payment_notifications,
      messageNotifications: preferences.message_notifications,
      adminNotifications: preferences.admin_notifications,
      systemNotifications: preferences.system_notifications,
      emailNotifications: preferences.email_notifications,
      createdAt: preferences.created_at,
      updatedAt: preferences.updated_at
    };

    console.log(`[NOTIFICATION] Retrieved notification preferences for user ${req.user.id}`);

    res.json({
      success: true,
      preferences: formattedPreferences
    });
  } catch (error) {
    console.error('[NOTIFICATION] Error fetching notification preferences:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update notification preferences
router.put('/preferences', requireUser, async (req, res) => {
  try {
    console.log(`[NOTIFICATION] PUT /api/notifications/preferences - Updating preferences for user ${req.user.id}`);
    console.log('[NOTIFICATION] Update data:', JSON.stringify(req.body, null, 2));

    const {
      bookingNotifications,
      paymentNotifications,
      messageNotifications,
      adminNotifications,
      systemNotifications,
      emailNotifications
    } = req.body;

    const updateData = {
      booking_notifications: bookingNotifications,
      payment_notifications: paymentNotifications,
      message_notifications: messageNotifications,
      admin_notifications: adminNotifications,
      system_notifications: systemNotifications,
      email_notifications: emailNotifications
    };

    const updatedPreferences = await NotificationService.updateNotificationPreferences(req.user.id, updateData);

    const formattedPreferences = {
      _id: updatedPreferences.id.toString(),
      userId: updatedPreferences.user_id.toString(),
      bookingNotifications: updatedPreferences.booking_notifications,
      paymentNotifications: updatedPreferences.payment_notifications,
      messageNotifications: updatedPreferences.message_notifications,
      adminNotifications: updatedPreferences.admin_notifications,
      systemNotifications: updatedPreferences.system_notifications,
      emailNotifications: updatedPreferences.email_notifications,
      createdAt: updatedPreferences.created_at,
      updatedAt: updatedPreferences.updated_at
    };

    console.log(`[NOTIFICATION] Notification preferences updated for user ${req.user.id}`);

    res.json({
      success: true,
      preferences: formattedPreferences,
      message: 'Notification preferences updated successfully'
    });
  } catch (error) {
    console.error('[NOTIFICATION] Error updating notification preferences:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;