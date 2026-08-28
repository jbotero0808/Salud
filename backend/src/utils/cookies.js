const ms = require('ms');

const DURACION_MS = ms(process.env.JWT_EXPIRES_IN || '8h');

// El frontend (Vercel) reenvía /api/* a este backend mediante un rewrite
// (ver frontend/vercel.json) — igual que el proxy de Vite en local. El
// navegador nunca ve el dominio real del backend: para él, todo ocurre
// en el origen del frontend. Por eso la cookie puede ser "primera parte"
// (SameSite=Lax) tanto en local como en producción, sin necesitar
// SameSite=None — que es justo lo que Safari (iOS) y cada vez más
// navegadores móviles bloquean o purgan agresivamente por ser "cross-site".
const esProduccion = Boolean(process.env.VERCEL);

const OPCIONES_BASE = {
  // Secure exige HTTPS: en producción siempre lo hay; en local casi
  // ningún cliente HTTP (curl, supertest) reenvía una cookie Secure
  // sobre una conexión sin TLS, así que se desactiva ahí.
  secure: esProduccion,
  sameSite: 'lax',
  path: '/',
};

const OPCIONES_TOKEN = { ...OPCIONES_BASE, httpOnly: true, maxAge: DURACION_MS };

// res.clearCookie necesita los mismos atributos que se usaron al fijar la
// cookie (path, sameSite, secure) para poder borrarla, pero sin maxAge
// (Express lo tiene deprecado en clearCookie desde v4.19).
const OPCIONES_LIMPIAR_TOKEN = { ...OPCIONES_BASE, httpOnly: true };

module.exports = { OPCIONES_TOKEN, OPCIONES_LIMPIAR_TOKEN };
