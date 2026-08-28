const request = require('supertest');
const { app, pool, crearSesion } = require('./helpers');

let agente;
let csrfToken;
let pacienteId;
let historiaId;

beforeAll(async () => {
  ({ agente, csrfToken } = await crearSesion());
  const res = await agente
    .post('/api/pacientes')
    .set('X-CSRF-Token', csrfToken)
    .send({ nombre: 'Paciente Historia Test', cedula: `HIST-${Date.now()}` });
  pacienteId = res.body.id;
});

afterAll(async () => {
  if (pacienteId) {
    await pool.query(`DELETE FROM public.pacientes WHERE id = $1`, [pacienteId]);
  }
  await pool.end();
});

describe('Historias clínicas: creación, consulta y auditoría', () => {
  it('exige tipo_consulta para crear una evolución', async () => {
    const res = await agente.post('/api/historias').set('X-CSRF-Token', csrfToken).send({ paciente_id: pacienteId });
    expect(res.status).toBe(400);
  });

  it('crea una historia clínica asociada al paciente', async () => {
    const res = await agente
      .post('/api/historias')
      .set('X-CSRF-Token', csrfToken)
      .send({ paciente_id: pacienteId, tipo_consulta: 'Primera vez', observaciones: 'Prueba automatizada' });

    expect(res.status).toBe(201);
    expect(res.body.paciente_id).toBe(pacienteId);
    historiaId = res.body.id;
  });

  it('la devuelve al consultar el historial del paciente', async () => {
    const res = await agente.get(`/api/historias/paciente/${pacienteId}`);
    expect(res.status).toBe(200);
    expect(res.body.some((h) => h.id === historiaId)).toBe(true);
  });

  it('queda un registro de auditoría por crear y por consultar la historia', async () => {
    const { rows } = await pool.query(
      `SELECT accion, entidad FROM public.auditoria
        WHERE entidad = 'historias_clinicas'
          AND (entidad_id = $1 OR detalle LIKE '%' || $2 || '%')
        ORDER BY fecha DESC`,
      [historiaId, `paciente ${pacienteId}`]
    );

    expect(rows.some((r) => r.accion === 'CREAR')).toBe(true);
    expect(rows.some((r) => r.accion === 'VER')).toBe(true);
  });

  it('no permite acceder a historias sin sesión', async () => {
    const res = await request(app).get(`/api/historias/paciente/${pacienteId}`);
    expect(res.status).toBe(401);
  });
});
