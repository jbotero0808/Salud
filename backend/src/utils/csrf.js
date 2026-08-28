const crypto = require('crypto');

function generarTokenCsrf() {
  return crypto.randomBytes(32).toString('hex');
}

module.exports = { generarTokenCsrf };
