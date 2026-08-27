import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Dashboard() {
  const { tieneModulo } = useAuth();
  const [agenda, setAgenda] = useState([]);
  const [pacientesCount, setPacientesCount] = useState(null);
  const [citaExpandidaId, setCitaExpandidaId] = useState(null);

  useEffect(() => {
    if (tieneModulo('citas')) {
      api.get('/citas/hoy').then((r) => setAgenda(r.data)).catch(() => {});
    }
    if (tieneModulo('pacientes')) {
      api.get('/pacientes').then((r) => setPacientesCount(r.data.length)).catch(() => {});
    }
  }, [tieneModulo]);

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card__value">{agenda.length}</div>
          <div className="stat-card__label">Citas de hoy</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value">{pacientesCount ?? '—'}</div>
          <div className="stat-card__label">Pacientes registrados</div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-primary">Agenda de hoy</h2>
        {agenda.length === 0 && <p>No tienes citas programadas para hoy.</p>}
        {agenda.map((cita) => {
          const expandida = citaExpandidaId === cita.id;
          return (
            <div
              key={cita.id}
              className={`calendar-slot calendar-slot--clickable ${expandida ? 'is-expanded' : ''}`}
              onClick={() => setCitaExpandidaId(expandida ? null : cita.id)}
            >
              <div className="calendar-slot__header">
                <span>
                  <strong>{new Date(cita.fecha_inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                  {' '}— {cita.paciente_nombre} ({cita.estado})
                </span>
                <span className="calendar-slot__chevron">{expandida ? '▲' : '▼'}</span>
              </div>
              {expandida && (
                cita.notas ? (
                  <div className="calendar-slot__notas">{cita.notas}</div>
                ) : (
                  <div className="calendar-slot__notas calendar-slot__notas--vacio">Sin notas para esta cita.</div>
                )
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
