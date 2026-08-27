import { obtenerIniciales } from '../utils/texto';

export default function AvatarPaciente({ paciente }) {
  if (paciente.foto_url) {
    return <img src={paciente.foto_url} alt={paciente.nombre} className="paciente-item__avatar" />;
  }
  return <div className="paciente-item__avatar-placeholder">{obtenerIniciales(paciente.nombre)}</div>;
}
