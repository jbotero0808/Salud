import { PALETAS } from '../theme/paletas';

export default function SelectorPaleta({ valor, onChange }) {
  return (
    <div className="selector-paleta">
      <label className="selector-paleta__label">Color base de tu perfil</label>
      <div className="selector-paleta__opciones">
        {Object.entries(PALETAS).map(([clave, paleta]) => (
          <button
            key={clave}
            type="button"
            className={`selector-paleta__opcion ${valor === clave ? 'is-selected' : ''}`}
            style={{ backgroundColor: paleta.primary }}
            title={paleta.nombre}
            aria-label={paleta.nombre}
            onClick={() => onChange(clave)}
          />
        ))}
      </div>
    </div>
  );
}
