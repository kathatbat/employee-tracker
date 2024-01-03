const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'rootroot',
  database: 'employee_db',
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL');
    return;
  }
  console.log('Connected to MySQL');
});

module.exports = db;