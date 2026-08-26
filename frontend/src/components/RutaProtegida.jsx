import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RutaProtegida({ children }) {
  const { medico, cargando } = useAuth();

  if (cargando) return null;
  if (!medico) return <Navigate to="/login" replace />;
  return children;
}
