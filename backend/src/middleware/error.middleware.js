const Sentry = require('../instrument');

async function manejadorErrores(err, req, res, next) {
  console.error(err);

  if (err.code === '23505') {
    return res.status(409).json({ error: 'El registro ya existe (violación de restricción única)' });
  }
  if (err.code === '23503') {
    return res.status(409).json({ error: 'Referencia inválida a un recurso relacionado' });
  }

  const status = err.status || 500;

  // Solo se reportan errores inesperados (5xx) — los 4xx son parte del
  // flujo normal de validación, no bugs a investigar.
  if (status >= 500) {
    Sentry.captureException(err);
    try {
      // En un entorno serverless el proceso puede terminar apenas se
      // responde, así que hay que asegurarse de que el evento salga
      // antes de eso.
      await Sentry.flush(2000);
    } catch {
      // Nunca bloquear la respuesta al usuario por un fallo de Sentry.
    }
  }

  res.status(status).json({ error: err.message || 'Error interno del servidor' });
}

module.exports = { manejadorErrores };
