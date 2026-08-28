import { diasTresDias, isSameDay, format } from './calendarUtils';

export default function ThreeDayView({ fechaRef, citas, onDiaClick, onCitaClick }) {
  const dias = diasTresDias(fechaRef);
  const hoy = new Date();

  return (
    <div className="calendar-week-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
      {dias.map((dia) => {
        const citasDia = citas
          .filter((c) => isSameDay(new Date(c.fecha_inicio), dia))
          .sort((a, b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio));
        return (
          <div key={dia.toISOString()} className={`calendar-day-cell ${isSameDay(dia, hoy) ? 'is-today' : ''}`} style={{ minHeight: 220 }}>
            <div className="calendar-day-cell__num" style={{ cursor: 'pointer' }} onClick={() => onDiaClick(dia)}>
              {format(dia, 'EEE d')}
            </div>
            {citasDia.map((c) => (
              <div key={c.id} className="calendar-slot" style={{ cursor: 'pointer' }} onClick={() => onCitaClick(c)}>
                <strong>{format(new Date(c.fecha_inicio), 'HH:mm')}</strong> {c.paciente_nombre}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
