module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/setupEnv.js'],
  testTimeout: 15000,
  // Cada archivo de prueba corre en su propio proceso/registro de módulos,
  // así que el contador en memoria de express-rate-limit no se comparte
  // entre archivos — evita que las pruebas de login interfieran entre sí.
  testEnvironmentOptions: {},
};
