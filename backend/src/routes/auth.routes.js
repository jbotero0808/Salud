const { Router } = require('express');
const { login, perfil } = require('../controllers/auth.controller');
const { autenticarJWT } = require('../middleware/auth.middleware');

const router = Router();

router.post('/login', login);
router.get('/perfil', autenticarJWT, perfil);

module.exports = router;
