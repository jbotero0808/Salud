const { Router } = require('express');
const ctrl = require('../controllers/auditoria.controller');
const { autenticarJWT } = require('../middleware/auth.middleware');

const router = Router();

router.use(autenticarJWT);
router.get('/', ctrl.listar);

module.exports = router;
