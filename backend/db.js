const mysql = require('mysql2');
require('dotenv').config();

// MySQL database connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// check database connection
db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err.message);
    return;
  }

  console.log('Connected to MySQL database successfully!');
});

module.exports = db;
