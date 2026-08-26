const { Router } = require('express');
const ctrl = require('../controllers/pacientes.controller');
const { autenticarJWT } = require('../middleware/auth.middleware');
const { asignarTenant } = require('../middleware/tenant.middleware');
const { requiereModulo } = require('../middleware/modulo.middleware');

const router = Router();

router.use(autenticarJWT, requiereModulo('pacientes'), asignarTenant);

router.get('/', ctrl.listar);
router.get('/:id', ctrl.obtener);
router.post('/', ctrl.crear);
router.put('/:id', ctrl.actualizar);
router.delete('/:id', ctrl.eliminar);

module.exports = router;
