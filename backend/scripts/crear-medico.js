// Crea el médico (usuario) de la base de datos de UN cliente.
// No hay registro público: cada base de datos pertenece a un solo
// cliente, y este script es lo que corre el administrador (tú) una
// vez, después de aprovisionar esa base de datos con database/schema.sql.
//
// Uso:
//   node scripts/crear-medico.js \
//     --nombre "Juan Botero" \
//     --correo juan@equimax.com \
//     --password "unaClaveSegura123" \
//     --documento 1035861377 \
//     --empresa "EquiMax" \
//     --celular 3001234567 \
//     --logo https://... \
//     --color verde

require('dotenv').config();
const bcrypt = require('bcrypt');
const { pool } = require('../src/config/db');

const SALT_ROUNDS = 12;
const COLORES_VALIDOS = ['rojo', 'azul', 'verde', 'morado', 'naranja', 'teal'];

function leerArgs() {
  const args = {};
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith('--')) {
      const clave = argv[i].slice(2);
      const valor = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true;
      args[clave] = valor;
      if (valor !== true) i += 1;
    }
  }
  return args;
}

async function main() {
  const args = leerArgs();
  const { nombre, correo, password, documento, empresa, celular, logo, color } = args;

  if (!nombre || !correo || !password || !documento) {
    console.error('Faltan argumentos obligatorios: --nombre --correo --password --documento');
    console.error('Ver el encabezado de este archivo para un ejemplo completo.');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('La contraseña debe tener al menos 8 caracteres.');
    process.exit(1);
  }

  const colorFinal = COLORES_VALIDOS.includes(color) ? color : 'azul';

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const { rows } = await client.query(
      `INSERT INTO public.medicos
        (nombre, correo, password_hash, celular, foto_logo_url, documento_identidad, empresa, color_primario)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id`,
      [nombre, correo, passwordHash, celular || null, logo || null, documento, empresa || null, colorFinal]
    );
    const medicoId = rows[0].id;

    // Activa automáticamente los módulos gratuitos del catálogo.
    await client.query(
      `INSERT INTO public.permisos_medicos (medico_id, modulo_id, activo)
       SELECT $1, m.id, true FROM public.modulos m WHERE m.es_pago = false
       ON CONFLICT (medico_id, modulo_id) DO NOTHING`,
      [medicoId]
    );

    await client.query('COMMIT');
    console.log(`Médico creado con id=${medicoId} (${correo}).`);
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      console.error('Ya existe un médico con ese correo o documento de identidad.');
    } else {
      console.error('Error creando el médico:', err.message);
    }
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
