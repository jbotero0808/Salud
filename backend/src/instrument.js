// Debe requerirse ANTES que cualquier otro módulo (así lo pide Sentry
// para poder instrumentar automáticamente el resto del código).
// Sin SENTRY_DSN definido, el SDK simplemente no envía nada — es
// seguro dejarlo así en desarrollo local.
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
  tracesSampleRate: 0.1,
});

module.exports = Sentry;
