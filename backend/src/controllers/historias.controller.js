async function listarPorPaciente(req, res, next) {
  try {
    const { rows } = await req.db.query(
      `SELECT * FROM historias_clinicas WHERE paciente_id = $1 AND activo = 's' ORDER BY fecha DESC`,
      [req.params.pacienteId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function obtener(req, res, next) {
  try {
    const { rows } = await req.db.query(`SELECT * FROM historias_clinicas WHERE id = $1 AND activo = 's'`, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Registro no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function crear(req, res, next) {
  const { paciente_id, fecha, tipo_consulta, motivo_consulta, diagnostico, tratamiento, observaciones, imagen_url } = req.body;
  if (!paciente_id || !tipo_consulta) {
    return res.status(400).json({ error: 'paciente_id y tipo_consulta son obligatorios' });
  }
  try {
    const { rows } = await req.db.query(
      `INSERT INTO historias_clinicas
        (paciente_id, fecha, tipo_consulta, motivo_consulta, diagnostico, tratamiento, observaciones, imagen_url)
       VALUES ($1, COALESCE($2, now()), $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        paciente_id,
        fecha || null,
        tipo_consulta,
        motivo_consulta || null,
        diagnostico || null,
        tratamiento || null,
        observaciones || null,
        imagen_url || null,
      ]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function actualizar(req, res, next) {
  const { tipo_consulta, motivo_consulta, diagnostico, tratamiento, observaciones, imagen_url } = req.body;
  try {
    const { rows } = await req.db.query(
      `UPDATE historias_clinicas SET
         tipo_consulta = COALESCE($1, tipo_consulta),
         motivo_consulta = COALESCE($2, motivo_consulta),
         diagnostico = COALESCE($3, diagnostico),
         tratamiento = COALESCE($4, tratamiento),
         observaciones = COALESCE($5, observaciones),
         imagen_url = COALESCE($6, imagen_url)
       WHERE id = $7 AND activo = 's'
       RETURNING *`,
      [tipo_consulta, motivo_consulta, diagnostico, tratamiento, observaciones, imagen_url, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Registro no encontrado' });
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
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { listarPorPaciente, obtener, crear, actualizar, eliminar };
