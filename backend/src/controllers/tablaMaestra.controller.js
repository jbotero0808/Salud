const { registrarAuditoria } = require('../utils/auditoria');

async function listarPorTipo(req, res, next) {
  try {
    const { rows } = await req.db.query(
      `SELECT id, nombre, tipo FROM tabla_maestra WHERE tipo = $1 AND activo = 's' ORDER BY nombre`,
      [req.params.tipo]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function crear(req, res, next) {
  const { nombre, tipo } = req.body;
  if (!nombre || !nombre.trim() || !tipo) {
    return res.status(400).json({ error: 'nombre y tipo son obligatorios' });
  }
  try {
    // Si ya existía pero se había eliminado (activo='n'), se reactiva en
    // vez de fallar por la restricción UNIQUE (nombre, tipo).
    const { rows } = await req.db.query(
      `INSERT INTO tabla_maestra (nombre, tipo, activo) VALUES ($1, $2, 's')
       ON CONFLICT (nombre, tipo) DO UPDATE SET activo = 's'
       RETURNING id, nombre, tipo`,
      [nombre.trim(), tipo]
    );
    await registrarAuditoria({
      medicoId: req.user.medico_id, accion: 'CREAR', entidad: 'tabla_maestra', entidadId: rows[0].id, detalle: `${tipo}: ${rows[0].nombre}`, ip: req.ip,
    });
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// Baja lógica: nunca se borra el registro, solo se marca activo = 'n'.
async function eliminar(req, res, next) {
  try {
    const { rowCount } = await req.db.query(
      `UPDATE tabla_maestra SET activo = 'n' WHERE id = $1 AND activo = 's'`,
      [req.params.id]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Registro no encontrado' });
    await registrarAuditoria({
      medicoId: req.user.medico_id, accion: 'ELIMINAR', entidad: 'tabla_maestra', entidadId: Number(req.params.id), ip: req.ip,
    });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { listarPorTipo, crear, eliminar };
