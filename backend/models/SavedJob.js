const { pool } = require('../config/db');

class SavedJob {
  constructor(savedJobData) {
    this.id = savedJobData.id;
    this.user_id = savedJobData.user_id;
    this.job_id = savedJobData.job_id;
    this.created_at = savedJobData.created_at;
  }

  static async create(savedJobData) {
    try {
      const [result] = await pool.execute(
        'INSERT INTO saved_jobs (user_id, job_id) VALUES (?, ?)',
        [savedJobData.user_id, savedJobData.job_id]
      );

      const [savedJob] = await pool.execute('SELECT * FROM saved_jobs WHERE id = ?', [result.insertId]);
      return new SavedJob(savedJob[0]);
    } catch (error) {
      console.error('Create saved job error:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const [rows] = await pool.execute('SELECT * FROM saved_jobs WHERE id = ?', [id]);
      
      if (rows.length === 0) return null;
      
      return new SavedJob(rows[0]);
    } catch (error) {
      console.error('Find saved job error:', error);
      throw error;
    }
  }

  static async findByUserAndJob(userId, jobId) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM saved_jobs WHERE user_id = ? AND job_id = ?',
        [userId, jobId]
      );
      
      if (rows.length === 0) return null;
      
      return new SavedJob(rows[0]);
    } catch (error) {
      console.error('Find saved job by user and job error:', error);
      throw error;
    }
  }

  static async findByUserId(userId) {
    try {
      const [rows] = await pool.execute(
        `SELECT sj.*, j.title, j.location, j.salary, j.job_type, c.company_name
         FROM saved_jobs sj
         JOIN job_listings j ON sj.job_id = j.id
         JOIN companies c ON j.company_id = c.id
         WHERE sj.user_id = ?`,
        [userId]
      );
      
      return rows;
    } catch (error) {
      console.error('Find saved jobs by user error:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      await pool.execute('DELETE FROM saved_jobs WHERE id = ?', [id]);
      return true;
    } catch (error) {
      console.error('Delete saved job error:', error);
      throw error;
    }
  }

  static async deleteByUserAndJob(userId, jobId) {
    try {
      await pool.execute(
        'DELETE FROM saved_jobs WHERE user_id = ? AND job_id = ?',
        [userId, jobId]
      );
      return true;
    } catch (error) {
      console.error('Delete saved job by user and job error:', error);
      throw error;
    }
  }
}

module.exports = SavedJob; 