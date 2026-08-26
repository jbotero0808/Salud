import { useState } from 'react';
import api from '../../services/api';

const VACIO = { actual: '', nueva: '', confirmar: '' };

export default function CambiarPasswordForm() {
  const [form, setForm] = useState(VACIO);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);

  const campo = (nombre) => (e) => setForm({ ...form, [nombre]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setExito(false);

    if (form.nueva.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (form.nueva !== form.confirmar) {
      setError('La confirmación no coincide con la nueva contraseña');
      return;
    }

    setGuardando(true);
    try {
      await api.put('/auth/password', {
        password_actual: form.actual,
        password_nuevo: form.nueva,
      });
      setForm(VACIO);
      setExito(true);
    } catch (err) {
      setError(err.response?.data?.error || 'No fue posible cambiar la contraseña');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card">
      <h2 className="text-primary" style={{ marginTop: 0 }}>Cambiar contraseña</h2>
      {error && <div className="auth-error">{error}</div>}
      {exito && <div style={{ color: 'var(--primary-color-dark)', marginBottom: 12, fontSize: 14 }}>Contraseña actualizada.</div>}

      <div className="form-group">
        <label>Contraseña actual</label>
        <input type="password" value={form.actual} onChange={campo('actual')} required />
      </div>

      <div className="form-group">
        <label>Nueva contraseña (mín. 8 caracteres)</label>
        <input type="password" minLength={8} value={form.nueva} onChange={campo('nueva')} required />
      </div>

      <div className="form-group">
        <label>Confirmar nueva contraseña</label>
        <input type="password" minLength={8} value={form.confirmar} onChange={campo('confirmar')} required />
      </div>

      <button className="btn btn-primary" type="submit" disabled={guardando}>
        {guardando ? 'Guardando...' : 'Cambiar contraseña'}
      </button>
    </form>
  );
}
