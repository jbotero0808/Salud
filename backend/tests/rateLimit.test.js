const request = require('supertest');
const { app, pool } = require('./helpers');

afterAll(async () => {
  await pool.end();
});

describe('Límite de intentos de login', () => {
  it('bloquea después de 5 intentos fallidos desde la misma IP', async () => {
    const credencialesMalas = { correo: 'test@salud.test', password: 'clave-incorrecta' };

    for (let i = 0; i < 5; i += 1) {
      const res = await request(app).post('/api/auth/login').send(credencialesMalas);
      expect(res.status).toBe(401);
    }

    const bloqueado = await request(app).post('/api/auth/login').send(credencialesMalas);
    expect(bloqueado.status).toBe(429);
  });
});
