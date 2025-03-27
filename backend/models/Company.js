const { pool } = require('../config/db');

class Company {
  constructor(companyData) {
    this.id = companyData.id;
    this.user_id = companyData.user_id;
    this.company_name = companyData.company_name;
    this.description = companyData.description;
    this.industry = companyData.industry;
    this.company_size = companyData.company_size;
    this.website = companyData.website;
    this.logo_url = companyData.logo_url;
  }

  static async create(companyData) {
    try {
      const [result] = await pool.execute(
        'INSERT INTO companies (user_id, company_name, description, industry, company_size, website, logo_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          companyData.user_id,
          companyData.company_name,
          companyData.description || null,
          companyData.industry || null,
          companyData.company_size || null,
          companyData.website || null,
          companyData.logo_url || null
        ]
      );

      const [company] = await pool.execute('SELECT * FROM companies WHERE id = ?', [result.insertId]);
      return new Company(company[0]);
    } catch (error) {
      console.error('Create company error:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const [rows] = await pool.execute('SELECT * FROM companies WHERE id = ?', [id]);
      
      if (rows.length === 0) return null;
      
      return new Company(rows[0]);
    } catch (error) {
      console.error('Find company error:', error);
      throw error;
    }
  }

  static async findByUserId(userId) {
    try {
      const [rows] = await pool.execute('SELECT * FROM companies WHERE user_id = ?', [userId]);
      
      if (rows.length === 0) return null;
      
      return new Company(rows[0]);
    } catch (error) {
      console.error('Find company by user error:', error);
      throw error;
    }
  }

  static async update(id, companyData) {
    try {
      await pool.execute(
        'UPDATE companies SET company_name = ?, description = ?, industry = ?, company_size = ?, website = ?, logo_url = ? WHERE id = ?',
        [
          companyData.company_name,
          companyData.description || null,
          companyData.industry || null,
          companyData.company_size || null,
          companyData.website || null,
          companyData.logo_url || null,
          id
        ]
      );

      const [company] = await pool.execute('SELECT * FROM companies WHERE id = ?', [id]);
      return new Company(company[0]);
    } catch (error) {
      console.error('Update company error:', error);
      throw error;
    }
  }

  static async findAll(limit = 10, offset = 0) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM companies LIMIT ? OFFSET ?',
        [limit, offset]
      );
      
      return rows.map(company => new Company(company));
    } catch (error) {
      console.error('Find all companies error:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      await pool.execute('DELETE FROM companies WHERE id = ?', [id]);
      return true;
    } catch (error) {
      console.error('Delete company error:', error);
      throw error;
    }
  }
}

module.exports = Company; 