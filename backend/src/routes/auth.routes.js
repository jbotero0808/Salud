const { Router } = require('express');
const { login, perfil, actualizarPerfil, cambiarPassword } = require('../controllers/auth.controller');
const { autenticarJWT } = require('../middleware/auth.middleware');

const router = Router();

router.post('/login', login);
router.get('/perfil', autenticarJWT, perfil);
router.put('/perfil', autenticarJWT, actualizarPerfil);
router.put('/password', autenticarJWT, cambiarPassword);

module.exports = router;
