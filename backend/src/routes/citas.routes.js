const { Router } = require('express');
const ctrl = require('../controllers/citas.controller');
const { autenticarJWT } = require('../middleware/auth.middleware');
const { requiereModulo } = require('../middleware/modulo.middleware');

const router = Router();

router.use(autenticarJWT, requiereModulo('citas'));

router.get('/', ctrl.listar);
router.get('/hoy', ctrl.agendaHoy);
router.get('/:id', ctrl.obtener);
router.post('/', ctrl.crear);
router.put('/:id', ctrl.actualizar);
router.delete('/:id', ctrl.eliminar);

module.exports = router;
