import { useEffect, useState } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal';
import CitaForm from './CitaForm';
import MonthView from './MonthView';
import WeekView from './WeekView';
import DayView from './DayView';
import ThreeDayView from './ThreeDayView';
import { rangoParaVista, avanzar, format } from './calendarUtils';

const ANCHO_MOVIL = 640;
const ETIQUETAS_VISTA = { dia: 'Día', tresdias: '3 días', semana: 'Semana', mes: 'Mes' };

function esPantallaMovil() {
  return typeof window !== 'undefined' && window.innerWidth <= ANCHO_MOVIL;
}

export default function CitasPage() {
  // En celulares, Mes/Semana usan una grilla de 7 columnas ilegible en
  // pantallas angostas; se reemplazan por una vista compacta de 3 días.
  const [esMovil, setEsMovil] = useState(esPantallaMovil);
  const [vista, setVista] = useState(() => (esPantallaMovil() ? 'tresdias' : 'mes'));
  const [fechaRef, setFechaRef] = useState(new Date());
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState(null); // { modo: 'nueva'|'editar', fechaSugerida, cita }

  useEffect(() => {
    const alRedimensionar = () => setEsMovil(esPantallaMovil());
    window.addEventListener('resize', alRedimensionar);
    return () => window.removeEventListener('resize', alRedimensionar);
  }, []);

  useEffect(() => {
    if (esMovil && (vista === 'mes' || vista === 'semana')) setVista('tresdias');
    if (!esMovil && vista === 'tresdias') setVista('mes');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [esMovil]);

  const vistasDisponibles = esMovil ? ['dia', 'tresdias'] : ['dia', 'semana', 'mes'];

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
          <strong style={{ marginLeft: 8 }}>{format(fechaRef, vista === 'dia' || vista === 'tresdias' ? 'd MMMM yyyy' : 'MMMM yyyy')}</strong>
          <div className="view-tabs">
            {vistasDisponibles.map((v) => (
              <button key={v} className={vista === v ? 'is-active' : ''} onClick={() => setVista(v)}>
                {ETIQUETAS_VISTA[v]}
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
        ) : vista === 'tresdias' ? (
          <ThreeDayView
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
