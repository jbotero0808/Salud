const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/db');

const CREDENCIALES_VALIDAS = { correo: 'test@salud.test', password: 'testpassword123' };

/**
 * Inicia sesión con un agente de supertest (mantiene cookies entre
 * peticiones, como un navegador real) y extrae el token CSRF de la
 * respuesta para usarlo en las peticiones que modifican datos.
 */
async function crearSesion() {
  const agente = request.agent(app);
  const res = await agente.post('/api/auth/login').send(CREDENCIALES_VALIDAS);
  if (res.status !== 200) {
    throw new Error(`No fue posible iniciar sesión de prueba: ${JSON.stringify(res.body)}`);
  }

  const cookiesFijadas = res.headers['set-cookie'] || [];
  const cookieCsrf = cookiesFijadas.find((c) => c.startsWith('salud_csrf='));
  const csrfToken = cookieCsrf ? cookieCsrf.split(';')[0].split('=')[1] : null;

  return { agente, csrfToken, medico: res.body.medico };
}

module.exports = { app, pool, CREDENCIALES_VALIDAS, crearSesion };
