const { pool } = require('../config/db');

class Equipment {
  constructor(data) {
    this.id = data.id;
    this.title = data.title;
    this.description = data.description;
    this.price = data.price;
    this.category = data.category;
    this.status = data.status;
    this.location = data.location;
    this.image_url = data.image_url;
    this.is_available = data.is_available;
    this.user_id = data.user_id;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    
    // Запазваме информацията за собственика
    this.owner_name = data.owner_name;
    this.owner_email = data.owner_email;
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
          user_id, title, description, price, location, category, 
          status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
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
        SELECT e.*, CONCAT(u.first_name, ' ', u.last_name) as owner_name, 
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
      // Проверка и конвертиране на page и limit към числа
      page = parseInt(page, 10) || 1;
      limit = parseInt(limit, 10) || 10;
      const offset = (page - 1) * limit;
      
      console.log('Извличане на оборудване:', { page, limit, offset, filters });
      
      // Генериране на базова заявка
      let query = `
        SELECT e.*, 
          CONCAT(u.first_name, ' ', u.last_name) as owner_name, 
          u.email as owner_email
        FROM equipment e
        JOIN users u ON e.user_id = u.id
        WHERE 1=1
      `;
      
      // Създаване на масив за параметрите
      let params = [];
      
      // Добавяне на условия за филтриране ако има такива
      if (filters.search) {
        query += ' AND (e.title LIKE ? OR e.description LIKE ?)';
        params.push(`%${filters.search}%`, `%${filters.search}%`);
      }
      
      if (filters.category) {
        query += ' AND e.category = ?';
        params.push(filters.category);
      }
      
      if (filters.location) {
        query += ' AND e.location LIKE ?';
        params.push(`%${filters.location}%`);
      }
      
      if (filters.min_price) {
        query += ' AND e.price >= ?';
        params.push(parseFloat(filters.min_price));
      }
      
      if (filters.max_price) {
        query += ' AND e.price <= ?';
        params.push(parseFloat(filters.max_price));
      }
      
      if (filters.status) {
        query += ' AND e.status = ?';
        params.push(filters.status);
      }
      
      // Заявка за общия брой резултати
      let countQuery = query.replace("e.*, CONCAT(u.first_name, ' ', u.last_name) as owner_name, u.email as owner_email", "COUNT(*) as total");
      
      const [countResult] = await pool.execute(countQuery, params);
      const total = countResult[0]?.total || 0;
      console.log('Общ брой резултати:', total);
      
      // Добавяне на сортиране
      query += ' ORDER BY e.created_at DESC';
      
      // Добавяне на LIMIT и OFFSET
      query += ` LIMIT ${limit} OFFSET ${offset}`;
      
      console.log('SQL заявка:', query);
      console.log('Параметри:', params);
      
      // Тестова заявка за директно логиране на всички потребители
      const [users] = await pool.execute("SELECT id, CONCAT(first_name, ' ', last_name) as full_name FROM users");
      console.log('Потребители в базата:', users);
      
      // Изпълнение на основната заявка
      const [equipment] = await pool.execute(query, params);
      
      console.log('Брой извлечени оборудвания:', equipment.length);
      if (equipment.length > 0) {
        console.log('Първо оборудване:', {
          id: equipment[0].id,
          title: equipment[0].title,
          owner_name: equipment[0].owner_name,
          user_id: equipment[0].user_id
        });
        
        // Проверяваме за валидни user_id в данните
        console.log('User IDs в оборудването:', equipment.map(item => item.user_id));
        
        // Директна проверка за потребител с ID-то от първото оборудване
        if (equipment[0].user_id) {
          const [specificUser] = await pool.execute(
            "SELECT id, CONCAT(first_name, ' ', last_name) as full_name FROM users WHERE id = ?", 
            [equipment[0].user_id]
          );
          console.log('Проверка за потребител:', specificUser);
        }
      }
      
      // Връщане на резултата с пълната информация за собствениците
      return {
        equipment: equipment.map(item => new Equipment(item)),
        pagination: {
          page,
          limit,
          total: parseInt(countResult[0].total, 10),
          pages: Math.ceil(countResult[0].total / limit)
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