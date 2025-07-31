const { randomUUID } = require('crypto');
const { getDB } = require('../config/database.js');
const UserService = require('./userService.js');

class MessageService {
  static async sendMessage(senderId, receiverId, content, attachments = [], propertyId = null) {
    try {
      console.log(`[MessageService] Sending message from ${senderId} to ${receiverId}`);
      const db = getDB();

      const sender = await UserService.get(senderId);
      const receiver = await UserService.get(receiverId);
      if (!sender) throw new Error('Sender not found');
      if (!receiver) throw new Error('Receiver not found');

      const conversationId = this.generateConversationId(senderId, receiverId);
      const messageId = randomUUID();
      const now = new Date().toISOString();

      // If propertyId is provided, fetch property details to cache
      let propertyTitle = null;
      let propertyLocation = null;
      let propertyPrice = null;
      let propertyImageUrl = null;

      if (propertyId) {
        console.log(`[MessageService] Fetching property details for propertyId: ${propertyId}`);
        try {
          const propertyQuery = `SELECT title, location, price, images FROM properties WHERE id = $1`;
          const propertyResult = await db.query(propertyQuery, [propertyId]);
          if (propertyResult.rows.length > 0) {
            const property = propertyResult.rows[0];
            propertyTitle = property.title;
            propertyLocation = property.location;
            propertyPrice = property.price;
            propertyImageUrl = property.images && property.images.length > 0 ? property.images[0] : null;
            console.log(`[MessageService] Property context cached:`, {
              title: propertyTitle,
              location: propertyLocation,
              price: propertyPrice,
              imageUrl: propertyImageUrl
            });
          } else {
            console.warn(`[MessageService] Property ${propertyId} not found in database`);
          }
        } catch (error) {
          console.warn(`[MessageService] Failed to fetch property details for ${propertyId}:`, error.message);
          // Continue without property context if fetch fails
        }
      } else {
        console.log(`[MessageService] No propertyId provided, skipping property context`);
      }

      const insertQuery = `
        INSERT INTO messages (id, sender_id, receiver_id, content, attachments, is_read, conversation_id, property_id, property_title, property_location, property_price, property_image_url, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `;

      const result = await db.query(insertQuery, [
        messageId,
        senderId,
        receiverId,
        content.trim(),
        attachments, // Pass attachments directly as array
        false,
        conversationId,
        propertyId,
        propertyTitle,
        propertyLocation,
        propertyPrice,
        propertyImageUrl,
        now,
        now
      ]);

      const message = result.rows[0];

      return {
        _id: message.id,
        sender: {
          _id: senderId,
          name: sender.name || sender.email,
          avatar: sender.avatar || null
        },
        receiver: {
          _id: receiverId,
          name: receiver.name || receiver.email,
          avatar: receiver.avatar || null
        },
        content: message.content,
        attachments: message.attachments,
        isRead: message.is_read,
        conversationId: message.conversation_id,
        propertyId: message.property_id,
        propertyTitle: message.property_title,
        propertyLocation: message.property_location,
        propertyPrice: message.property_price,
        propertyImageUrl: message.property_image_url,
        createdAt: message.created_at,
        updatedAt: message.updated_at
      };
    } catch (error) {
      console.error(`[MessageService] Error sending message: ${error.message}`);
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  static async getConversations(userId) {
    try {
      const db = getDB();
      const query = `
        SELECT DISTINCT ON (m.conversation_id) m.*,
               s.name as sender_name, s.avatar as sender_avatar,
               r.name as receiver_name, r.avatar as receiver_avatar
        FROM messages m
        LEFT JOIN users s ON m.sender_id = s.id
        LEFT JOIN users r ON m.receiver_id = r.id
        WHERE m.sender_id = $1 OR m.receiver_id = $1
        ORDER BY m.conversation_id, m.created_at DESC
      `;
      const result = await db.query(query, [userId]);

      const conversations = await Promise.all(result.rows.map(async msg => {
        const otherUserId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
        const otherUser = await UserService.get(otherUserId);

        const unreadQuery = `
          SELECT COUNT(*) FROM messages
          WHERE conversation_id = $1 AND receiver_id = $2 AND is_read = FALSE
        `;
        const unreadResult = await db.query(unreadQuery, [msg.conversation_id, userId]);
        const unreadCount = parseInt(unreadResult.rows[0].count, 10);

        return {
          _id: msg.conversation_id,
          participants: [
            { _id: userId, name: 'You' },
            {
              _id: otherUserId,
              name: otherUser.name || otherUser.email,
              avatar: otherUser.avatar || null
            }
          ],
          lastMessage: {
            _id: msg.id,
            sender: {
              _id: msg.sender_id,
              name: msg.sender_name || 'Unknown',
              avatar: msg.sender_avatar || null
            },
            receiver: {
              _id: msg.receiver_id,
              name: msg.receiver_name || 'Unknown',
              avatar: msg.receiver_avatar || null
            },
            content: msg.content,
            isRead: msg.is_read,
            createdAt: msg.created_at
          },
          unreadCount,
          property: msg.property_id ? {
            _id: msg.property_id,
            title: 'Property Inquiry',
            images: []
          } : null,
          updatedAt: msg.created_at
        };
      }));

      return conversations.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    } catch (error) {
      console.error(`[MessageService] Error getting conversations: ${error.message}`);
      throw new Error(`Failed to get conversations: ${error.message}`);
    }
  }

  static async getMessages(conversationId, userId) {
    try {
      const db = getDB();
      const query = `
        SELECT m.*, 
               s.name as sender_name, s.avatar as sender_avatar,
               r.name as receiver_name, r.avatar as receiver_avatar
        FROM messages m
        LEFT JOIN users s ON m.sender_id = s.id
        LEFT JOIN users r ON m.receiver_id = r.id
        WHERE m.conversation_id = $1 AND (m.sender_id = $2 OR m.receiver_id = $2)
        ORDER BY m.created_at ASC
      `;
      const result = await db.query(query, [conversationId, userId]);
      return result.rows.map(row => ({
        _id: row.id,
        sender: { 
          _id: row.sender_id,
          name: row.sender_name || 'Unknown',
          avatar: row.sender_avatar || null
        },
        receiver: { 
          _id: row.receiver_id,
          name: row.receiver_name || 'Unknown',
          avatar: row.receiver_avatar || null
        },
        content: row.content,
        attachments: row.attachments,
        isRead: row.is_read,
        conversationId: row.conversation_id,
        propertyId: row.property_id,
        propertyTitle: row.property_title, // Now from cached data
        propertyLocation: row.property_location, // Now from cached data
        propertyPrice: row.property_price, // Now from cached data
        propertyImageUrl: row.property_image_url, // Now from cached data
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } catch (error) {
      console.error(`[MessageService] Error getting messages: ${error.message}`);
      throw new Error(`Failed to get messages: ${error.message}`);
    }
  }

  static async markMessageAsRead(messageId, userId) {
    try {
      const db = getDB();
      const updateQuery = `
        UPDATE messages
        SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND receiver_id = $2
        RETURNING *
      `;
      const result = await db.query(updateQuery, [messageId, userId]);
      if (result.rows.length === 0) throw new Error('Message not found or not authorized');

      return result.rows[0];
    } catch (error) {
      console.error(`[MessageService] Error marking message as read: ${error.message}`);
      throw new Error(`Failed to mark message as read: ${error.message}`);
    }
  }

  static async markConversationAsRead(conversationId, userId) {
    try {
      const db = getDB();
      const updateQuery = `
        UPDATE messages
        SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP
        WHERE conversation_id = $1 AND receiver_id = $2 AND is_read = FALSE
        RETURNING id
      `;
      const result = await db.query(updateQuery, [conversationId, userId]);
      return { updatedCount: result.rowCount };
    } catch (error) {
      console.error(`[MessageService] Error marking conversation as read: ${error.message}`);
      throw new Error(`Failed to mark conversation as read: ${error.message}`);
    }
  }

  static generateConversationId(userId1, userId2) {
    const sorted = [userId1, userId2].sort();
    return `conv_${sorted[0]}_${sorted[1]}`;
  }
}

module.exports = MessageService;