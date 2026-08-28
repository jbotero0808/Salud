const { verificarToken } = require('../utils/jwt');

const METODOS_MUTANTES = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// Lee la sesión de la cookie httpOnly (no del header Authorization) y,
// para peticiones que modifican datos, exige que el header X-CSRF-Token
// coincida con la cookie CSRF (no httpOnly) — patrón de "doble envío".
// Un sitio atacante puede lograr que el navegador de la víctima adjunte
// la cookie de sesión sola, pero no puede leer su valor para replicarlo
// en el header, porque las cookies de otro dominio no son visibles
// desde JavaScript en el origen del atacante.
function autenticarJWT(req, res, next) {
  const token = req.cookies?.salud_token;

  if (!token) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  let payload;
  try {
    payload = verificarToken(token);
  } catch (err) {
    return res.status(401).json({ error: 'Sesión inválida o expirada' });
  }

  if (METODOS_MUTANTES.has(req.method)) {
    const csrfCookie = req.cookies?.salud_csrf;
    const csrfHeader = req.headers['x-csrf-token'];
    if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
      return res.status(403).json({ error: 'Token CSRF inválido o ausente' });
    }
  }

  req.user = payload; // { medico_id, correo, color_primario }
  next();
}

module.exports = { autenticarJWT };
