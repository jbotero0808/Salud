import { useEffect, useRef, useState } from 'react';
import api from '../../services/api';
import { archivoABase64 } from '../../utils/archivo';

export default function HistoriaForm({ onGuardar }) {
  const [tiposConsulta, setTiposConsulta] = useState([]);
  const [tipoConsulta, setTipoConsulta] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [tratamiento, setTratamiento] = useState('');
  const [imagenBase64, setImagenBase64] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const inputArchivoRef = useRef(null);

  useEffect(() => {
    api.get('/tabla-maestra/tipoConsulta')
      .then((r) => {
        setTiposConsulta(r.data);
        if (r.data.length > 0) setTipoConsulta(r.data[0].nombre);
      })
      .catch(() => {});
  }, []);

  const handleArchivo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await archivoABase64(file);
    setImagenBase64(base64);
  };

  const limpiar = () => {
    setObservaciones('');
    setTratamiento('');
    setImagenBase64(null);
    if (inputArchivoRef.current) inputArchivoRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!tipoConsulta) {
      setError('Selecciona un tipo de consulta');
      return;
    }
    setGuardando(true);
    try {
      await onGuardar({
        tipo_consulta: tipoConsulta,
        observaciones,
        tratamiento,
        imagen_url: imagenBase64,
      });
      limpiar();
    } catch (err) {
      setError(err.response?.data?.error || 'No fue posible guardar la evolución');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="auth-error">{error}</div>}

      <div className="form-group">
        <label className="text-primary">Tipo Consulta</label>
        <select value={tipoConsulta} onChange={(e) => setTipoConsulta(e.target.value)} required>
          <option value="">Seleccionar...</option>
          {tiposConsulta.map((t) => (
            <option key={t.id} value={t.nombre}>{t.nombre}</option>
          ))}
        </select>
      </div>

      <fieldset className="fieldset-box">
        <legend>Observaciones</legend>
        <textarea
          rows={6}
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          style={{ border: 'none', width: '100%', resize: 'vertical' }}
        />
      </fieldset>

      <fieldset className="fieldset-box">
        <legend>Tratamiento</legend>
        <textarea
          rows={4}
          value={tratamiento}
          onChange={(e) => setTratamiento(e.target.value)}
          placeholder="Terapia o tratamiento a seguir..."
          style={{ border: 'none', width: '100%', resize: 'vertical' }}
        />
      </fieldset>

      <div
        className="image-upload-box"
        onClick={() => inputArchivoRef.current?.click()}
      >
        {imagenBase64 ? (
          <img src={imagenBase64} alt="Adjunto de la evolución" />
        ) : (
          <span>📷</span>
        )}
      </div>
      <div style={{ textAlign: 'center', fontWeight: 600, marginBottom: 16 }}>CARGAR IMAGEN</div>
      <input
        ref={inputArchivoRef}
        type="file"
        accept="image/*"
        onChange={handleArchivo}
        style={{ display: 'none' }}
      />

      <div style={{ textAlign: 'center' }}>
        <button type="submit" className="btn btn-primary" disabled={guardando}>
          {guardando ? 'Guardando...' : 'Crear'}
        </button>
      </div>
    </form>
  );
}
