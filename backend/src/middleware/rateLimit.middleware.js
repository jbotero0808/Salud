const rateLimit = require('express-rate-limit');

// Protege /auth/login contra fuerza bruta: máximo 5 intentos cada
// 15 minutos por IP. No distingue por correo, así que también limita
// a un atacante que pruebe muchas cuentas distintas desde la misma IP.
const limitadorLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en unos minutos.' },
});

module.exports = { limitadorLogin };
