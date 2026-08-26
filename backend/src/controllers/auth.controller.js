const bcrypt = require('bcrypt');
const { pool } = require('../config/db');
const { firmarToken } = require('../utils/jwt');

const SALT_ROUNDS = 12;
const COLORES_VALIDOS = ['rojo', 'azul', 'verde', 'morado', 'naranja', 'teal'];

async function registrar(req, res, next) {
  const {
    nombre,
    correo,
    password,
    celular,
    foto_logo_url,
    documento_identidad,
    color_primario,
    empresa,
  } = req.body;

  if (!nombre || !correo || !password || !documento_identidad) {
    return res.status(400).json({ error: 'nombre, correo, password y documento_identidad son obligatorios' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
  }

  const colorFinal = COLORES_VALIDOS.includes(color_primario) ? color_primario : 'azul';

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const { rows: seqRows } = await client.query("SELECT nextval('medicos_id_seq') AS id");
    const medicoId = seqRows[0].id;
    const schemaName = `medico_${medicoId}`;

    await client.query(
      `INSERT INTO public.medicos
        (id, nombre, correo, password_hash, celular, foto_logo_url, documento_identidad, empresa, color_primario, schema_name)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [medicoId, nombre, correo, passwordHash, celular || null, foto_logo_url || null, documento_identidad, empresa || null, colorFinal, schemaName]
    );

    await client.query('SELECT public.crear_esquema_medico($1, $2)', [medicoId, schemaName]);

    await client.query('COMMIT');

    const medico = { id: medicoId, correo, schema_name: schemaName, color_primario: colorFinal };
    const token = firmarToken(medico);

    return res.status(201).json({
      token,
      medico: {
        id: medicoId,
        nombre,
        correo,
        color_primario: colorFinal,
        schema_name: schemaName,
        foto_logo_url: foto_logo_url || null,
        empresa: empresa || null,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      return res.status(409).json({ error: 'El correo o el documento de identidad ya están registrados' });
    }
    next(err);
  } finally {
    client.release();
  }
}

async function login(req, res, next) {
  const { correo, password } = req.body;
  if (!correo || !password) {
    return res.status(400).json({ error: 'correo y password son obligatorios' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT id, nombre, correo, password_hash, color_primario, schema_name, foto_logo_url, empresa
         FROM public.medicos
        WHERE correo = $1`,
      [correo]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const medico = rows[0];
    const passwordValido = await bcrypt.compare(password, medico.password_hash);
    if (!passwordValido) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = firmarToken(medico);

    return res.json({
      token,
      medico: {
        id: medico.id,
        nombre: medico.nombre,
        correo: medico.correo,
        color_primario: medico.color_primario,
        schema_name: medico.schema_name,
        foto_logo_url: medico.foto_logo_url,
        empresa: medico.empresa,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function perfil(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT id, nombre, correo, celular, foto_logo_url, documento_identidad, empresa, color_primario, schema_name, fecha_registro
         FROM public.medicos
        WHERE id = $1`,
      [req.user.medico_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Médico no encontrado' });
    }

    const { rows: modulos } = await pool.query(
      `SELECT m.nombre, m.descripcion, m.es_pago, COALESCE(pm.activo, false) AS activo
         FROM public.modulos m
    LEFT JOIN public.permisos_medicos pm
           ON pm.modulo_id = m.id AND pm.medico_id = $1
        ORDER BY m.id`,
      [req.user.medico_id]
    );

    return res.json({ medico: rows[0], modulos });
  } catch (err) {
    next(err);
  }
}

module.exports = { registrar, login, perfil };
