const mysql = require('mysql2/promise');
const config = require('./config');

const pool = mysql.createPool({
  host: config.DB_CONFIG.host,
  user: config.DB_CONFIG.user,
  password: config.DB_CONFIG.password,
  database: config.DB_CONFIG.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const connectDB = async () => {
  try {
    const connection = await pool.getConnection();
    console.log(`MySQL база данни свързана: ${config.DB_CONFIG.host}`);
    connection.release();
    return pool;
  } catch (error) {
    console.error(`Грешка при свързване с базата данни: ${error.message}`);
    process.exit(1);
  }
};

module.exports = { connectDB, pool }; 