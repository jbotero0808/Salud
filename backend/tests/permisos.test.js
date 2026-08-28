const { pool, crearSesion } = require('./helpers');

let agente;
let medicoId;
let moduloIdPacientes;

beforeAll(async () => {
  ({ agente } = await crearSesion());
  const { rows } = await pool.query(`SELECT id FROM public.medicos WHERE correo = 'test@salud.test'`);
  medicoId = rows[0].id;
  const { rows: modRows } = await pool.query(`SELECT id FROM public.modulos WHERE nombre = 'pacientes'`);
  moduloIdPacientes = modRows[0].id;
});

afterEach(async () => {
  // Deja el permiso siempre activo al terminar, sin importar qué probó cada test.
  await pool.query(
    `UPDATE public.permisos_medicos SET activo = true WHERE medico_id = $1 AND modulo_id = $2`,
    [medicoId, moduloIdPacientes]
  );
});

afterAll(async () => {
  await pool.end();
});

describe('Permisos por módulo (requiereModulo)', () => {
  it('permite el acceso cuando el módulo está activo', async () => {
    const res = await agente.get('/api/pacientes');
    expect(res.status).toBe(200);
  });

  it('bloquea el acceso con 403 cuando el módulo se desactiva', async () => {
    await pool.query(
      `UPDATE public.permisos_medicos SET activo = false WHERE medico_id = $1 AND modulo_id = $2`,
      [medicoId, moduloIdPacientes]
    );

    const res = await agente.get('/api/pacientes');
    expect(res.status).toBe(403);
  });

  it('vuelve a permitir el acceso al reactivar el módulo', async () => {
    await pool.query(
      `UPDATE public.permisos_medicos SET activo = true WHERE medico_id = $1 AND modulo_id = $2`,
      [medicoId, moduloIdPacientes]
    );

    const res = await agente.get('/api/pacientes');
    expect(res.status).toBe(200);
  });
});
