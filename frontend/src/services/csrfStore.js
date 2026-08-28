// El token CSRF viaja embebido en el JWT (cookie httpOnly) y se recibe
// en el cuerpo de las respuestas de login/perfil — nunca en una cookie
// propia, porque en producción frontend y backend son dominios distintos
// y JS del frontend no podría leer una cookie puesta por el backend.
let csrfToken = null;

export function fijarCsrfToken(token) {
  csrfToken = token || null;
}

export function obtenerCsrfToken() {
  return csrfToken;
}
