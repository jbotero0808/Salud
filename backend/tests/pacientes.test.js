const { pool, crearSesion } = require('./helpers');

let agente;
let csrfToken;
let pacienteId;

beforeAll(async () => {
  ({ agente, csrfToken } = await crearSesion());
});

afterAll(async () => {
  if (pacienteId) {
    await pool.query(`DELETE FROM public.pacientes WHERE id = $1`, [pacienteId]);
  }
  await pool.end();
});

describe('Pacientes: CRUD y separación de datos activos/inactivos', () => {
  it('crea un paciente', async () => {
    const res = await agente
      .post('/api/pacientes')
      .set('X-CSRF-Token', csrfToken)
      .send({ nombre: 'Paciente De Prueba', cedula: `TEST-${Date.now()}` });

    expect(res.status).toBe(201);
    expect(res.body.activo).toBe('s');
    pacienteId = res.body.id;
  });

  it('lo incluye en el listado mientras está activo', async () => {
    const res = await agente.get('/api/pacientes');
    expect(res.status).toBe(200);
    expect(res.body.some((p) => p.id === pacienteId)).toBe(true);
  });

  it('lo excluye del listado tras la baja lógica (no lo borra físicamente)', async () => {
    const eliminar = await agente.delete(`/api/pacientes/${pacienteId}`).set('X-CSRF-Token', csrfToken);
    expect(eliminar.status).toBe(204);

    const listado = await agente.get('/api/pacientes');
    expect(listado.body.some((p) => p.id === pacienteId)).toBe(false);

    const { rows } = await pool.query(`SELECT activo FROM public.pacientes WHERE id = $1`, [pacienteId]);
    expect(rows).toHaveLength(1);
    expect(rows[0].activo).toBe('n');
  });

  it('ya no permite editar un paciente dado de baja', async () => {
    const res = await agente
      .put(`/api/pacientes/${pacienteId}`)
      .set('X-CSRF-Token', csrfToken)
      .send({ nombre: 'Intento de edición' });
    expect(res.status).toBe(404);
  });
});
