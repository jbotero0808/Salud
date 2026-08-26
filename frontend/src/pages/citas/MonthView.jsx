import { diasDelMes, isSameDay, isSameMonth, format } from './calendarUtils';

export default function MonthView({ fechaRef, citas, onDiaClick }) {
  const dias = diasDelMes(fechaRef);
  const hoy = new Date();

  return (
    <div className="calendar-month-grid">
      {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
        <div key={d} style={{ fontWeight: 700, fontSize: 12, textAlign: 'center' }}>{d}</div>
      ))}
      {dias.map((dia) => {
        const citasDia = citas.filter((c) => isSameDay(new Date(c.fecha_inicio), dia));
        return (
          <div
            key={dia.toISOString()}
            className={`calendar-day-cell ${isSameDay(dia, hoy) ? 'is-today' : ''}`}
            style={{ opacity: isSameMonth(dia, fechaRef) ? 1 : 0.4, cursor: 'pointer' }}
            onClick={() => onDiaClick(dia)}
          >
            <div className="calendar-day-cell__num">{format(dia, 'd')}</div>
            {citasDia.slice(0, 3).map((c) => (
              <div key={c.id} className="calendar-event">{format(new Date(c.fecha_inicio), 'HH:mm')} {c.paciente_nombre}</div>
            ))}
            {citasDia.length > 3 && <div style={{ fontSize: 11 }}>+{citasDia.length - 3} más</div>}
          </div>
        );
      })}
    </div>
  );
}
