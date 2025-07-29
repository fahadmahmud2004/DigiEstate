const { getDB } = require('../config/database.js');

class NotificationService {
  // Get all notifications for a user
  static async getNotificationsByUserId(userId) {
    try {
      console.log(`[NotificationService] Fetching notifications for user: ${userId}`);
      const db = getDB();
      
      const result = await db.query(
        `SELECT * FROM notifications 
         WHERE user_id = $1 
         ORDER BY created_at DESC`,
        [userId]
      );

      console.log(`[NotificationService] Retrieved ${result.rows.length} notifications for user ${userId}`);
      return result.rows;
    } catch (error) {
      console.error(`[NotificationService] Error fetching notifications: ${error.message}`);
      throw new Error(`Database error while fetching notifications: ${error.message}`);
    }
  }

  // Create a new notification
  static async createNotification(notificationData) {
    try {
      console.log(`[NotificationService] Creating notification for user: ${notificationData.userId}`);
      const db = getDB();
      
      const result = await db.query(
        `INSERT INTO notifications (user_id, type, title, message, data, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING *`,
        [
          notificationData.userId,
          notificationData.type,
          notificationData.title,
          notificationData.message,
          JSON.stringify(notificationData.data || {})
        ]
      );

      console.log(`[NotificationService] Notification created successfully with ID: ${result.rows[0].id}`);
      return result.rows[0];
    } catch (error) {
      console.error(`[NotificationService] Error creating notification: ${error.message}`);
      throw new Error(`Database error while creating notification: ${error.message}`);
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId, userId) {
    try {
      console.log(`[NotificationService] Marking notification ${notificationId} as read for user ${userId}`);
      const db = getDB();
      
      const result = await db.query(
        `UPDATE notifications 
         SET is_read = true
         WHERE id = $1 AND user_id = $2
         RETURNING *`,
        [notificationId, userId]
      );

      if (result.rows.length === 0) {
        throw new Error('Notification not found or access denied');
      }

      console.log(`[NotificationService] Notification ${notificationId} marked as read`);
      return result.rows[0];
    } catch (error) {
      console.error(`[NotificationService] Error marking notification as read: ${error.message}`);
      throw new Error(`Database error while marking notification as read: ${error.message}`);
    }
  }

  // Get notification preferences for a user
  static async getNotificationPreferences(userId) {
    try {
      console.log(`[NotificationService] Fetching notification preferences for user: ${userId}`);
      const db = getDB();
      
      let result = await db.query(
        `SELECT * FROM notification_preferences WHERE user_id = $1`,
        [userId]
      );

      // If no preferences exist, create default ones
      if (result.rows.length === 0) {
        console.log(`[NotificationService] Creating default preferences for user: ${userId}`);
        result = await db.query(
          `INSERT INTO notification_preferences (user_id, booking_notifications, payment_notifications, message_notifications, admin_notifications, system_notifications, email_notifications)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
          [userId, true, true, true, true, true, true]
        );
      }

      console.log(`[NotificationService] Retrieved notification preferences for user ${userId}`);
      return result.rows[0];
    } catch (error) {
      console.error(`[NotificationService] Error fetching notification preferences: ${error.message}`);
      throw new Error(`Database error while fetching notification preferences: ${error.message}`);
    }
  }

  // Update notification preferences for a user
  static async updateNotificationPreferences(userId, preferences) {
    try {
      console.log(`[NotificationService] Updating notification preferences for user: ${userId}`);
      const db = getDB();
      
      const result = await db.query(
        `UPDATE notification_preferences 
         SET booking_notifications = $2, 
             payment_notifications = $3, 
             message_notifications = $4, 
             admin_notifications = $5, 
             system_notifications = $6, 
             email_notifications = $7
         WHERE user_id = $1
         RETURNING *`,
        [
          userId,
          preferences.booking_notifications,
          preferences.payment_notifications,
          preferences.message_notifications,
          preferences.admin_notifications,
          preferences.system_notifications,
          preferences.email_notifications
        ]
      );

      if (result.rows.length === 0) {
        // If no preferences exist, create them
        const createResult = await db.query(
          `INSERT INTO notification_preferences (user_id, booking_notifications, payment_notifications, message_notifications, admin_notifications, system_notifications, email_notifications)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
          [
            userId,
            preferences.booking_notifications,
            preferences.payment_notifications,
            preferences.message_notifications,
            preferences.admin_notifications,
            preferences.system_notifications,
            preferences.email_notifications
          ]
        );
        return createResult.rows[0];
      }

      console.log(`[NotificationService] Notification preferences updated for user ${userId}`);
      return result.rows[0];
    } catch (error) {
      console.error(`[NotificationService] Error updating notification preferences: ${error.message}`);
      throw new Error(`Database error while updating notification preferences: ${error.message}`);
    }
  }

  // Delete a notification
  static async deleteNotification(notificationId, userId) {
    try {
      console.log(`[NotificationService] Deleting notification ${notificationId} for user ${userId}`);
      const db = getDB();
      
      const result = await db.query(
        `DELETE FROM notifications 
         WHERE id = $1 AND user_id = $2
         RETURNING id`,
        [notificationId, userId]
      );

      if (result.rows.length === 0) {
        throw new Error('Notification not found or access denied');
      }

      console.log(`[NotificationService] Notification ${notificationId} deleted successfully`);
      return true;
    } catch (error) {
      console.error(`[NotificationService] Error deleting notification: ${error.message}`);
      throw new Error(`Database error while deleting notification: ${error.message}`);
    }
  }

  // Create notification for booking events
  static async createBookingNotification(userId, type, bookingData) {
    const notificationData = {
      userId,
      type: 'booking',
      title: this.getBookingNotificationTitle(type),
      message: this.getBookingNotificationMessage(type, bookingData),
      data: { bookingId: bookingData.bookingId, propertyId: bookingData.propertyId }
    };

    return await this.createNotification(notificationData);
  }

  // Create notification for message events
  static async createMessageNotification(userId, senderName) {
    const notificationData = {
      userId,
      type: 'message',
      title: 'New Message',
      message: `You have a new message from ${senderName}.`,
      data: {}
    };

    return await this.createNotification(notificationData);
  }

  // Helper methods for notification content
  static getBookingNotificationTitle(type) {
    switch (type) {
      case 'accepted': return 'Booking Request Accepted';
      case 'declined': return 'Booking Request Declined';
      case 'cancelled': return 'Booking Cancelled';
      case 'new': return 'New Booking Request';
      default: return 'Booking Update';
    }
  }

  static getBookingNotificationMessage(type, bookingData) {
    switch (type) {
      case 'accepted': return `Your booking request for ${bookingData.propertyTitle} has been accepted.`;
      case 'declined': return `Your booking request for ${bookingData.propertyTitle} has been declined.`;
      case 'cancelled': return `Your booking for ${bookingData.propertyTitle} has been cancelled.`;
      case 'new': return `You have a new booking request for ${bookingData.propertyTitle}.`;
      default: return `Your booking for ${bookingData.propertyTitle} has been updated.`;
    }
  }
}

module.exports = NotificationService;