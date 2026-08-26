const { pool } = require('../config/db');

const SCHEMA_REGEX = /^[a-z_][a-z0-9_]*$/;

/**
 * Reserva un cliente dedicado del pool para toda la duración de la petición
 * y fija su search_path al esquema del médico autenticado. Un pool.query()
 * suelto no sirve aquí: cada llamada podría tomar un cliente físico distinto
 * y perder el SET search_path ya aplicado.
 */
async function asignarTenant(req, res, next) {
  const schemaName = req.user?.schema_name;

  if (!schemaName || !SCHEMA_REGEX.test(schemaName)) {
    return res.status(400).json({ error: 'schema_name inválido en el token' });
  }

  let client;
  try {
    client = await pool.connect();
    await client.query(`SET search_path TO "${schemaName}", public`);
  } catch (err) {
    if (client) client.release();
    return res.status(500).json({ error: 'No fue posible preparar el contexto de base de datos' });
  }

  req.db = client;

  let liberado = false;
  const liberar = () => {
    if (liberado) return;
    liberado = true;
    client.release();
  };
  res.on('finish', liberar);
  res.on('close', liberar);

  next();
}

module.exports = { asignarTenant };
