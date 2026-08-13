const { Pool } = require('pg');
const config = require('../config/config');

const pool = new Pool({ connectionString: config.dbConnString });

module.exports = pool;
