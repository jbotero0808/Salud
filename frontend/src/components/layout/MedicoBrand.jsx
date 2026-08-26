import { useAuth } from '../../context/AuthContext';

export default function MedicoBrand() {
  const { medico } = useAuth();

  return (
    <div className="sidebar__brand">
      {medico?.foto_logo_url && (
        <img src={medico.foto_logo_url} alt={medico.nombre} className="sidebar__logo" />
      )}
      <span className="sidebar__brand-name sidebar-label">{medico?.nombre}</span>
    </div>
  );
}
