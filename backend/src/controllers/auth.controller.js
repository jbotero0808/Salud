const bcrypt = require('bcrypt');
const { pool } = require('../config/db');
const { firmarToken } = require('../utils/jwt');

// No hay registro público: cada base de datos pertenece a un único
// cliente y su médico se crea con backend/scripts/crear-medico.js.

async function login(req, res, next) {
  const { correo, password } = req.body;
  if (!correo || !password) {
    return res.status(400).json({ error: 'correo y password son obligatorios' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT id, nombre, correo, password_hash, color_primario, foto_logo_url, empresa
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
      `SELECT id, nombre, correo, celular, foto_logo_url, documento_identidad, empresa, color_primario, fecha_registro
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

module.exports = { login, perfil };
