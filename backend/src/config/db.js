const { Pool } = require('pg');

// Neon (y la mayoría de proveedores en la nube) requieren SSL; una
// Postgres local normalmente no lo tiene habilitado, así que solo lo
// exigimos cuando la cadena de conexión no apunta a localhost.
const esLocal = /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL || '');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: esLocal ? false : { rejectUnauthorized: false },
});

pool.on('error', (err) => {
  console.error('Error inesperado en el pool de PostgreSQL', err);
});

module.exports = { pool };