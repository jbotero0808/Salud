import PerfilForm from './PerfilForm';
import CambiarPasswordForm from './CambiarPasswordForm';
import TiposConsultaForm from './TiposConsultaForm';

export default function ConfiguracionPage() {
  return (
    <div>
      <div className="page-header">
        <h1>Configuración</h1>
      </div>

      <div style={{ display: 'grid', gap: 20, maxWidth: 520 }}>
        <PerfilForm />
        <CambiarPasswordForm />
        <TiposConsultaForm />
      </div>
    </div>
  );
}
