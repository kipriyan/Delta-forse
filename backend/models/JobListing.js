const { pool } = require('../config/db');

class JobListing {
  constructor(jobData) {
    this.id = jobData.id;
    this.company_id = jobData.company_id;
    this.user_id = jobData.user_id;
    this.title = jobData.title;
    this.description = jobData.description;
    this.requirements = jobData.requirements;
    this.benefits = jobData.benefits;
    this.location = jobData.location;
    this.salary = jobData.salary;
    this.job_type = jobData.job_type;
    this.category = jobData.category;
    this.industry = jobData.industry;
    this.experience_level = jobData.experience_level;
    this.education_level = jobData.education_level;
    this.status = jobData.status;
    this.application_deadline = jobData.application_deadline;
    this.views = jobData.views;
    this.applications = jobData.applications;
    this.created_at = jobData.created_at;
    this.updated_at = jobData.updated_at;

    // Допълнителни полета след JOIN
    this.company_name = jobData.company_name;
    this.logo_url = jobData.logo_url;
    this.skills = jobData.skills || [];
  }

  static async create(jobData) {
    try {
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();

        // Вмъкване на основната информация за обявата
        const [result] = await conn.execute(
          `INSERT INTO job_listings 
          (company_id, user_id, title, description, requirements, benefits, location, salary, 
           job_type, category, industry, experience_level, education_level, status, application_deadline) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            jobData.company_id,
            jobData.user_id,
            jobData.title,
            jobData.description,
            jobData.requirements || null,
            jobData.benefits || null,
            jobData.location,
            jobData.salary || null,
            jobData.job_type,
            jobData.category || null,
            jobData.industry || null,
            jobData.experience_level || null,
            jobData.education_level || null,
            jobData.status || 'active',
            jobData.application_deadline || null
          ]
        );

        const jobId = result.insertId;

        // Ако са подадени умения, добавяме ги към обявата
        if (jobData.skills && Array.isArray(jobData.skills) && jobData.skills.length > 0) {
          // Създаване на стойностите за масово вмъкване
          const skillValues = jobData.skills.map(skillId => [jobId, skillId]);
          
          if (skillValues.length > 0) {
            // Масово вмъкване на уменията
            await conn.batch(
              'INSERT INTO job_skills (job_id, skill_id) VALUES (?, ?)',
              skillValues
            );
          }
        }

        await conn.commit();

        // Връщаме създадената обява с детайли за компанията
        const [jobs] = await conn.execute(`
          SELECT j.*, c.company_name, c.logo_url
          FROM job_listings j
          INNER JOIN companies c ON j.company_id = c.id
          WHERE j.id = ?
        `, [jobId]);

        // Добавяне на уменията към обявата
        if (jobs.length > 0) {
          const [skills] = await conn.execute(`
            SELECT s.id, s.name
            FROM skills s
            INNER JOIN job_skills js ON s.id = js.skill_id
            WHERE js.job_id = ?
          `, [jobId]);

          jobs[0].skills = skills;
          return new JobListing(jobs[0]);
        }

        return null;
      } catch (error) {
        await conn.rollback();
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      console.error('Create job error:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      // Намиране на обявата с информация за компанията
      const [jobs] = await pool.execute(`
        SELECT j.*, c.company_name, c.logo_url
        FROM job_listings j
        INNER JOIN companies c ON j.company_id = c.id
        WHERE j.id = ?
      `, [id]);

      if (jobs.length === 0) return null;

      // Намиране на уменията, свързани с обявата
      const [skills] = await pool.execute(`
        SELECT s.id, s.name
        FROM skills s
        INNER JOIN job_skills js ON s.id = js.skill_id
        WHERE js.job_id = ?
      `, [id]);

      jobs[0].skills = skills;

      // Обновяване на броя на прегледите
      await pool.execute('UPDATE job_listings SET views = views + 1 WHERE id = ?', [id]);

      return new JobListing(jobs[0]);
    } catch (error) {
      console.error('Find job by id error:', error);
      throw error;
    }
  }

  static async findAll() {
    try {
      // Най-проста заявка
      const [rows] = await pool.query('SELECT * FROM job_listings LIMIT 10');
      console.log('Query executed successfully, results:', rows ? rows.length : 'undefined');
      
      // Връщаме празен масив, ако няма резултати
      return rows || [];
    } catch (error) {
      console.error('Find all jobs error:', error);
      // Връщаме празен масив при грешка
      return [];
    }
  }

  static async update(id, jobData) {
    try {
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        
        // Проверка дали обявата съществува
        const [existingJob] = await conn.execute('SELECT * FROM job_listings WHERE id = ?', [id]);
        if (existingJob.length === 0) {
          return null;
        }

        // Създаване на масиви за SET параметрите
        const updateData = [];
        const updateValues = [];

        // Добавяне на полета за обновяване
        if (jobData.title) {
          updateData.push('title = ?');
          updateValues.push(jobData.title);
        }
        
        if (jobData.description) {
          updateData.push('description = ?');
          updateValues.push(jobData.description);
        }
        
        if (jobData.hasOwnProperty('requirements')) {
          updateData.push('requirements = ?');
          updateValues.push(jobData.requirements);
        }
        
        if (jobData.hasOwnProperty('benefits')) {
          updateData.push('benefits = ?');
          updateValues.push(jobData.benefits);
        }
        
        if (jobData.location) {
          updateData.push('location = ?');
          updateValues.push(jobData.location);
        }
        
        if (jobData.hasOwnProperty('salary')) {
          updateData.push('salary = ?');
          updateValues.push(jobData.salary);
        }
        
        if (jobData.job_type) {
          updateData.push('job_type = ?');
          updateValues.push(jobData.job_type);
        }
        
        if (jobData.hasOwnProperty('category')) {
          updateData.push('category = ?');
          updateValues.push(jobData.category);
        }
        
        if (jobData.hasOwnProperty('industry')) {
          updateData.push('industry = ?');
          updateValues.push(jobData.industry);
        }
        
        if (jobData.hasOwnProperty('experience_level')) {
          updateData.push('experience_level = ?');
          updateValues.push(jobData.experience_level);
        }
        
        if (jobData.hasOwnProperty('education_level')) {
          updateData.push('education_level = ?');
          updateValues.push(jobData.education_level);
        }
        
        if (jobData.status) {
          updateData.push('status = ?');
          updateValues.push(jobData.status);
        }
        
        if (jobData.hasOwnProperty('application_deadline')) {
          updateData.push('application_deadline = ?');
          updateValues.push(jobData.application_deadline);
        }

        // Ако няма нищо за обновяване в основната информация
        if (updateData.length === 0 && (!jobData.skills || !Array.isArray(jobData.skills))) {
          return await this.findById(id);
        }

        // Ако има полета за обновяване в основната информация
        if (updateData.length > 0) {
          // Добавяне на ID към стойностите
          updateValues.push(id);
          
          // Изпълнение на заявката за обновяване
          await conn.execute(
            `UPDATE job_listings SET ${updateData.join(', ')} WHERE id = ?`,
            updateValues
          );
        }

        // Ако са подадени умения, актуализираме ги
        if (jobData.skills && Array.isArray(jobData.skills)) {
          // Изтриване на съществуващите връзки
          await conn.execute('DELETE FROM job_skills WHERE job_id = ?', [id]);
          
          // Създаване на нови връзки
          const skillValues = jobData.skills.map(skillId => [id, skillId]);
          
          if (skillValues.length > 0) {
            await conn.batch(
              'INSERT INTO job_skills (job_id, skill_id) VALUES (?, ?)',
              skillValues
            );
          }
        }

        await conn.commit();

        // Връщане на обновената обява
        return await this.findById(id);
      } catch (error) {
        await conn.rollback();
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      console.error('Update job error:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      await pool.execute('DELETE FROM job_listings WHERE id = ?', [id]);
      return true;
    } catch (error) {
      console.error('Delete job error:', error);
      throw error;
    }
  }

  static async findByUserId(userId, page = 1, limit = 10) {
    try {
      // Получаване на общия брой обяви
      const [countResult] = await pool.execute(
        'SELECT COUNT(*) as total FROM job_listings WHERE user_id = ?',
        [userId]
      );
      const total = countResult[0].total;

      // Пагинация
      const offset = (page - 1) * limit;
      
      // Намиране на обявите за потребителя с информация за компанията
      const [jobs] = await pool.execute(`
        SELECT j.*, c.company_name, c.logo_url
        FROM job_listings j
        INNER JOIN companies c ON j.company_id = c.id
        WHERE j.user_id = ?
        ORDER BY j.created_at DESC
        LIMIT ? OFFSET ?
      `, [userId, parseInt(limit), offset]);

      // Добавяне на уменията към всяка обява
      for (let job of jobs) {
        const [skills] = await pool.execute(`
          SELECT s.id, s.name
          FROM skills s
          INNER JOIN job_skills js ON s.id = js.skill_id
          WHERE js.job_id = ?
        `, [job.id]);
        
        job.skills = skills;
      }

      return {
        jobs: jobs.map(job => new JobListing(job)),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Find jobs by user id error:', error);
      throw error;
    }
  }

  static async findByCompanyId(companyId, page = 1, limit = 10) {
    try {
      // Получаване на общия брой обяви
      const [countResult] = await pool.execute(
        'SELECT COUNT(*) as total FROM job_listings WHERE company_id = ?',
        [companyId]
      );
      const total = countResult[0].total;

      // Пагинация
      const offset = (page - 1) * limit;
      
      // Намиране на обявите за компанията с информация за компанията
      const [jobs] = await pool.execute(`
        SELECT j.*, c.company_name, c.logo_url
        FROM job_listings j
        INNER JOIN companies c ON j.company_id = c.id
        WHERE j.company_id = ?
        ORDER BY j.created_at DESC
        LIMIT ? OFFSET ?
      `, [companyId, parseInt(limit), offset]);

      // Добавяне на уменията към всяка обява
      for (let job of jobs) {
        const [skills] = await pool.execute(`
          SELECT s.id, s.name
          FROM skills s
          INNER JOIN job_skills js ON s.id = js.skill_id
          WHERE js.job_id = ?
        `, [job.id]);
        
        job.skills = skills;
      }

      return {
        jobs: jobs.map(job => new JobListing(job)),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Find jobs by company id error:', error);
      throw error;
    }
  }

  static async search(query, page = 1, limit = 10) {
    try {
      // Създаване на параметрите за търсене
      const searchParam = `%${query}%`;
      
      // Получаване на общия брой резултати
      const [countResult] = await pool.execute(`
        SELECT COUNT(*) as total 
        FROM job_listings j
        INNER JOIN companies c ON j.company_id = c.id
        WHERE j.status = 'active' AND 
          (j.title LIKE ? OR j.description LIKE ? OR 
           j.location LIKE ? OR c.company_name LIKE ?)
      `, [searchParam, searchParam, searchParam, searchParam]);
      
      const total = countResult[0].total;

      // Пагинация
      const offset = (page - 1) * limit;
      
      // Изпълнение на търсенето
      const [jobs] = await pool.execute(`
        SELECT j.*, c.company_name, c.logo_url
        FROM job_listings j
        INNER JOIN companies c ON j.company_id = c.id
        WHERE j.status = 'active' AND 
          (j.title LIKE ? OR j.description LIKE ? OR 
           j.location LIKE ? OR c.company_name LIKE ?)
        ORDER BY j.created_at DESC
        LIMIT ? OFFSET ?
      `, [searchParam, searchParam, searchParam, searchParam, parseInt(limit), offset]);

      // Добавяне на уменията към всяка обява
      for (let job of jobs) {
        const [skills] = await pool.execute(`
          SELECT s.id, s.name
          FROM skills s
          INNER JOIN job_skills js ON s.id = js.skill_id
          WHERE js.job_id = ?
        `, [job.id]);
        
        job.skills = skills;
      }

      return {
        jobs: jobs.map(job => new JobListing(job)),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Search jobs error:', error);
      throw error;
    }
  }
}

module.exports = JobListing; 