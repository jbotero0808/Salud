const ms = require('ms');

const DURACION_MS = ms(process.env.JWT_EXPIRES_IN || '8h');

// En producción, frontend y backend son dominios distintos de Vercel
// (vercel.app está en la lista de sufijos públicos, así que cada
// *.vercel.app cuenta como un "sitio" distinto): eso exige
// SameSite=None, y SameSite=None a su vez exige Secure.
//
// En local, localhost:5173 y localhost:4000 son el mismo "sitio" (el
// puerto no cuenta para esa definición) — no hace falta SameSite=None,
// y conviene evitar Secure ahí: casi ningún cliente HTTP (curl,
// supertest, y algunos navegadores fuera de contextos especiales)
// reenvía una cookie Secure sobre una conexión sin TLS.
const esProduccion = Boolean(process.env.VERCEL);

const OPCIONES_BASE = {
  secure: esProduccion,
  sameSite: esProduccion ? 'none' : 'lax',
  path: '/',
};

const OPCIONES_TOKEN = { ...OPCIONES_BASE, httpOnly: true, maxAge: DURACION_MS };
const OPCIONES_CSRF = { ...OPCIONES_BASE, httpOnly: false, maxAge: DURACION_MS };

// res.clearCookie necesita los mismos atributos que se usaron al fijar la
// cookie (path, sameSite, secure) para poder borrarla, pero sin maxAge
// (Express lo tiene deprecado en clearCookie desde v4.19).
const OPCIONES_LIMPIAR_TOKEN = { ...OPCIONES_BASE, httpOnly: true };
const OPCIONES_LIMPIAR_CSRF = { ...OPCIONES_BASE, httpOnly: false };

module.exports = { OPCIONES_TOKEN, OPCIONES_CSRF, OPCIONES_LIMPIAR_TOKEN, OPCIONES_LIMPIAR_CSRF };
