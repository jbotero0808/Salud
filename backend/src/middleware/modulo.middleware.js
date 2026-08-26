const { pool } = require('../config/db');

/**
 * Verifica que el médico autenticado tenga un permiso activo para el
 * módulo indicado (public.permisos_medicos). Usa el pool directamente
 * porque consulta el esquema public, no el esquema del tenant.
 */
function requiereModulo(nombreModulo) {
  return async (req, res, next) => {
    try {
      const { rows } = await pool.query(
        `SELECT pm.activo
           FROM public.permisos_medicos pm
           JOIN public.modulos m ON m.id = pm.modulo_id
          WHERE pm.medico_id = $1 AND m.nombre = $2`,
        [req.user.medico_id, nombreModulo]
      );

      if (rows.length === 0 || !rows[0].activo) {
        return res.status(403).json({ error: `No tienes acceso al módulo "${nombreModulo}"` });
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { requiereModulo };
