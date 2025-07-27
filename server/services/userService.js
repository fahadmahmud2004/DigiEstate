const { getDB } = require('../config/database.js');
const { hashPassword, comparePassword } = require('../utils/password.js');

class UserService {
  static async get(id) {
    try {
      console.log(`[UserService] Fetching user with ID: ${id}`);
      const db = getDB();
      const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
      const user = result.rows[0] || null;
      
      if (user) {
        console.log(`[UserService] User found - ID: ${user.id}, Email: ${user.email}, Active: ${user.is_active}`);
      } else {
        console.log(`[UserService] User not found for ID: ${id}`);
      }
      
      return user;
    } catch (err) {
      console.error(`[UserService] Error fetching user: ${err.message}`);
      throw new Error(`Database error while fetching user: ${err.message}`);
    }
  }

  static async create(userData) {
    try {
      console.log(`[UserService] Creating user with email: ${userData.email}`);
      const db = getDB();

      // Check if user already exists
      const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [userData.email]);
      if (existingUser.rows.length > 0) {
        throw new Error('User with this email already exists');
      }

      const hashedPassword = await hashPassword(userData.password);
      const result = await db.query(
        `INSERT INTO users (email, password, name, phone, avatar, role, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
         RETURNING *`,
        [
          userData.email,
          hashedPassword,
          userData.name || userData.email.split('@')[0],
          userData.phone || '',
          userData.avatar || '',
          userData.role || 'user',
          userData.is_active !== undefined ? userData.is_active : true  // Default to true if not specified
        ]
      );

      const newUser = result.rows[0];
      console.log(`[UserService] User created successfully with ID: ${newUser.id}, Active: ${newUser.is_active}`);
      return newUser;
    } catch (err) {
      console.error(`[UserService] Error creating user: ${err.message}`);
      throw new Error(`Database error while creating user: ${err.message}`);
    }
  }

  static async authenticate(email, password) {
    try {
      console.log(`[UserService] Authenticating user with email: ${email}`);
      const db = getDB();
      const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
      const user = result.rows[0];

      if (!user) {
        console.log(`[UserService] User not found: ${email}`);
        return null;
      }

      console.log(`[UserService] User found - ID: ${user.id}, Active: ${user.is_active}`);

      const isValid = await comparePassword(password, user.password);
      if (!isValid) {
        console.log(`[UserService] Invalid password for user: ${email}`);
        return null;
      }

      // Note: We don't check is_active here anymore - that's handled in the auth route
      // Update last login time
      await db.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

      console.log(`[UserService] User authenticated successfully: ${email}`);
      return user;
    } catch (err) {
      console.error(`[UserService] Error authenticating user: ${err.message}`);
      throw new Error(`Database error while authenticating user: ${err.message}`);
    }
  }

  static async update(id, updateData) {
    try {
      console.log(`[UserService] Updating user with ID: ${id}`);
      console.log(`[UserService] Update data:`, updateData);

      const db = getDB();
      const fields = [];
      const values = [];
      let index = 1;

      if (updateData.password) {
        updateData.password = await hashPassword(updateData.password);
      }

      for (let key in updateData) {
        if (updateData[key] !== undefined) {
          fields.push(`${key} = $${index++}`);
          values.push(updateData[key]);
        }
      }

      if (fields.length === 0) {
        throw new Error('No valid fields to update');
      }

      values.push(id);
      fields.push('updated_at = NOW()');

      const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${index} RETURNING *`;

      console.log(`[UserService] Executing query: ${query}`);
      console.log(`[UserService] With values:`, values);

      const result = await db.query(query, values);

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      console.log(`[UserService] User updated successfully: ${id}`);
      return result.rows[0];
    } catch (err) {
      console.error(`[UserService] Error updating user: ${err.message}`);
      throw new Error(`Database error while updating user: ${err.message}`);
    }
  }

  static async delete(id) {
    try {
      console.log(`[UserService] Deleting user with ID: ${id}`);
      const db = getDB();
      const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      console.log(`[UserService] User deleted successfully: ${id}`);
      return true;
    } catch (err) {
      console.error(`[UserService] Error deleting user: ${err.message}`);
      throw new Error(`Database error while deleting user: ${err.message}`);
    }
  }

  static async list() {
    try {
      console.log(`[UserService] Fetching all users`);
      const db = getDB();
      const result = await db.query('SELECT * FROM users ORDER BY created_at DESC');
      console.log(`[UserService] Retrieved ${result.rows.length} users`);
      return result.rows;
    } catch (err) {
      console.error(`[UserService] Error fetching users: ${err.message}`);
      throw new Error(`Database error while fetching users: ${err.message}`);
    }
  }
}

module.exports = UserService;