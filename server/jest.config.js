/** @type {import('jest').Config} */
module.exports = {
  rootDir: __dirname,
  testEnvironment: 'node',
  testMatch: ['**/tests/supabase.*.test.js'],
  verbose: true,
  testTimeout: 120000,
  // Ensure Jest does not try to apply babel-jest using client babel config
  transform: {},
  moduleFileExtensions: ['js', 'json'],
  setupFiles: ['<rootDir>/tests/jest.setup.js']
};
