const request = require('supertest');

// Import the Supabase-backed server (it exports the Express app)
const app = require('../server.supabase');

describe('Supabase server health', () => {
  test('GET /api/ping returns ok=true', async () => {
    const res = await request(app).get('/api/ping');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
  });
});
