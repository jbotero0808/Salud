import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { generarPdfHistoria } from '../../utils/generarPdfHistoria';

export default function HistorialEntry({ historia, paciente }) {
  const { medico } = useAuth();
  const [generando, setGenerando] = useState(false);

  const descargarPdf = async () => {
    setGenerando(true);
    try {
      await generarPdfHistoria({ historia, paciente, medico });
    } catch {
      window.alert('No fue posible generar el PDF. Intenta de nuevo.');
    } finally {
      setGenerando(false);
    }
  };

  return (
    <fieldset className="fieldset-box fieldset-box--entry">
      <legend>{new Date(historia.fecha).toLocaleDateString()}</legend>
      {historia.tipo_consulta && <div><strong className="text-primary">Tipo:</strong> {historia.tipo_consulta}</div>}
      {historia.observaciones && <div style={{ marginTop: 4 }}>{historia.observaciones}</div>}
      {historia.tratamiento && (
        <div style={{ marginTop: 4 }}><strong className="text-primary">Tratamiento:</strong> {historia.tratamiento}</div>
      )}
      {historia.imagen_url && (
        <img src={historia.imagen_url} alt="Adjunto" className="historial-entry-img" />
      )}
      <div style={{ marginTop: 8 }}>
        <button type="button" className="historial-entry-pdf-link" onClick={descargarPdf} disabled={generando}>
          {generando ? 'Generando PDF...' : '📄 Descargar PDF'}
        </button>
      </div>
    </fieldset>
  );
}
