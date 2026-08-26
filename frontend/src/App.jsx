import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import RutaProtegida from './components/RutaProtegida';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/auth/Login';
import Registro from './pages/auth/Registro';
import Dashboard from './pages/Dashboard';
import PacientesPage from './pages/pacientes/PacientesPage';
import CitasPage from './pages/citas/CitasPage';
import HistoriasPage from './pages/historias/HistoriasPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />

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
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
