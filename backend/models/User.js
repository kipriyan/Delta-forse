const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { pool } = require('../config/db');
const config = require('../config/config');

class User {
  constructor(userData) {
    this.id = userData.id;
    this.username = userData.username;
    this.email = userData.email;
    this.password = userData.password;
    this.first_name = userData.first_name;
    this.last_name = userData.last_name;
    this.phone = userData.phone;
    this.user_type = userData.user_type;
    this.profile_image = userData.profile_image;
    this.bio = userData.bio;
    this.reset_password_token = userData.reset_password_token;
    this.reset_password_expire = userData.reset_password_expire;
    this.created_at = userData.created_at;
    this.updated_at = userData.updated_at;
  }

  static async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  }

  async matchPassword(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
  }

  async getResetPasswordToken() {
    const resetToken = crypto.randomBytes(20).toString('hex');

    this.reset_password_token = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    this.reset_password_expire = Date.now() + 10 * 60 * 1000;

    await pool.execute(
      'UPDATE users SET reset_password_token = ?, reset_password_expire = ? WHERE id = ?',
      [this.reset_password_token, this.reset_password_expire, this.id]
    );

    return resetToken;
  }

  static async create(userData) {
    try {
      const hashedPassword = await this.hashPassword(userData.password);

      const [result] = await pool.execute(
        `INSERT INTO users 
        (username, email, password, first_name, last_name, phone, user_type, profile_image, bio) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userData.username,
          userData.email,
          hashedPassword,
          userData.first_name || null,
          userData.last_name || null,
          userData.phone || null,
          userData.user_type || 'individual',
          userData.profile_image || null,
          userData.bio || null
        ]
      );

      const [user] = await pool.execute('SELECT * FROM users WHERE id = ?', [result.insertId]);
      
      delete user[0].password;
      
      return new User(user[0]);
    } catch (error) {
      console.error('Create user error:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
      
      if (rows.length === 0) return null;
      
      delete rows[0].password;
      
      return new User(rows[0]);
    } catch (error) {
      console.error('Find user error:', error);
      throw error;
    }
  }

  static async findByEmail(email) {
    try {
      const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
      
      if (rows.length === 0) return null;
      
      return new User(rows[0]);
    } catch (error) {
      console.error('Find user by email error:', error);
      throw error;
    }
  }

  static async findByResetToken(resetToken) {
    try {
      const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

      const [rows] = await pool.execute(
        'SELECT * FROM users WHERE reset_password_token = ? AND reset_password_expire > ?',
        [hashedToken, Date.now()]
      );
      
      if (rows.length === 0) return null;
      
      return new User(rows[0]);
    } catch (error) {
      console.error('Find user by reset token error:', error);
      throw error;
    }
  }

  static async update(id, userData) {
    try {
      const updateData = [];
      const updateValues = [];
      
      if (userData.username) {
        updateData.push('username = ?');
        updateValues.push(userData.username);
      }
      
      if (userData.first_name) {
        updateData.push('first_name = ?');
        updateValues.push(userData.first_name);
      }
      
      if (userData.last_name) {
        updateData.push('last_name = ?');
        updateValues.push(userData.last_name);
      }
      
      if (userData.phone) {
        updateData.push('phone = ?');
        updateValues.push(userData.phone);
      }
      
      if (userData.profile_image) {
        updateData.push('profile_image = ?');
        updateValues.push(userData.profile_image);
      }
      
      if (userData.bio) {
        updateData.push('bio = ?');
        updateValues.push(userData.bio);
      }
      
      if (userData.password) {
        const hashedPassword = await this.hashPassword(userData.password);
        updateData.push('password = ?');
        updateValues.push(hashedPassword);
      }
      
      if (updateData.length === 0) {
        const [user] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
        if (user.length === 0) return null;
        
        delete user[0].password;
        
        return new User(user[0]);
      }
      
      updateValues.push(id);
      
      await pool.execute(
        `UPDATE users SET ${updateData.join(', ')} WHERE id = ?`,
        updateValues
      );

      const [user] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
      
      delete user[0].password;
      
      return new User(user[0]);
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      await pool.execute('DELETE FROM users WHERE id = ?', [id]);
      return true;
    } catch (error) {
      console.error('Delete user error:', error);
      throw error;
    }
  }

  getSignedJwtToken() {
    return jwt.sign(
      { id: this.id, user_type: this.user_type },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRE }
    );
  }

  // Други методи, които могат да бъдат добавени
}

module.exports = User; 