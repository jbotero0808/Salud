import { useState } from 'react';

const VACIO = {
  nombre: '', cedula: '', celular: '', correo: '', genero: '', fecha_nacimiento: '', direccion: '',
};

export default function PacienteForm({ inicial, onGuardar, onCancelar }) {
  const [form, setForm] = useState(inicial ? { ...VACIO, ...inicial } : VACIO);
  const [guardando, setGuardando] = useState(false);

  const campo = (nombre) => (e) => setForm({ ...form, [nombre]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      await onGuardar(form);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Nombre</label>
        <input value={form.nombre} onChange={campo('nombre')} required />
      </div>
      <div className="form-group">
        <label>Cédula</label>
        <input value={form.cedula} onChange={campo('cedula')} required />
      </div>
      <div className="form-group">
        <label>Celular</label>
        <input value={form.celular} onChange={campo('celular')} />
      </div>
      <div className="form-group">
        <label>Correo</label>
        <input type="email" value={form.correo} onChange={campo('correo')} />
      </div>
      <div className="form-group">
        <label>Género</label>
        <select value={form.genero} onChange={campo('genero')}>
          <option value="">Seleccionar...</option>
          <option value="femenino">Femenino</option>
          <option value="masculino">Masculino</option>
          <option value="otro">Otro</option>
        </select>
      </div>
      <div className="form-group">
        <label>Fecha de nacimiento</label>
        <input type="date" value={form.fecha_nacimiento?.slice(0, 10) || ''} onChange={campo('fecha_nacimiento')} />
      </div>
      <div className="form-group">
        <label>Dirección</label>
        <textarea rows={2} value={form.direccion} onChange={campo('direccion')} />
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-secondary" onClick={onCancelar}>Cancelar</button>
        <button type="submit" className="btn btn-primary" disabled={guardando}>
          {guardando ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}
