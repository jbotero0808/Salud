const rateLimit = require('express-rate-limit');

// Protege /auth/login contra fuerza bruta: máximo 5 intentos cada
// 15 minutos por IP. No distingue por correo, así que también limita
// a un atacante que pruebe muchas cuentas distintas desde la misma IP.
const limitadorLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  // Solo cuentan los intentos fallidos (401/429/etc). Un médico que
  // inicia sesión varias veces seguidas con éxito (varias pestañas,
  // varios dispositivos) no debería terminar bloqueado por eso.
  skipSuccessfulRequests: true,
  message: { error: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en unos minutos.' },
});

module.exports = { limitadorLogin };
