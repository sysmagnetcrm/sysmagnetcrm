const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const request = require('supertest');

// Give the suite more time in CI/Windows
jest.setTimeout(120000);

console.log('[tests] starting app.test.js');

// Utility: wait for a table to exist
function waitForTable(dbPath, table, timeoutMs = 20000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      const db = new sqlite3.Database(dbPath);
      db.get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", [table], (err, row) => {
        db.close();
        if (row && row.name === table) return resolve();
        if (Date.now() - start > timeoutMs) return reject(new Error(`Timeout waiting for table ${table}`));
        setTimeout(check, 100);
      });
    };
    check();
  });
}

// Global test state
let app;
let dbPath;
let adminToken;
let staffToken;
let adminUser = { name: 'Test Admin', email: 'admin@test.local', password: 'adminpass', role: 'admin' };
let staffUser = { name: 'Dev One', email: 'dev1@test.local', password: 'devpass', role: 'developer' };

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  // set a small but reasonable attach size limit for testing
  process.env.MAX_ATTACHMENT_SIZE_BYTES = String(1 * 1024 * 1024); // 1MB
  // use a unique DB per run
  const tmpDir = path.join(__dirname, 'tmp');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  dbPath = path.join(tmpDir, `test-${Date.now()}.db`);
  process.env.DB_PATH = dbPath;
  console.log('[tests] DB_PATH:', dbPath);
  // Require the app AFTER envs are set
  try {
    app = require('../server');
    console.log('[tests] App required');
  } catch (e) {
    console.error('[tests] App require failed:', e && (e.stack || e));
    throw e;
  }

  // wait for core tables
  await waitForTable(dbPath, 'users');
  console.log('[tests] users table ready');

  // seed users directly
  const db = new sqlite3.Database(dbPath);
  await new Promise((resolve, reject) => {
    const stmt = db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)");
    stmt.run([adminUser.name, adminUser.email, bcrypt.hashSync(adminUser.password, 10), adminUser.role], function (err) {
      if (err) return reject(err);
      adminUser.id = this.lastID;
      resolve();
    });
  });
  console.log('[tests] admin user seeded');
  await new Promise((resolve, reject) => {
    const stmt = db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)");
    stmt.run([staffUser.name, staffUser.email, bcrypt.hashSync(staffUser.password, 10), staffUser.role], function (err) {
      if (err) return reject(err);
      staffUser.id = this.lastID;
      resolve();
    });
  });
  console.log('[tests] staff user seeded');
  db.close();
});

afterAll(async () => {
  try { fs.unlinkSync(dbPath); } catch {}
});

describe('Health & Auth', () => {
  test('GET /api/ping works', async () => {
    const res = await request(app).get('/api/ping');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
  });

  test('POST /api/auth/login returns token for admin', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: adminUser.email, password: adminUser.password });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    adminToken = res.body.token;
  });

  test('POST /api/auth/login returns token for staff', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: staffUser.email, password: staffUser.password });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    staffToken = res.body.token;
  });
});

describe('Settings & Notifications & Client Tasks', () => {
  let taskId;

  test('PUT /api/admin/settings sets a flag', async () => {
    const res = await request(app)
      .put('/api/admin/settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ key: 'ENABLE_FALLBACK_REASSIGN', value: 'false' });
    expect(res.status).toBe(200);
  });

  test('GET /api/admin/settings reads a flag', async () => {
    const res = await request(app)
      .get('/api/admin/settings?keys=ENABLE_FALLBACK_REASSIGN')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('ENABLE_FALLBACK_REASSIGN', 'false');
  });

  test('POST /api/client/tasks (by admin) creates a task and notifies admin', async () => {
    const res = await request(app)
      .post('/api/client/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Test Client Task',
        description: 'Ensure flows',
        required_roles: ['developer'],
        priority: 'High'
      });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    taskId = res.body.id;

    const notif = await request(app)
      .get('/api/notifications?only_unread=1&limit=10')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(notif.status).toBe(200);
    const hasCreated = (notif.body || []).some(n => n.type === 'task.created' && JSON.parse(n.data || '{}').task_id === taskId);
    expect(hasCreated).toBe(true);
  });

  test('Manual assignment notifies staff', async () => {
    const res = await request(app)
      .post(`/api/admin/tasks/${taskId}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ method: 'manual', assignee_id: staffUser.id });
    expect(res.status).toBe(200);

    const notif = await request(app)
      .get('/api/notifications?only_unread=1&limit=10')
      .set('Authorization', `Bearer ${staffToken}`);
    expect(notif.status).toBe(200);
    const hasAssigned = (notif.body || []).some(n => n.type === 'task.assigned' && JSON.parse(n.data || '{}').task_id === taskId);
    expect(hasAssigned).toBe(true);
  });

  test('Deliverables required: reject submit without attachments', async () => {
    const res = await request(app)
      .post(`/api/staff/tasks/${taskId}/submit`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ logs: [{ message: 'Work done', time_spent: 30 }], attachments: [] });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/deliverable attachment is required/i);
  });

  test('Submit with valid attachments succeeds and notifies admin', async () => {
    const res = await request(app)
      .post(`/api/staff/tasks/${taskId}/submit`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        logs: [{ message: 'Done and attached', time_spent: 45 }],
        attachments: [ { filename: 'deliverable.txt', storage_path: '/tmp/deliverable.txt', size: 512 } ]
      });
    expect(res.status).toBe(200);

    const notif = await request(app)
      .get('/api/notifications?only_unread=1&limit=10')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(notif.status).toBe(200);
    const hasSubmitted = (notif.body || []).some(n => n.type === 'task.submitted' && JSON.parse(n.data || '{}').task_id === taskId);
    expect(hasSubmitted).toBe(true);
  });

  test('Reject invalid extension on task creation attachments', async () => {
    const res = await request(app)
      .post('/api/client/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Bad Attach', attachments: [{ filename: 'malware.exe', size: 100 }] });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/extension not allowed/i);
  });

  test('Reject too-large attachment (simulated metadata)', async () => {
    const res = await request(app)
      .post('/api/client/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Too Large', attachments: [{ filename: 'big.zip', size: 2 * 1024 * 1024 }] });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/too large/i);
  });
});
