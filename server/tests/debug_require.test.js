const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

console.log('[debug] sqlite3 loaded:', !!sqlite3?.Database);
console.log('[debug] bcrypt loaded:', typeof bcrypt?.hashSync === 'function');

test('noop', () => {
  expect(true).toBe(true);
});
