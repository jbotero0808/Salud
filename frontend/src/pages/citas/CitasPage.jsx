import { useEffect, useState } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal';
import CitaForm from './CitaForm';
import MonthView from './MonthView';
import WeekView from './WeekView';
import DayView from './DayView';
import { rangoParaVista, avanzar, format } from './calendarUtils';

export default function CitasPage() {
  const [vista, setVista] = useState('mes');
  const [fechaRef, setFechaRef] = useState(new Date());
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState(null); // { modo: 'nueva'|'editar', fechaSugerida, cita }

  const cargar = async () => {
    setCargando(true);
    const { desde, hasta } = rangoParaVista(vista, fechaRef);
    try {
      const { data } = await api.get('/citas', {
        params: { desde: desde.toISOString(), hasta: hasta.toISOString() },
      });
      setCitas(data);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, [vista, fechaRef]); // eslint-disable-line react-hooks/exhaustive-deps

  const guardar = async (form) => {
    if (modal?.cita) {
      await api.put(`/citas/${modal.cita.id}`, form);
    } else {
      await api.post('/citas', form);
    }
    setModal(null);
    cargar();
  };

  return (
    <div>
      <div className="page-header">
        <h1>Citas</h1>
        <button className="btn btn-primary" onClick={() => setModal({ fechaSugerida: fechaRef })}>+ Nueva cita</button>
      </div>

      <div className="card">
        <div className="calendar-toolbar">
          <button className="btn btn-secondary" onClick={() => setFechaRef(avanzar(vista, fechaRef, -1))}>‹</button>
          <button className="btn btn-secondary" onClick={() => setFechaRef(new Date())}>Hoy</button>
          <button className="btn btn-secondary" onClick={() => setFechaRef(avanzar(vista, fechaRef, 1))}>›</button>
          <strong style={{ marginLeft: 8 }}>{format(fechaRef, vista === 'dia' ? 'd MMMM yyyy' : 'MMMM yyyy')}</strong>
          <div className="view-tabs">
            {['dia', 'semana', 'mes'].map((v) => (
              <button key={v} className={vista === v ? 'is-active' : ''} onClick={() => setVista(v)}>
                {v === 'dia' ? 'Día' : v === 'semana' ? 'Semana' : 'Mes'}
              </button>
            ))}
          </div>
        </div>

        {cargando ? (
          <p>Cargando...</p>
        ) : vista === 'mes' ? (
          <MonthView fechaRef={fechaRef} citas={citas} onDiaClick={(dia) => setModal({ fechaSugerida: dia })} />
        ) : vista === 'semana' ? (
          <WeekView
            fechaRef={fechaRef}
            citas={citas}
            onDiaClick={(dia) => setModal({ fechaSugerida: dia })}
            onCitaClick={(cita) => setModal({ cita, fechaSugerida: new Date(cita.fecha_inicio) })}
          />
        ) : (
          <DayView fechaRef={fechaRef} citas={citas} onCitaClick={(cita) => setModal({ cita, fechaSugerida: new Date(cita.fecha_inicio) })} />
        )}
      </div>

      {modal && (
        <Modal titulo={modal.cita ? 'Editar cita' : 'Nueva cita'} onClose={() => setModal(null)}>
          <CitaForm
            inicial={modal.cita}
            fechaSugerida={modal.fechaSugerida}
            onGuardar={guardar}
            onCancelar={() => setModal(null)}
          />
        </Modal>
      )}
    </div>
  );
}
