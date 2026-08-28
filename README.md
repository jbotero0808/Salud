# Salud — Plataforma para Profesionales de la Salud

Arquitectura: **una base de datos por cliente** (*database-per-tenant*). Cada
cliente tiene su propio proyecto de base de datos (ej. un proyecto Neon
distinto) y su propio despliegue de backend en Vercel — no hay separación
lógica por esquemas dentro de una base compartida, la base de datos física
completa es la frontera de aislamiento. Todas las tablas viven en `public`.

No hay registro público: cada base de datos pertenece a un único médico,
provisionado por el administrador con `backend/scripts/crear-medico.js`.

## 1. Base de datos

```bash
createdb salud
psql -U postgres -d salud -f database/schema.sql
```

Esto crea todas las tablas (`medicos`, `modulos`, `permisos_medicos`,
`pacientes`, `citas`, `historias_clinicas`, `tabla_maestra`, `auditoria`) en
el esquema `public`. El script es idempotente (`CREATE TABLE IF NOT EXISTS` +
`ALTER TABLE ... ADD COLUMN IF NOT EXISTS`), así que correrlo de nuevo sobre
una base ya existente solo aplica lo que falte, sin perder datos.

Crea el médico de esa base de datos:

```bash
cd backend
npm run crear-medico -- --nombre "Juan Botero" --correo juan@clinica.com \
  --password "unaClaveSegura123" --documento 1035861377 --empresa "Mi Clínica" --color verde
```

## 2. Backend (Node.js + Express)

```bash
cd backend
cp .env.example .env   # ajusta DATABASE_URL, JWT_SECRET y CORS_ORIGIN
npm install
npm run dev            # http://localhost:4000
```

- Hashing de contraseñas con `bcrypt` (12 *salt rounds*).
- El JWT incluye `medico_id`, `correo` y `color_primario` (expira en `JWT_EXPIRES_IN`, 8h por defecto).
- `modulo.middleware.js` bloquea con 403 los módulos de pago no habilitados en `permisos_medicos`.
- Cada despliegue apunta a la base de datos de un único cliente vía `DATABASE_URL` — no hay `search_path` que resolver ni lógica multi-esquema.

Si `npm install` falla al compilar `bcrypt` (falta de herramientas de
compilación nativa), puede sustituirse por `bcryptjs` sin cambiar la API.

### Despliegue en Vercel

El backend corre como función serverless (`backend/api/index.js` exporta la
app de Express; `backend/vercel.json` redirige todo el tráfico a esa
función). Variables de entorno a configurar en el proyecto de Vercel:

```
DATABASE_URL   cadena de conexión de Neon (con sslmode=require)
JWT_SECRET     secreto largo y aleatorio, distinto al de desarrollo
CORS_ORIGIN    URL exacta del frontend desplegado (sin protección si se omite, ver Seguridad)
SENTRY_DSN     opcional — monitoreo de errores (sentry.io)
```

Marca `DATABASE_URL` y `JWT_SECRET` como tipo **"Secret"** en Vercel, no
"Config" — un valor "Config" queda legible por cualquiera con acceso al
proyecto.

## 3. Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev             # http://localhost:5173
```

El dev server de Vite hace proxy de `/api` hacia `http://localhost:4000`
(ver `vite.config.js`).

- `AuthContext` guarda el JWT en `localStorage`, refresca el perfil al
  cargar la app y aplica la paleta del médico como variables CSS
  (`--primary-color`, `--primary-color-dark`, `--primary-color-light`).
- El interceptor de Axios (`services/api.js`) adjunta el header
  `Authorization: Bearer <token>` y cierra sesión automáticamente ante un 401.
- El layout es responsivo: `Sidebar` colapsable en escritorio, `Drawer`
  desplegable en tablet/móvil (`@media max-width: 1100px`).
- Los módulos de pago sin permiso activo aparecen bloqueados (🔒) en el menú.
- El login consulta `GET /api/auth/branding` (público, sin JWT) para pintar
  el logo y el color del médico *antes* de autenticarse — válido porque cada
  base de datos tiene un único médico.

### Despliegue en Vercel

Proyecto separado del backend. Variable de entorno:

```
VITE_API_URL   URL pública del backend + /api (ej. https://salud-backend.vercel.app/api)
```

Es una variable de **build time** (Vite la incrusta en el bundle) — tras
definirla o cambiarla hay que volver a desplegar (*Redeploy*), no basta con
guardarla. `frontend/vercel.json` agrega el *fallback* de SPA para que rutas
como `/pacientes` no den 404 al recargar la página.

## 4. Seguridad

### Autenticación
- Contraseñas con `bcrypt` (12 *salt rounds*), nunca en texto plano ni logueadas.
- Cambio de contraseña (`PUT /api/auth/password`) exige la contraseña actual.
- `POST /api/auth/login` tiene *rate limiting*: **5 intentos cada 15 minutos por IP** (`express-rate-limit`), responde `429` al superarlo.
  - Limitación conocida: en Vercel (serverless) el contador vive en memoria de cada instancia de función, así que no está garantizado que se comparta entre invocaciones distintas. Mitiga ataques automatizados básicos, pero no es una garantía absoluta. Para cerrarlo del todo se necesita un *store* compartido (ej. Upstash Redis).
- JWT con expiración de 8h, sin *refresh tokens* ni revocación activa todavía.
- El token se guarda en `localStorage` del navegador — trade-off aceptado por ahora: viable de robar solo si hay XSS (mitigado por el escape automático de React + la CSP de `helmet`), pero evita la complejidad de cookies `HttpOnly` entre dominios distintos (frontend y backend son proyectos de Vercel separados). Migrar a cookies `HttpOnly` + protección CSRF es la mejora de sesión pendiente de mayor impacto.

### Cabeceras HTTP y transporte
- `helmet` agrega `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, etc.
- HTTPS es automático en Vercel para todo dominio `*.vercel.app` (y dominios propios configurados) — no hay certificados que gestionar manualmente.
- CORS **falla cerrado**: si `CORS_ORIGIN` no está definida, no se permite ningún origen cross-origin (antes caía a `'*'`, abierto por defecto — corregido). Un despliegue mal configurado se rompe de forma visible en vez de quedar abierto silenciosamente.

### Separación de datos entre clientes
Cada cliente tiene su **propia base de datos física** (no un esquema dentro
de una base compartida). Dos clientes nunca comparten ni siquiera la
conexión de base de datos — el aislamiento lo da la infraestructura, no una
condición `WHERE` que pueda fallar por un bug de código.

### Permisos por módulo
`permisos_medicos` controla qué módulos (citas, pacientes, historias
clínicas, y los de pago: reportes, recordatorios SMS) tiene activos cada
médico. `modulo.middleware.js` responde 403 si el módulo no está activo,
sin importar si el JWT es válido.

### Registro de auditoría
Tabla `auditoria`: registra quién (médico), qué acción (`LOGIN_EXITOSO`,
`LOGIN_FALLIDO`, `CREAR`, `VER`, `ACTUALIZAR`, `ELIMINAR`), sobre qué entidad
y registro, con IP y fecha. Cubre login, y creación/consulta/edición/baja de
pacientes, citas e historias clínicas. Visible en la pantalla "Auditoría"
del frontend (`GET /api/auditoria`, paginado). Un fallo al guardar un evento
de auditoría nunca bloquea la operación principal.

### Monitoreo de errores
`@sentry/node` (backend) y `@sentry/react` (frontend), inicializados desde
el arranque. Sin `SENTRY_DSN`/`VITE_SENTRY_DSN` definidas, los SDK no envían
nada — seguro dejarlos sin configurar en desarrollo. Solo se reportan
errores 5xx inesperados, no errores de validación (400/401/403/404).

### Copias de seguridad y recuperación
Esto se configura en el proveedor, no en el código de la aplicación:
- **Neon**: ofrece *point-in-time recovery* automático — la ventana de
  retención depende del plan contratado. Verifica el plan actual de cada
  base de datos de cliente en el panel de Neon y confirma que la retención
  cubre tu tolerancia a pérdida de datos (ej. "puedo perder hasta X horas").
- **Vercel**: no almacena datos persistentes de la aplicación (las funciones
  son *stateless*), así que no hay nada que respaldar ahí — toda la
  recuperación depende de Neon.
- Recomendado como capa adicional: exportar periódicamente cada base de
  datos de cliente con `pg_dump` a un almacenamiento separado (ej. un bucket
  S3/R2), documentando el procedimiento de restauración
  (`pg_restore`/`psql < dump.sql` contra una base nueva) y probándolo al
  menos una vez para confirmar que funciona antes de necesitarlo de verdad.

### Cumplimiento normativo
El código aporta controles técnicos (cifrado en tránsito, contraseñas
hasheadas, auditoría, aislamiento por base de datos), pero el cumplimiento
legal de protección de datos (Habeas Data en Colombia, u otra norma según
el país del cliente) también requiere medidas organizacionales que no se
resuelven con código: política de privacidad, acuerdo de tratamiento de
datos con cada cliente, y procedimiento de notificación de incidentes.

## 5. Pruebas automatizadas

```bash
cd backend
createdb salud_test
psql -U postgres -d salud_test -f ../database/schema.sql
npm run crear-medico -- --nombre "Test Medico" --correo test@salud.test \
  --password "testpassword123" --documento TEST0001 --color azul
cp .env.example .env.test   # y ajusta DATABASE_URL a salud_test
npm test
```

Cubre: login (éxito, credenciales inválidas, campos faltantes), acceso a
rutas protegidas sin token o con token inválido, límite de intentos de
login, permisos por módulo (activar/desactivar y verificar 403↔200), y
pacientes/historias clínicas (creación, consulta, baja lógica y que quede
registro de auditoría). Corre contra una base de datos de pruebas real
(no *mocks*) para validar el comportamiento genuino de PostgreSQL.

## Estructura

```
database/schema.sql          Todas las tablas (public), idempotente
backend/
  api/index.js                Entry point serverless (Vercel)
  scripts/crear-medico.js      Aprovisiona el médico de una base de datos
  src/
    config/db.js               Pool de PostgreSQL (SSL condicional por host)
    instrument.js               Inicialización de Sentry (primero en cargar)
    utils/jwt.js, auditoria.js  Firma/verificación de JWT, registro de auditoría
    middleware/                 auth, permisos por módulo, rate limit, errores
    controllers/, routes/       auth, pacientes, citas, historias, tabla maestra, auditoría
  tests/                        Jest + Supertest, contra base de datos real
frontend/
  vercel.json                   Fallback de SPA
  src/
    context/AuthContext.jsx      Sesión + tema dinámico
    theme/paletas.js             Paletas de color disponibles
    utils/generarPdfHistoria.js  PDF de evoluciones clínicas (jsPDF)
    components/layout/           Sidebar/Drawer responsivo
    pages/{auth,pacientes,citas,historias,configuracion,auditoria}/
```
