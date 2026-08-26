const { Router } = require('express');
const ctrl = require('../controllers/tablaMaestra.controller');
const { autenticarJWT } = require('../middleware/auth.middleware');
const { asignarTenant } = require('../middleware/tenant.middleware');

const router = Router();

router.use(autenticarJWT, asignarTenant);

router.get('/:tipo', ctrl.listarPorTipo);

module.exports = router;
