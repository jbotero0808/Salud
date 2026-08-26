const { Router } = require('express');
const ctrl = require('../controllers/tablaMaestra.controller');
const { autenticarJWT } = require('../middleware/auth.middleware');

const router = Router();

router.use(autenticarJWT);

router.get('/:tipo', ctrl.listarPorTipo);

module.exports = router;
