const request = require('supertest');
const { app, pool, CREDENCIALES_VALIDAS, crearSesion } = require('./helpers');

afterAll(async () => {
  await pool.end();
});

describe('POST /api/auth/login', () => {
  it('inicia sesión con credenciales correctas, fija la cookie httpOnly y entrega el CSRF en el cuerpo', async () => {
    const res = await request(app).post('/api/auth/login').send(CREDENCIALES_VALIDAS);
    expect(res.status).toBe(200);
    expect(res.body.medico.correo).toBe(CREDENCIALES_VALIDAS.correo);
    expect(res.body.token).toBeUndefined();
    expect(res.body.medico.password_hash).toBeUndefined();
    expect(typeof res.body.csrfToken).toBe('string');
    expect(res.body.csrfToken.length).toBeGreaterThan(10);

    const cookies = res.headers['set-cookie'] || [];
    const cookieToken = cookies.find((c) => c.startsWith('salud_token='));
    expect(cookieToken).toBeDefined();
    expect(cookieToken).toMatch(/HttpOnly/i);
    // El CSRF no debe viajar como cookie: el frontend en producción está
    // en otro dominio y no podría leerla.
    expect(cookies.some((c) => c.startsWith('salud_csrf='))).toBe(false);
  });

  it('rechaza una contraseña incorrecta', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ correo: CREDENCIALES_VALIDAS.correo, password: 'clave-incorrecta' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  it('rechaza un correo que no existe, sin revelar si el correo existe', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ correo: 'no-existe@salud.test', password: 'lo-que-sea' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Credenciales inválidas');
  });

  it('exige correo y password', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });
});

describe('Rutas protegidas por cookie de sesión', () => {
  it('rechaza el acceso sin cookie', async () => {
    const res = await request(app).get('/api/pacientes');
    expect(res.status).toBe(401);
  });

  it('rechaza una cookie de sesión inválida/manipulada', async () => {
    const res = await request(app).get('/api/pacientes').set('Cookie', 'salud_token=esto-no-es-un-jwt');
    expect(res.status).toBe(401);
  });

  it('acepta una sesión válida', async () => {
    const { agente } = await crearSesion();
    const res = await agente.get('/api/auth/perfil');
    expect(res.status).toBe(200);
    expect(res.body.medico.correo).toBe(CREDENCIALES_VALIDAS.correo);
  });
});

describe('CSRF en peticiones que modifican datos', () => {
  it('rechaza un POST autenticado sin el header X-CSRF-Token', async () => {
    const { agente } = await crearSesion();
    const res = await agente.post('/api/pacientes').send({ nombre: 'X', cedula: `CSRF-${Date.now()}` });
    expect(res.status).toBe(403);
  });

  it('rechaza un POST con un X-CSRF-Token que no coincide con el embebido en el JWT', async () => {
    const { agente } = await crearSesion();
    const res = await agente
      .post('/api/pacientes')
      .set('X-CSRF-Token', 'un-valor-cualquiera-que-no-coincide')
      .send({ nombre: 'X', cedula: `CSRF-${Date.now()}` });
    expect(res.status).toBe(403);
  });

  it('acepta un POST cuando el X-CSRF-Token coincide con el entregado al iniciar sesión', async () => {
    const { agente, csrfToken } = await crearSesion();
    const cedula = `CSRF-OK-${Date.now()}`;
    const res = await agente.post('/api/pacientes').set('X-CSRF-Token', csrfToken).send({ nombre: 'X', cedula });
    expect(res.status).toBe(201);
    await pool.query(`DELETE FROM public.pacientes WHERE id = $1`, [res.body.id]);
  });
});

describe('POST /api/auth/logout', () => {
  it('limpia las cookies de sesión', async () => {
    const { agente } = await crearSesion();
    const res = await agente.post('/api/auth/logout');
    expect(res.status).toBe(200);

    const cookies = res.headers['set-cookie'] || [];
    const cookieToken = cookies.find((c) => c.startsWith('salud_token='));
    expect(cookieToken).toMatch(/salud_token=;/); // valor vacío = cookie borrada

    const trasLogout = await agente.get('/api/auth/perfil');
    expect(trasLogout.status).toBe(401);
  });
});
