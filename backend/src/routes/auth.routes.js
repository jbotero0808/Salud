const { Router } = require('express');
const { branding, login, perfil, actualizarPerfil, cambiarPassword } = require('../controllers/auth.controller');
const { autenticarJWT } = require('../middleware/auth.middleware');
const { limitadorLogin } = require('../middleware/rateLimit.middleware');

const router = Router();

router.get('/branding', branding);
router.post('/login', limitadorLogin, login);
router.get('/perfil', autenticarJWT, perfil);
router.put('/perfil', autenticarJWT, actualizarPerfil);
router.put('/password', autenticarJWT, cambiarPassword);

module.exports = router;
