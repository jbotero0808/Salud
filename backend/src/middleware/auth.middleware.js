const { verificarToken } = require('../utils/jwt');

function autenticarJWT(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [tipo, token] = authHeader.split(' ');

  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  try {
    const payload = verificarToken(token);
    req.user = payload; // { medico_id, correo, schema_name, color_primario }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

module.exports = { autenticarJWT };
