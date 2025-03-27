const { pool } = require('../config/db');

class JobApplication {
  constructor(applicationData) {
    this.id = applicationData.id;
    this.job_id = applicationData.job_id;
    this.user_id = applicationData.user_id;
    this.company_id = applicationData.company_id;
    this.cover_letter = applicationData.cover_letter;
    this.resume_url = applicationData.resume_url;
    this.status = applicationData.status;
    this.created_at = applicationData.created_at;
    this.updated_at = applicationData.updated_at;
  }

  static async create(applicationData) {
    try {
      const [result] = await pool.execute(
        `INSERT INTO job_applications 
        (job_id, user_id, company_id, cover_letter, resume_url, status) 
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          applicationData.job_id,
          applicationData.user_id,
          applicationData.company_id,
          applicationData.cover_letter || null,
          applicationData.resume_url || null,
          applicationData.status || 'pending'
        ]
      );

      const [application] = await pool.execute('SELECT * FROM job_applications WHERE id = ?', [result.insertId]);
      return new JobApplication(application[0]);
    } catch (error) {
      console.error('Create application error:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const [rows] = await pool.execute('SELECT * FROM job_applications WHERE id = ?', [id]);
      
      if (rows.length === 0) return null;
      
      return new JobApplication(rows[0]);
    } catch (error) {
      console.error('Find application error:', error);
      throw error;
    }
  }

  static async findByJobId(jobId) {
    try {
      const [rows] = await pool.execute('SELECT * FROM job_applications WHERE job_id = ?', [jobId]);
      
      return rows.map(application => new JobApplication(application));
    } catch (error) {
      console.error('Find applications by job error:', error);
      throw error;
    }
  }

  static async findByUserId(userId) {
    try {
      const [rows] = await pool.execute('SELECT * FROM job_applications WHERE user_id = ?', [userId]);
      
      return rows.map(application => new JobApplication(application));
    } catch (error) {
      console.error('Find applications by user error:', error);
      throw error;
    }
  }

  static async findByCompanyId(companyId) {
    try {
      const [rows] = await pool.execute('SELECT * FROM job_applications WHERE company_id = ?', [companyId]);
      
      return rows.map(application => new JobApplication(application));
    } catch (error) {
      console.error('Find applications by company error:', error);
      throw error;
    }
  }

  static async update(id, applicationData) {
    try {
      await pool.execute(
        `UPDATE job_applications SET 
        cover_letter = ?, resume_url = ?, status = ?
        WHERE id = ?`,
        [
          applicationData.cover_letter || null,
          applicationData.resume_url || null,
          applicationData.status || 'pending',
          id
        ]
      );

      const [application] = await pool.execute('SELECT * FROM job_applications WHERE id = ?', [id]);
      return new JobApplication(application[0]);
    } catch (error) {
      console.error('Update application error:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      await pool.execute('DELETE FROM job_applications WHERE id = ?', [id]);
      return true;
    } catch (error) {
      console.error('Delete application error:', error);
      throw error;
    }
  }

  static async getApplicationsWithJobDetails(userId) {
    try {
      const [rows] = await pool.execute(
        `SELECT ja.*, j.title as job_title, j.location, j.job_type, c.company_name 
         FROM job_applications ja
         JOIN job_listings j ON ja.job_id = j.id
         JOIN companies c ON ja.company_id = c.id
         WHERE ja.user_id = ?`,
        [userId]
      );
      
      return rows;
    } catch (error) {
      console.error('Get applications with job details error:', error);
      throw error;
    }
  }
}

module.exports = JobApplication; 