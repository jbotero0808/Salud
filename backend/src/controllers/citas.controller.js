const DURACION_DEFECTO_HORAS = 1;

async function listar(req, res, next) {
  const { desde, hasta } = req.query;
  try {
    const condiciones = [`c.activo = 's'`];
    const valores = [];

    if (desde) {
      valores.push(desde);
      condiciones.push(`fecha_inicio >= $${valores.length}`);
    }
    if (hasta) {
      valores.push(hasta);
      condiciones.push(`fecha_inicio <= $${valores.length}`);
    }

    const where = `WHERE ${condiciones.join(' AND ')}`;

    const { rows } = await req.db.query(
      `SELECT c.id, c.paciente_id, p.nombre AS paciente_nombre, c.fecha_inicio, c.fecha_fin, c.estado, c.notas
         FROM citas c
         JOIN pacientes p ON p.id = c.paciente_id
         ${where}
        ORDER BY c.fecha_inicio`,
      valores
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function agendaHoy(req, res, next) {
  try {
    const { rows } = await req.db.query(
      `SELECT c.id, c.paciente_id, p.nombre AS paciente_nombre, c.fecha_inicio, c.fecha_fin, c.estado, c.notas
         FROM citas c
         JOIN pacientes p ON p.id = c.paciente_id
        WHERE c.fecha_inicio::date = CURRENT_DATE AND c.activo = 's'
        ORDER BY c.fecha_inicio`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function obtener(req, res, next) {
  try {
    const { rows } = await req.db.query(`SELECT * FROM citas WHERE id = $1 AND activo = 's'`, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Cita no encontrada' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function crear(req, res, next) {
  const { paciente_id, fecha_inicio, fecha_fin, estado, notas } = req.body;
  if (!paciente_id || !fecha_inicio) {
    return res.status(400).json({ error: 'paciente_id y fecha_inicio son obligatorios' });
  }

  const inicio = new Date(fecha_inicio);
  const fin = fecha_fin
    ? new Date(fecha_fin)
    : new Date(inicio.getTime() + DURACION_DEFECTO_HORAS * 60 * 60 * 1000);

  try {
    const { rows } = await req.db.query(
      `INSERT INTO citas (paciente_id, fecha_inicio, fecha_fin, estado, notas)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [paciente_id, inicio, fin, estado || 'programada', notas || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function actualizar(req, res, next) {
  const { paciente_id, fecha_inicio, fecha_fin, estado, notas } = req.body;
  try {
    const { rows } = await req.db.query(
      `UPDATE citas SET
         paciente_id = COALESCE($1, paciente_id),
         fecha_inicio = COALESCE($2, fecha_inicio),
         fecha_fin = COALESCE($3, fecha_fin),
         estado = COALESCE($4, estado),
         notas = COALESCE($5, notas)
       WHERE id = $6 AND activo = 's'
       RETURNING *`,
      [paciente_id, fecha_inicio, fecha_fin, estado, notas, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Cita no encontrada' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// Baja lógica: nunca se borra el registro, solo se marca activo = 'n'.
async function eliminar(req, res, next) {
  try {
    const { rowCount } = await req.db.query(
      `UPDATE citas SET activo = 'n' WHERE id = $1 AND activo = 's'`,
      [req.params.id]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Cita no encontrada' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, agendaHoy, obtener, crear, actualizar, eliminar };
