import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { aplicarPaleta } from '../theme/paletas';
import { aplicarFavicon } from '../theme/favicon';
import { aplicarTitulo } from '../theme/documentTitle';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [medico, setMedico] = useState(() => {
    const guardado = localStorage.getItem('salud_medico');
    return guardado ? JSON.parse(guardado) : null;
  });
  const [modulos, setModulos] = useState([]);
  const [cargando, setCargando] = useState(true);

  const persistirSesion = (token, medicoData) => {
    localStorage.setItem('salud_token', token);
    localStorage.setItem('salud_medico', JSON.stringify(medicoData));
    setMedico(medicoData);
    aplicarPaleta(medicoData.color_primario);
    aplicarFavicon(medicoData.foto_logo_url);
    aplicarTitulo(medicoData.empresa);
  };

  const login = async (correo, password) => {
    const { data } = await api.post('/auth/login', { correo, password });
    persistirSesion(data.token, data.medico);
    return data.medico;
  };

  const actualizarMedico = (medicoParcial) => {
    const actualizado = { ...medico, ...medicoParcial };
    localStorage.setItem('salud_medico', JSON.stringify(actualizado));
    setMedico(actualizado);
    aplicarPaleta(actualizado.color_primario);
    aplicarFavicon(actualizado.foto_logo_url);
    aplicarTitulo(actualizado.empresa);
  };

  const logout = useCallback(() => {
    localStorage.removeItem('salud_token');
    localStorage.removeItem('salud_medico');
    setMedico(null);
    setModulos([]);
    aplicarPaleta(null);
    aplicarFavicon(null);
    aplicarTitulo(null);
  }, []);

  const refrescarPerfil = useCallback(async () => {
    if (!localStorage.getItem('salud_token')) {
      setCargando(false);
      return;
    }
    try {
      const { data } = await api.get('/auth/perfil');
      setMedico((prev) => ({ ...prev, ...data.medico }));
      setModulos(data.modulos);
      aplicarPaleta(data.medico.color_primario);
      aplicarFavicon(data.medico.foto_logo_url);
      aplicarTitulo(data.medico.empresa);
    } catch {
      logout();
    } finally {
      setCargando(false);
    }
  }, [logout]);

  useEffect(() => {
    if (medico) {
      aplicarPaleta(medico.color_primario);
      aplicarFavicon(medico.foto_logo_url);
      aplicarTitulo(medico.empresa);
    }
    refrescarPerfil();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tieneModulo = (nombre) => modulos.some((m) => m.nombre === nombre && m.activo);

  return (
    <AuthContext.Provider
      value={{ medico, modulos, cargando, login, logout, refrescarPerfil, tieneModulo, actualizarMedico }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
