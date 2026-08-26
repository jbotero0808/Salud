# Salud — SaaS Multitenant para Profesionales de la Salud

Arquitectura: **schema-per-tenant** en PostgreSQL. Cada médico tiene su propio
esquema (`medico_<id>`) con sus tablas de pacientes, citas e historias
clínicas; el esquema `public` guarda el catálogo global (médicos, módulos y
permisos).

## 1. Base de datos

```bash
createdb salud
psql -U postgres -d salud -f database/schema.sql
```

Esto crea las tablas de `public`, el catálogo de módulos y la función
`crear_esquema_medico(p_medico_id, p_schema_name)`, invocada automáticamente
por el backend en cada registro.

## 2. Backend (Node.js + Express)

```bash
cd backend
cp .env.example .env   # ajusta credenciales de PostgreSQL y JWT_SECRET
npm install
npm run dev            # http://localhost:4000
```

- El hashing de contraseñas usa `bcrypt` (12 salt rounds).
- El JWT incluye `medico_id`, `correo`, `schema_name` y `color_primario`.
- El middleware `tenant.middleware.js` reserva un cliente dedicado del pool
  de PostgreSQL por petición y ejecuta `SET search_path TO <schema_name>`
  antes de llegar a los controladores (imprescindible: `pool.query()` suelto
  no sirve porque cada llamada podría usar una conexión física distinta).
- `modulo.middleware.js` bloquea con 403 los módulos de pago no habilitados
  en `permisos_medicos`.

Si `npm install` falla al compilar `bcrypt` (falta de herramientas de
compilación nativa), puede sustituirse por `bcryptjs` sin cambiar la API.

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
- El layout es responsivo: `Sidebar` fijo en escritorio, `Drawer` desplegable
  en tablet/mobile (`@media max-width: 900px`).
- Los módulos de pago sin permiso activo aparecen bloqueados (🔒) en el menú.

## Estructura

```
database/schema.sql          Esquema public + función de aprovisionamiento
backend/src/
  config/db.js                Pool de PostgreSQL
  utils/jwt.js                 Firma/verificación de JWT
  middleware/                  auth, tenant (search_path), permisos por módulo
  controllers/, routes/        auth, pacientes, citas, historias
frontend/src/
  context/AuthContext.jsx      Sesión + tema dinámico
  theme/paletas.js             Paletas de color disponibles
  components/layout/           Sidebar/Drawer responsivo
  pages/{auth,pacientes,citas,historias}/
```
