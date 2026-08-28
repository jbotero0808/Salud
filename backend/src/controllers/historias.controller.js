const { registrarAuditoria } = require('../utils/auditoria');

async function listarPorPaciente(req, res, next) {
  try {
    const { rows } = await req.db.query(
      `SELECT * FROM historias_clinicas WHERE paciente_id = $1 AND activo = 's' ORDER BY fecha DESC`,
      [req.params.pacienteId]
    );
    await registrarAuditoria({
      medicoId: req.user.medico_id, accion: 'VER', entidad: 'historias_clinicas',
      detalle: `historial del paciente ${req.params.pacienteId} (${rows.length} registros)`, ip: req.ip,
    });
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function obtener(req, res, next) {
  try {
    const { rows } = await req.db.query(`SELECT * FROM historias_clinicas WHERE id = $1 AND activo = 's'`, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Registro no encontrado' });
    await registrarAuditoria({
      medicoId: req.user.medico_id, accion: 'VER', entidad: 'historias_clinicas', entidadId: rows[0].id, ip: req.ip,
    });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

const DURACION_REVISION_HORAS = 1;

async function crear(req, res, next) {
  const {
    paciente_id, fecha, tipo_consulta, motivo_consulta, diagnostico,
    tratamiento, observaciones, imagen_url, proxima_revision,
  } = req.body;
  if (!paciente_id || !tipo_consulta) {
    return res.status(400).json({ error: 'paciente_id y tipo_consulta son obligatorios' });
  }
  try {
    const { rows } = await req.db.query(
      `INSERT INTO historias_clinicas
        (paciente_id, fecha, tipo_consulta, motivo_consulta, diagnostico, tratamiento, observaciones, imagen_url, proxima_revision)
       VALUES ($1, COALESCE($2, now()), $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        paciente_id,
        fecha || null,
        tipo_consulta,
        motivo_consulta || null,
        diagnostico || null,
        tratamiento || null,
        observaciones || null,
        imagen_url || null,
        proxima_revision || null,
      ]
    );
    const historia = rows[0];

    await registrarAuditoria({
      medicoId: req.user.medico_id, accion: 'CREAR', entidad: 'historias_clinicas', entidadId: historia.id,
      detalle: `paciente ${paciente_id}, tipo_consulta: ${tipo_consulta}`, ip: req.ip,
    });

    // Si se programó una próxima revisión, se agenda automáticamente
    // la cita correspondiente. No se aborta la creación de la historia
    // si esto falla: la evolución clínica ya quedó guardada.
    if (proxima_revision) {
      try {
        const inicio = new Date(proxima_revision);
        const fin = new Date(inicio.getTime() + DURACION_REVISION_HORAS * 60 * 60 * 1000);
        await req.db.query(
          `INSERT INTO citas (paciente_id, fecha_inicio, fecha_fin, estado, notas)
           VALUES ($1, $2, $3, 'programada', $4)`,
          [paciente_id, inicio, fin, `Próxima revisión agendada desde la historia clínica (${tipo_consulta})`]
        );
      } catch (errCita) {
        console.error('No fue posible crear la cita de seguimiento', errCita);
      }
    }

    res.status(201).json(historia);
  } catch (err) {
    next(err);
  }
}

async function actualizar(req, res, next) {
  const { tipo_consulta, motivo_consulta, diagnostico, tratamiento, observaciones, imagen_url, proxima_revision } = req.body;
  try {
    const { rows } = await req.db.query(
      `UPDATE historias_clinicas SET
         tipo_consulta = COALESCE($1, tipo_consulta),
         motivo_consulta = COALESCE($2, motivo_consulta),
         diagnostico = COALESCE($3, diagnostico),
         tratamiento = COALESCE($4, tratamiento),
         observaciones = COALESCE($5, observaciones),
         imagen_url = COALESCE($6, imagen_url),
         proxima_revision = COALESCE($7, proxima_revision)
       WHERE id = $8 AND activo = 's'
       RETURNING *`,
      [tipo_consulta, motivo_consulta, diagnostico, tratamiento, observaciones, imagen_url, proxima_revision, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Registro no encontrado' });
    await registrarAuditoria({
      medicoId: req.user.medico_id, accion: 'ACTUALIZAR', entidad: 'historias_clinicas', entidadId: rows[0].id, ip: req.ip,
    });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// Baja lógica: nunca se borra el registro, solo se marca activo = 'n'.
async function eliminar(req, res, next) {
  try {
    const { rowCount } = await req.db.query(
      `UPDATE historias_clinicas SET activo = 'n' WHERE id = $1 AND activo = 's'`,
      [req.params.id]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Registro no encontrado' });
    await registrarAuditoria({
      medicoId: req.user.medico_id, accion: 'ELIMINAR', entidad: 'historias_clinicas', entidadId: Number(req.params.id), ip: req.ip,
    });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { listarPorPaciente, obtener, crear, actualizar, eliminar };
