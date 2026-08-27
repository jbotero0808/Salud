async function listar(req, res, next) {
  const { q } = req.query;
  try {
    const condiciones = [`activo = 's'`];
    const valores = [];

    if (q) {
      valores.push(`%${q}%`);
      condiciones.push(`(nombre ILIKE $${valores.length} OR cedula ILIKE $${valores.length})`);
    }

    const { rows } = await req.db.query(
      `SELECT id, nombre, cedula, celular, correo, genero, fecha_nacimiento, direccion, foto_url, fecha_registro
         FROM pacientes
        WHERE ${condiciones.join(' AND ')}
        ORDER BY nombre`,
      valores
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function obtener(req, res, next) {
  try {
    const { rows } = await req.db.query(`SELECT * FROM pacientes WHERE id = $1 AND activo = 's'`, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Paciente no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function crear(req, res, next) {
  const { nombre, cedula, celular, correo, genero, fecha_nacimiento, direccion, foto_url } = req.body;
  if (!nombre || !cedula) {
    return res.status(400).json({ error: 'nombre y cedula son obligatorios' });
  }
  try {
    const { rows } = await req.db.query(
      `INSERT INTO pacientes (nombre, cedula, celular, correo, genero, fecha_nacimiento, direccion, foto_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [nombre, cedula, celular || null, correo || null, genero || null, fecha_nacimiento || null, direccion || null, foto_url || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function actualizar(req, res, next) {
  const { nombre, cedula, celular, correo, genero, fecha_nacimiento, direccion, foto_url } = req.body;
  try {
    const { rows } = await req.db.query(
      `UPDATE pacientes SET
         nombre = COALESCE($1, nombre),
         cedula = COALESCE($2, cedula),
         celular = COALESCE($3, celular),
         correo = COALESCE($4, correo),
         genero = COALESCE($5, genero),
         fecha_nacimiento = COALESCE($6, fecha_nacimiento),
         direccion = COALESCE($7, direccion),
         foto_url = COALESCE($8, foto_url)
       WHERE id = $9 AND activo = 's'
       RETURNING *`,
      [nombre, cedula, celular, correo, genero, fecha_nacimiento, direccion, foto_url, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Paciente no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// Baja lógica: nunca se borra el registro, solo se marca activo = 'n'.
async function eliminar(req, res, next) {
  try {
    const { rowCount } = await req.db.query(
      `UPDATE pacientes SET activo = 'n' WHERE id = $1 AND activo = 's'`,
      [req.params.id]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Paciente no encontrado' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
