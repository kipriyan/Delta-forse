const { pool } = require('../config/db');

class Equipment {
  constructor(equipmentData) {
    this.id = equipmentData.id;
    this.user_id = equipmentData.user_id;
    this.title = equipmentData.title;
    this.description = equipmentData.description;
    this.price = equipmentData.price;
    this.location = equipmentData.location;
    this.category = equipmentData.category;
    this.status = equipmentData.status;
    this.created_at = equipmentData.created_at;
    
    // Допълнителни полета след JOIN
    this.owner_name = equipmentData.owner_name;
    this.owner_email = equipmentData.owner_email;
  }

  // Създаване на нова обява за екипировка
  static async create(equipmentData) {
    try {
      // Проверка за undefined стойности и заместването им с null или подходящи стойности
      const safeData = {
        user_id: equipmentData.user_id,
        title: equipmentData.title || '',
        description: equipmentData.description || '',
        price: equipmentData.price !== undefined ? equipmentData.price : 0,
        location: equipmentData.location || '',
        category: equipmentData.category || null,
        status: equipmentData.status || 'available'
      };

      const [result] = await pool.execute(`
        INSERT INTO equipment (
          user_id, title, description, price, location, category, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        safeData.user_id,
        safeData.title,
        safeData.description,
        safeData.price,
        safeData.location,
        safeData.category,
        safeData.status
      ]);

      const [equipment] = await pool.execute(`
        SELECT e.*, u.first_name, u.last_name, u.email,
          CONCAT(u.first_name, ' ', u.last_name) as owner_name, 
          u.email as owner_email
        FROM equipment e
        LEFT JOIN users u ON e.user_id = u.id
        WHERE e.id = ?
      `, [result.insertId]);

      return new Equipment(equipment[0]);
    } catch (error) {
      console.error('Equipment create error:', error);
      throw error;
    }
  }

  // Намиране на екипировка по ID
  static async findById(id) {
    try {
      const [equipment] = await pool.execute(`
        SELECT e.*, u.first_name, u.last_name, u.email,
          CONCAT(u.first_name, ' ', u.last_name) as owner_name, 
          u.email as owner_email
        FROM equipment e
        LEFT JOIN users u ON e.user_id = u.id
        WHERE e.id = ?
      `, [id]);

      if (equipment.length === 0) {
        return null;
      }

      return new Equipment(equipment[0]);
    } catch (error) {
      console.error('Equipment findById error:', error);
      throw error;
    }
  }

  // Намиране на всичката екипировка с пагинация и филтриране
  static async findAll(page = 1, limit = 10, filters = {}) {
    try {
      // Преобразуване на page и limit в числа, за да сме сигурни
      page = Number(page);
      limit = Number(limit);
      
      let query = `
        SELECT e.*, u.first_name, u.last_name, u.email,
          CONCAT(u.first_name, ' ', u.last_name) as owner_name, 
          u.email as owner_email
        FROM equipment e
        LEFT JOIN users u ON e.user_id = u.id
        WHERE 1=1
      `;
      
      const queryParams = [];
      
      // Добавяне на филтри към заявката
      if (filters.category) {
        query += ` AND e.category = ?`;
        queryParams.push(filters.category);
      }
      
      if (filters.location) {
        query += ` AND e.location LIKE ?`;
        queryParams.push(`%${filters.location}%`);
      }
      
      // Полето condition не съществува в таблицата - премахваме го
      
      // Полетата min_daily_rate и max_daily_rate също не съществуват
      // Вместо това трябва да филтрираме по цена (price)
      if (filters.min_price) {
        query += ` AND e.price >= ?`;
        queryParams.push(Number(filters.min_price));
      }
      
      if (filters.max_price) {
        query += ` AND e.price <= ?`;
        queryParams.push(Number(filters.max_price));
      }
      
      if (filters.status) {
        query += ` AND e.status = ?`;
        queryParams.push(filters.status);
      } else {
        // По подразбиране показваме само достъпната екипировка
        query += ` AND e.status = 'available'`;
      }
      
      // Пагинация - директно вграждаме числата вместо да използваме параметри
      const offset = (page - 1) * limit;
      query += ` ORDER BY e.created_at DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;
      
      // Изпълнение на заявката
      const [equipment] = await pool.execute(query, queryParams);
      
      // Получаване на общия брой резултати
      let countQuery = `
        SELECT COUNT(*) as total
        FROM equipment e
        WHERE 1=1
      `;
      
      const countParams = [];
      
      // Добавяне на същите филтри към заявката за броене
      if (filters.category) {
        countQuery += ` AND e.category = ?`;
        countParams.push(filters.category);
      }
      
      if (filters.location) {
        countQuery += ` AND e.location LIKE ?`;
        countParams.push(`%${filters.location}%`);
      }
      
      // Премахваме полето condition
      
      // Променяме полетата за цена
      if (filters.min_price) {
        countQuery += ` AND e.price >= ?`;
        countParams.push(Number(filters.min_price));
      }
      
      if (filters.max_price) {
        countQuery += ` AND e.price <= ?`;
        countParams.push(Number(filters.max_price));
      }
      
      if (filters.status) {
        countQuery += ` AND e.status = ?`;
        countParams.push(filters.status);
      } else {
        // По подразбиране показваме само достъпната екипировка
        countQuery += ` AND e.status = 'available'`;
      }
      
      // Премахваме полето available_from
      
      const [countResult] = await pool.execute(countQuery, countParams);
      const total = countResult[0].total;
      
      return {
        equipment: equipment.map(item => new Equipment(item)),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Equipment findAll error:', error);
      throw error;
    }
  }

  // Получаване на екипировка, принадлежаща на определен потребител
  static async findByUserId(userId, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      
      const [equipment] = await pool.execute(`
        SELECT e.*, u.first_name, u.last_name, u.email,
          CONCAT(u.first_name, ' ', u.last_name) as owner_name, 
          u.email as owner_email
        FROM equipment e
        LEFT JOIN users u ON e.user_id = u.id
        WHERE e.user_id = ?
        ORDER BY e.created_at DESC
        LIMIT ? OFFSET ?
      `, [userId, parseInt(limit), parseInt(offset)]);
      
      const [countResult] = await pool.execute(
        'SELECT COUNT(*) as total FROM equipment WHERE user_id = ?',
        [userId]
      );
      
      const total = countResult[0].total;
      
      return {
        equipment: equipment.map(item => new Equipment(item)),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Equipment findByUserId error:', error);
      throw error;
    }
  }

  // Обновяване на екипировка
  static async update(id, equipmentData) {
    try {
      // Получаване на текущата екипировка
      const equipment = await this.findById(id);
      
      if (!equipment) {
        return null;
      }
      
      // Подготовка на полетата за обновяване
      const updateFields = {};
      const params = [];
      
      // Обновяване само на предоставените полета
      if (equipmentData.title !== undefined) {
        updateFields.title = '?';
        params.push(equipmentData.title);
      }
      
      if (equipmentData.description !== undefined) {
        updateFields.description = '?';
        params.push(equipmentData.description);
      }
      
      if (equipmentData.category !== undefined) {
        updateFields.category = '?';
        params.push(equipmentData.category);
      }
      
      if (equipmentData.condition !== undefined) {
        updateFields.condition = '?';
        params.push(equipmentData.condition);
      }
      
      if (equipmentData.daily_rate !== undefined) {
        updateFields.daily_rate = '?';
        params.push(equipmentData.daily_rate);
      }
      
      if (equipmentData.weekly_rate !== undefined) {
        updateFields.weekly_rate = '?';
        params.push(equipmentData.weekly_rate);
      }
      
      if (equipmentData.monthly_rate !== undefined) {
        updateFields.monthly_rate = '?';
        params.push(equipmentData.monthly_rate);
      }
      
      if (equipmentData.location !== undefined) {
        updateFields.location = '?';
        params.push(equipmentData.location);
      }
      
      if (equipmentData.available_from !== undefined) {
        updateFields.available_from = '?';
        params.push(equipmentData.available_from);
      }
      
      if (equipmentData.available_to !== undefined) {
        updateFields.available_to = '?';
        params.push(equipmentData.available_to);
      }
      
      if (equipmentData.status !== undefined) {
        updateFields.status = '?';
        params.push(equipmentData.status);
      }
      
      if (equipmentData.image_url !== undefined) {
        updateFields.image_url = '?';
        params.push(equipmentData.image_url);
      }
      
      // Добавяне на обновеното време
      updateFields.updated_at = 'NOW()';
      
      // Ако няма полета за обновяване, връщаме текущата екипировка
      if (Object.keys(updateFields).length === 0) {
        return equipment;
      }
      
      // Създаване на SQL заявката
      const setClause = Object.entries(updateFields).map(([key, value]) => `${key} = ${value}`).join(', ');
      const query = `UPDATE equipment SET ${setClause} WHERE id = ?`;
      
      // Добавяне на ID като последен параметър
      params.push(id);
      
      // Изпълнение на заявката
      await pool.execute(query, params);
      
      // Връщане на обновената екипировка
      return await this.findById(id);
    } catch (error) {
      console.error('Equipment update error:', error);
      throw error;
    }
  }

  // Изтриване на екипировка
  static async delete(id) {
    try {
      await pool.execute('DELETE FROM equipment WHERE id = ?', [id]);
      return true;
    } catch (error) {
      console.error('Equipment delete error:', error);
      throw error;
    }
  }

  // Търсене на екипировка
  static async search(query, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      const searchParam = `%${query}%`;
      
      const [equipment] = await pool.execute(`
        SELECT e.*, u.first_name, u.last_name, u.email,
          CONCAT(u.first_name, ' ', u.last_name) as owner_name, 
          u.email as owner_email
        FROM equipment e
        LEFT JOIN users u ON e.user_id = u.id
        WHERE e.status = 'available' AND 
          (e.title LIKE ? OR e.description LIKE ? OR 
           e.category LIKE ? OR e.location LIKE ?)
        ORDER BY e.created_at DESC
        LIMIT ? OFFSET ?
      `, [searchParam, searchParam, searchParam, searchParam, parseInt(limit), parseInt(offset)]);
      
      const [countResult] = await pool.execute(`
        SELECT COUNT(*) as total
        FROM equipment e
        WHERE e.status = 'available' AND 
          (e.title LIKE ? OR e.description LIKE ? OR 
           e.category LIKE ? OR e.location LIKE ?)
      `, [searchParam, searchParam, searchParam, searchParam]);
      
      const total = countResult[0].total;
      
      return {
        equipment: equipment.map(item => new Equipment(item)),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Equipment search error:', error);
      throw error;
    }
  }
}

module.exports = Equipment; 