import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import RutaProtegida from './components/RutaProtegida';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/auth/Login';
import Dashboard from './pages/Dashboard';
import PacientesPage from './pages/pacientes/PacientesPage';
import CitasPage from './pages/citas/CitasPage';
import HistoriasPage from './pages/historias/HistoriasPage';
import ConfiguracionPage from './pages/configuracion/ConfiguracionPage';
import AuditoriaPage from './pages/auditoria/AuditoriaPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <RutaProtegida>
                <AppLayout />
              </RutaProtegida>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="pacientes" element={<PacientesPage />} />
            <Route path="citas" element={<CitasPage />} />
            <Route path="historias" element={<HistoriasPage />} />
            <Route path="configuracion" element={<ConfiguracionPage />} />
            <Route path="auditoria" element={<AuditoriaPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
