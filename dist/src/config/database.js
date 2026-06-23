require('dotenv').config();

module.exports = {
  development: {
    username: process.env.MYSQLUSER || 'user_horarios',
    password: process.env.MYSQLPASSWORD || 'user_password',
    database: process.env.MYSQLDATABASE || 'horarios_db',
    host: process.env.MYSQLHOST || '127.0.0.1',
    port: process.env.MYSQLPORT || 5432,
    dialect: 'postgres',
    logging: false
  },
  test: {
    username: process.env.MYSQLUSER || 'root',
    password: process.env.MYSQLPASSWORD || null,
    database: process.env.MYSQLDATABASE || 'horarios_test',
    host: process.env.MYSQLHOST || '127.0.0.1',
    port: process.env.MYSQLPORT || 5432,
    dialect: 'postgres',
    logging: false
  },
  production: {
    username: process.env.MYSQLUSER || 'root',
    password: process.env.MYSQLPASSWORD || null,
    database: process.env.MYSQLDATABASE || 'horarios_prod',
    host: process.env.MYSQLHOST || '127.0.0.1',
    port: process.env.MYSQLPORT || 5432,
    dialect: 'postgres',
    logging: false
  }
};
