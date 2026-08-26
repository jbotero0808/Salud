const { Router } = require('express');
const ctrl = require('../controllers/historias.controller');
const { autenticarJWT } = require('../middleware/auth.middleware');
const { asignarTenant } = require('../middleware/tenant.middleware');
const { requiereModulo } = require('../middleware/modulo.middleware');

const router = Router();

router.use(autenticarJWT, requiereModulo('historias_clinicas'), asignarTenant);

router.get('/paciente/:pacienteId', ctrl.listarPorPaciente);
router.get('/:id', ctrl.obtener);
router.post('/', ctrl.crear);
router.put('/:id', ctrl.actualizar);
router.delete('/:id', ctrl.eliminar);

module.exports = router;
