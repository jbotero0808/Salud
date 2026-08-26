const TITULO_DEFECTO = 'Salud · Panel Profesional';

export function aplicarTitulo(empresa) {
  document.title = empresa || TITULO_DEFECTO;
}
