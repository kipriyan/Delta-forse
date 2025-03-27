const { pool } = require('../config/db');

class EquipmentRental {
  constructor(rentalData) {
    this.id = rentalData.id;
    this.user_id = rentalData.user_id;
    this.equipment_id = rentalData.equipment_id;
    this.owner_id = rentalData.owner_id;
    this.rental_start = rentalData.rental_start;
    this.rental_end = rentalData.rental_end;
    this.total_price = rentalData.total_price;
    this.status = rentalData.status;
    this.message = rentalData.message;
    this.created_at = rentalData.created_at;
    this.updated_at = rentalData.updated_at;
    
    // Допълнителни полета след JOIN
    this.equipment_title = rentalData.equipment_title;
    this.equipment_image = rentalData.equipment_image;
    this.daily_rate = rentalData.daily_rate;
    this.renter_name = rentalData.renter_name;
    this.renter_email = rentalData.renter_email;
    this.owner_name = rentalData.owner_name;
    this.owner_email = rentalData.owner_email;
  }

  // Създаване на нова заявка за наемане
  static async create(rentalData) {
    try {
      // Получаване на собственика на екипировката
      const [equipmentOwner] = await pool.execute(
        'SELECT user_id, price FROM equipment WHERE id = ?',
        [rentalData.equipment_id]
      );
      
      if (equipmentOwner.length === 0) {
        throw new Error('Екипировката не е намерена');
      }
      
      // Изчисляване на общата цена
      const start = new Date(rentalData.rental_start);
      const end = new Date(rentalData.rental_end);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      const total_price = days * equipmentOwner[0].price;
      
      // Вмъкване на заявката за наемане с правилните имена на колоните според таблицата
      const [result] = await pool.execute(`
        INSERT INTO rental_requests (
          user_id, equipment_id, start_date, end_date,
          total_price, status, message
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        rentalData.user_id,
        rentalData.equipment_id,
        rentalData.rental_start,
        rentalData.rental_end,
        total_price,
        'pending',
        rentalData.message || null
      ]);
      
      // Получаване на създадената заявка с детайли - премахваме несъществуващото поле image_url
      const [rental] = await pool.execute(`
        SELECT r.*, e.title as equipment_title, 
          e.price as daily_rate, 
          CONCAT(u1.first_name, ' ', u1.last_name) as renter_name,
          u1.email as renter_email, 
          CONCAT(u2.first_name, ' ', u2.last_name) as owner_name,
          u2.email as owner_email
        FROM rental_requests r
        INNER JOIN equipment e ON r.equipment_id = e.id
        INNER JOIN users u1 ON r.user_id = u1.id
        INNER JOIN users u2 ON e.user_id = u2.id
        WHERE r.id = ?
      `, [result.insertId]);
      
      // Преобразуване на имената на полетата за съвместимост с останалия код
      const rentalWithCompatibleFields = {
        ...rental[0],
        rental_start: rental[0].start_date,
        rental_end: rental[0].end_date
      };
      
      return new EquipmentRental(rentalWithCompatibleFields);
    } catch (error) {
      console.error('EquipmentRental create error:', error);
      throw error;
    }
  }

  // Намиране на заявка за наемане по ID
  static async findById(id) {
    try {
      const [rental] = await pool.execute(`
        SELECT er.*, e.title as equipment_title,
          e.price as daily_rate, CONCAT(u1.first_name, ' ', u1.last_name) as renter_name,
          u1.email as renter_email, CONCAT(u2.first_name, ' ', u2.last_name) as owner_name,
          u2.email as owner_email
        FROM rental_requests er
        INNER JOIN equipment e ON er.equipment_id = e.id
        INNER JOIN users u1 ON er.user_id = u1.id
        INNER JOIN users u2 ON e.user_id = u2.id
        WHERE er.id = ?
      `, [id]);
      
      if (rental.length === 0) {
        return null;
      }
      
      // Преобразуване на имената на полетата за съвместимост с модела
      const rentalWithCompatibleFields = {
        ...rental[0],
        rental_start: rental[0].start_date,
        rental_end: rental[0].end_date
      };
      
      return new EquipmentRental(rentalWithCompatibleFields);
    } catch (error) {
      console.error('EquipmentRental findById error:', error);
      throw error;
    }
  }

  // Намиране на заявки за наемане от потребител
  static async findByUserId(userId, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      
      const [rentals] = await pool.execute(`
        SELECT er.*, e.title as equipment_title, e.image_url as equipment_image,
          e.price as daily_rate, CONCAT(u1.first_name, ' ', u1.last_name) as renter_name,
          u1.email as renter_email, CONCAT(u2.first_name, ' ', u2.last_name) as owner_name,
          u2.email as owner_email
        FROM rental_requests er
        INNER JOIN equipment e ON er.equipment_id = e.id
        INNER JOIN users u1 ON er.user_id = u1.id
        INNER JOIN users u2 ON er.owner_id = u2.id
        WHERE er.user_id = ?
        ORDER BY er.created_at DESC
        LIMIT ? OFFSET ?
      `, [userId, parseInt(limit), parseInt(offset)]);
      
      const [countResult] = await pool.execute(
        'SELECT COUNT(*) as total FROM rental_requests WHERE user_id = ?',
        [userId]
      );
      
      const total = countResult[0].total;
      
      return {
        rentals: rentals.map(rental => new EquipmentRental(rental)),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('EquipmentRental findByUserId error:', error);
      throw error;
    }
  }

  // Намиране на заявки към собственик на екипировка
  static async findByOwnerId(ownerId, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      
      const [rentals] = await pool.execute(`
        SELECT er.*, e.title as equipment_title, e.image_url as equipment_image,
          e.price as daily_rate, CONCAT(u1.first_name, ' ', u1.last_name) as renter_name,
          u1.email as renter_email, CONCAT(u2.first_name, ' ', u2.last_name) as owner_name,
          u2.email as owner_email
        FROM rental_requests er
        INNER JOIN equipment e ON er.equipment_id = e.id
        INNER JOIN users u1 ON er.user_id = u1.id
        INNER JOIN users u2 ON er.owner_id = u2.id
        WHERE er.owner_id = ?
        ORDER BY er.created_at DESC
        LIMIT ? OFFSET ?
      `, [ownerId, parseInt(limit), parseInt(offset)]);
      
      const [countResult] = await pool.execute(
        'SELECT COUNT(*) as total FROM rental_requests WHERE owner_id = ?',
        [ownerId]
      );
      
      const total = countResult[0].total;
      
      return {
        rentals: rentals.map(rental => new EquipmentRental(rental)),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('EquipmentRental findByOwnerId error:', error);
      throw error;
    }
  }

  // Обновяване на статуса на заявката
  static async updateStatus(id, status, message = null) {
    try {
      // Проверка за валиден статус
      const validStatuses = ['pending', 'approved', 'rejected', 'cancelled', 'completed'];
      if (!validStatuses.includes(status)) {
        throw new Error('Невалиден статус');
      }
      
      let query;
      let params;
      
      if (message) {
        query = `
          UPDATE rental_requests
          SET status = ?, message = ?, updated_at = NOW()
          WHERE id = ?
        `;
        params = [status, message, id];
      } else {
        query = `
          UPDATE rental_requests
          SET status = ?, updated_at = NOW()
          WHERE id = ?
        `;
        params = [status, id];
      }
      
      await pool.execute(query, params);
      
      return await this.findById(id);
    } catch (error) {
      console.error('EquipmentRental updateStatus error:', error);
      throw error;
    }
  }
  //moje bi nenujno
  // Изтриване на заявка за наем
  static async delete(id) {
    try {
      await pool.execute('DELETE FROM rental_requests WHERE id = ?', [id]);
      return true;
    } catch (error) {
      console.error('EquipmentRental delete error:', error);
      throw error;
    }
  }
}

module.exports = EquipmentRental; 