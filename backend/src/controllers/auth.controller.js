const bcrypt = require('bcrypt');
const { pool } = require('../config/db');
const { firmarToken } = require('../utils/jwt');
const { registrarAuditoria } = require('../utils/auditoria');
const { generarTokenCsrf } = require('../utils/csrf');
const { OPCIONES_TOKEN, OPCIONES_LIMPIAR_TOKEN } = require('../utils/cookies');

const SALT_ROUNDS = 12;
const COLORES_VALIDOS = ['rojo', 'azul', 'verde', 'morado', 'naranja', 'teal'];

// No hay registro público: cada base de datos pertenece a un único
// cliente y su médico se crea con backend/scripts/crear-medico.js.

// Endpoint público (sin JWT): permite pintar el login con el logo y el
// color del médico antes de autenticarse. Como cada base de datos
// pertenece a un único cliente, no hay ambigüedad sobre qué marca mostrar.
async function branding(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT foto_logo_url, color_primario, empresa FROM public.medicos ORDER BY id LIMIT 1`
    );
    return res.json(rows[0] || { foto_logo_url: null, color_primario: 'azul', empresa: null });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  const { correo, password } = req.body;
  if (!correo || !password) {
    return res.status(400).json({ error: 'correo y password son obligatorios' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT id, nombre, correo, password_hash, color_primario, foto_logo_url, empresa, profesion
         FROM public.medicos
        WHERE correo = $1`,
      [correo]
    );

    if (rows.length === 0) {
      await registrarAuditoria({ accion: 'LOGIN_FALLIDO', entidad: 'medicos', detalle: `correo: ${correo} (no existe)`, ip: req.ip });
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const medico = rows[0];
    const passwordValido = await bcrypt.compare(password, medico.password_hash);
    if (!passwordValido) {
      await registrarAuditoria({ medicoId: medico.id, accion: 'LOGIN_FALLIDO', entidad: 'medicos', entidadId: medico.id, detalle: 'contraseña incorrecta', ip: req.ip });
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    await registrarAuditoria({ medicoId: medico.id, accion: 'LOGIN_EXITOSO', entidad: 'medicos', entidadId: medico.id, ip: req.ip });

    const csrfToken = generarTokenCsrf();
    const token = firmarToken(medico, csrfToken);

    // El CSRF viaja embebido y firmado dentro del JWT (cookie httpOnly) y
    // se le entrega al frontend en el cuerpo de la respuesta — no como una
    // cookie aparte. Frontend y backend son dominios distintos en
    // producción, así que JS del frontend no podría leer una cookie del
    // backend de todos modos; el cuerpo de la respuesta sí es legible.
    res.cookie('salud_token', token, OPCIONES_TOKEN);

    return res.json({
      medico: {
        id: medico.id,
        nombre: medico.nombre,
        correo: medico.correo,
        color_primario: medico.color_primario,
        foto_logo_url: medico.foto_logo_url,
        empresa: medico.empresa,
        profesion: medico.profesion,
      },
      csrfToken,
    });
  } catch (err) {
    next(err);
  }
}

// No requiere sesión válida: una cookie ya vencida o corrupta debe poder
// limpiarse igual. Tampoco exige CSRF — cerrar sesión por una petición
// forjada no compromete datos, en el peor caso desloguea a la víctima.
function logout(req, res) {
  res.clearCookie('salud_token', OPCIONES_LIMPIAR_TOKEN);
  res.json({ ok: true });
}

async function perfil(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT id, nombre, correo, celular, foto_logo_url, documento_identidad, empresa, profesion, color_primario, fecha_registro
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

    return res.json({ medico: rows[0], modulos, csrfToken: req.user.csrf });
  } catch (err) {
    next(err);
  }
}

async function actualizarPerfil(req, res, next) {
  const { nombre, foto_logo_url, color_primario, profesion } = req.body;

  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre es obligatorio' });
  }
  if (color_primario && !COLORES_VALIDOS.includes(color_primario)) {
    return res.status(400).json({ error: 'Color primario inválido' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE public.medicos SET
         nombre = $1,
         foto_logo_url = $2,
         color_primario = COALESCE($3, color_primario),
         profesion = $4
       WHERE id = $5
       RETURNING id, nombre, correo, color_primario, foto_logo_url, empresa, profesion`,
      [nombre.trim(), foto_logo_url || null, color_primario || null, profesion || null, req.user.medico_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Médico no encontrado' });
    }

    return res.json({ medico: rows[0] });
  } catch (err) {
    next(err);
  }
}

async function cambiarPassword(req, res, next) {
  const { password_actual, password_nuevo } = req.body;

  if (!password_actual || !password_nuevo) {
    return res.status(400).json({ error: 'password_actual y password_nuevo son obligatorios' });
  }
  if (password_nuevo.length < 8) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT password_hash FROM public.medicos WHERE id = $1`,
      [req.user.medico_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Médico no encontrado' });
    }

    const passwordValido = await bcrypt.compare(password_actual, rows[0].password_hash);
    if (!passwordValido) {
      return res.status(401).json({ error: 'La contraseña actual no es correcta' });
    }

    const nuevoHash = await bcrypt.hash(password_nuevo, SALT_ROUNDS);
    await pool.query(
      `UPDATE public.medicos SET password_hash = $1 WHERE id = $2`,
      [nuevoHash, req.user.medico_id]
    );

    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { branding, login, logout, perfil, actualizarPerfil, cambiarPassword };
