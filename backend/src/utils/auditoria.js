const { pool } = require('../config/db');

/**
 * Registra un evento de auditoría. Nunca debe romper la petición que la
 * originó: si falla el guardado del registro, solo se loguea el error.
 */
async function registrarAuditoria({ medicoId, accion, entidad, entidadId, detalle, ip }) {
  try {
    await pool.query(
      `INSERT INTO public.auditoria (medico_id, accion, entidad, entidad_id, detalle, ip)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [medicoId || null, accion, entidad, entidadId || null, detalle || null, ip || null]
    );
  } catch (err) {
    console.error('No fue posible registrar la auditoría', err);
  }
}

module.exports = { registrarAuditoria };
