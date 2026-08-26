export const PALETAS = {
  rojo:    { nombre: 'Rojo',    primary: '#e53935', dark: '#b71c1c', light: '#ffcdd2' },
  azul:    { nombre: 'Azul',    primary: '#1e88e5', dark: '#0d47a1', light: '#bbdefb' },
  verde:   { nombre: 'Verde',   primary: '#43a047', dark: '#1b5e20', light: '#c8e6c9' },
  morado:  { nombre: 'Morado',  primary: '#8e24aa', dark: '#4a148c', light: '#e1bee7' },
  naranja: { nombre: 'Naranja', primary: '#fb8c00', dark: '#e65100', light: '#ffe0b2' },
  teal:    { nombre: 'Teal',    primary: '#00897b', dark: '#004d40', light: '#b2dfdb' },
};

export const COLOR_POR_DEFECTO = 'azul';

export function aplicarPaleta(colorKey) {
  const paleta = PALETAS[colorKey] || PALETAS[COLOR_POR_DEFECTO];
  const root = document.documentElement;
  root.style.setProperty('--primary-color', paleta.primary);
  root.style.setProperty('--primary-color-dark', paleta.dark);
  root.style.setProperty('--primary-color-light', paleta.light);
}
