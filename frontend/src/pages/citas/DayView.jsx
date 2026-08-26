import { isSameDay, format } from './calendarUtils';

export default function DayView({ fechaRef, citas, onCitaClick }) {
  const citasDia = citas
    .filter((c) => isSameDay(new Date(c.fecha_inicio), fechaRef))
    .sort((a, b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio));

  return (
    <div className="calendar-day-grid">
      <h3>{format(fechaRef, 'EEEE d MMMM yyyy')}</h3>
      {citasDia.length === 0 && <p>No hay citas programadas este día.</p>}
      {citasDia.map((c) => (
        <div key={c.id} className="calendar-slot" style={{ cursor: 'pointer' }} onClick={() => onCitaClick(c)}>
          <strong>{format(new Date(c.fecha_inicio), 'HH:mm')} - {format(new Date(c.fecha_fin), 'HH:mm')}</strong>
          <div>{c.paciente_nombre} · {c.estado}</div>
          {c.notas && <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{c.notas}</div>}
        </div>
      ))}
    </div>
  );
}
