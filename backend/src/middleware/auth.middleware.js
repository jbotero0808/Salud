const { verificarToken } = require('../utils/jwt');

const METODOS_MUTANTES = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// Lee la sesión de la cookie httpOnly (no del header Authorization) y,
// para peticiones que modifican datos, exige que el header X-CSRF-Token
// coincida con el valor "csrf" firmado dentro del propio JWT.
//
// El CSRF no viaja en una cookie aparte: frontend y backend son dominios
// distintos en producción, así que JS del frontend no podría leer una
// cookie puesta por el backend de todos modos (política de origen del
// navegador). En su lugar, el valor se le entrega al frontend en el
// cuerpo de la respuesta de login/perfil. Un sitio atacante puede lograr
// que el navegador de la víctima adjunte la cookie de sesión sola en una
// petición forjada, pero nunca podrá conocer el valor de "csrf" para
// replicarlo en el header, porque nunca recibió (ni puede leer, por CORS)
// una respuesta legítima de nuestra API.
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
    const csrfHeader = req.headers['x-csrf-token'];
    if (!csrfHeader || csrfHeader !== payload.csrf) {
      return res.status(403).json({ error: 'Token CSRF inválido o ausente' });
    }
  }

  req.user = payload; // { medico_id, correo, color_primario, csrf }
  next();
}

module.exports = { autenticarJWT };
