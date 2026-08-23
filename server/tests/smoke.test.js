test('smoke loads server module', () => {
  process.env.NODE_ENV = 'test';
  const app = require('../server');
  expect(typeof app).toBe('function');
});
