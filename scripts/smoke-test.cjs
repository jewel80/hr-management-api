#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Integration smoke test for the HR Management API.
 *
 * Requires a RUNNING server and a SEEDED database:
 *   npm run db:migrate:latest && npm run db:seed
 *   npm run start:dev          # in another terminal
 *   npm run test:smoke
 *
 * Overrides via env (defaults shown):
 *   SMOKE_BASE=http://localhost:3000
 *   SMOKE_USER=admin@example.com
 *   SMOKE_PASS=Admin@12345
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

const BASE = process.env.SMOKE_BASE || 'http://localhost:3000';
const USER = process.env.SMOKE_USER || 'admin@example.com';
const PASS = process.env.SMOKE_PASS || 'Admin@12345';

let pass = 0;
let fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) {
    pass++;
    console.log('PASS', name, extra);
  } else {
    fail++;
    console.log('FAIL', name, extra);
  }
};

const pngB64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNk+M8AAAMBAQDJ/pLvAAAAAElFTkSuQmCC';
const tmpPng = path.join(os.tmpdir(), 'hr-smoke.png');

(async () => {
  fs.writeFileSync(tmpPng, Buffer.from(pngB64, 'base64'));

  // 1. protected route without token -> 401
  let r = await fetch(`${BASE}/employees`).catch(() => null);
  if (!r) {
    console.error(`Could not reach ${BASE}. Is the server running?`);
    process.exit(2);
  }
  ok('GET /employees without token -> 401', r.status === 401, `status=${r.status}`);

  // 2. login
  r = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: USER, password: PASS }),
  });
  let body = await r.json();
  ok(
    'POST /auth/login -> 200 + token',
    r.status === 200 && body.success && !!body.data?.accessToken,
    `status=${r.status}`,
  );
  const token = body.data?.accessToken;
  const auth = { Authorization: `Bearer ${token}` };

  // 3. employees list + envelope + pagination
  r = await fetch(`${BASE}/employees?page=1&limit=10`, { headers: auth });
  body = await r.json();
  ok(
    'GET /employees -> items + meta',
    r.status === 200 && Array.isArray(body.data?.items) && !!body.data?.meta?.total,
    `items=${body.data?.items?.length} total=${body.data?.meta?.total}`,
  );
  const empId = body.data?.items?.[0]?.id;

  // 4. ILIKE search
  const first = body.data?.items?.[0]?.name?.split(' ')[0] ?? 'a';
  r = await fetch(`${BASE}/employees?search=${encodeURIComponent(first)}`, {
    headers: auth,
  });
  body = await r.json();
  ok(
    'GET /employees?search -> at least 1 match',
    r.status === 200 && (body.data?.items?.length ?? 0) >= 1,
    `items=${body.data?.items?.length}`,
  );

  // 5. validation -> 400 error envelope
  r = await fetch(`${BASE}/employees`, {
    method: 'POST',
    headers: { ...auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'X' }),
  });
  body = await r.json();
  ok(
    'POST /employees invalid body -> 400 error envelope',
    r.status === 400 && body.success === false && !!body.error,
    `status=${r.status} code=${body.error?.code}`,
  );

  // 6. reports for current month (YYYY-MM)
  const month = new Date().toISOString().slice(0, 7);
  r = await fetch(`${BASE}/reports/attendance?month=${month}`, { headers: auth });
  body = await r.json();
  ok(
    'GET /reports/attendance -> report rows',
    r.status === 200 && body.data?.month === month && Array.isArray(body.data?.items),
    `rows=${body.data?.items?.length}`,
  );

  // 7. attendance upsert
  const date = new Date().toISOString().slice(0, 10);
  r = await fetch(`${BASE}/attendance`, {
    method: 'POST',
    headers: { ...auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ employee_id: empId, date, check_in_time: '08:30' }),
  });
  body = await r.json();
  const firstId = body.data?.id;
  ok(
    'POST /attendance inserts + normalizes HH:mm -> HH:mm:ss',
    r.status >= 200 && r.status < 300 && body.data?.check_in_time === '08:30:00',
    `status=${r.status} time=${body.data?.check_in_time}`,
  );
  r = await fetch(`${BASE}/attendance`, {
    method: 'POST',
    headers: { ...auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ employee_id: empId, date, check_in_time: '10:15:00' }),
  });
  body = await r.json();
  ok(
    'POST /attendance upsert: same (employee,date) updates, no duplicate',
    r.status >= 200 &&
      r.status < 300 &&
      body.data?.id === firstId &&
      body.data?.check_in_time === '10:15:00',
    `sameId=${body.data?.id === firstId} time=${body.data?.check_in_time}`,
  );

  // 8. multipart create with photo
  const form = new FormData();
  form.append('name', 'Smoke User');
  form.append('age', '29');
  form.append('designation', 'QA Engineer');
  form.append('hiring_date', '2024-01-01');
  form.append('date_of_birth', '1996-01-01');
  form.append('salary', '95000');
  form.append(
    'photo',
    new Blob([fs.readFileSync(tmpPng)], { type: 'image/png' }),
    'photo.png',
  );
  r = await fetch(`${BASE}/employees`, { method: 'POST', headers: auth, body: form });
  body = await r.json();
  ok(
    'POST /employees multipart with photo -> photo_url',
    r.status >= 200 &&
      r.status < 300 &&
      !!body.data?.photo_url &&
      body.data?.salary === 95000,
    `status=${r.status} photo_url=${body.data?.photo_url}`,
  );

  // 9. photo is served
  if (body.data?.photo_url) {
    const pr = await fetch(body.data.photo_url);
    ok(
      'GET /uploads/<file> serves the photo',
      pr.status === 200 && pr.headers.get('content-type') === 'image/png',
      `status=${pr.status} ct=${pr.headers.get('content-type')}`,
    );
  }

  console.log(`\nRESULT pass=${pass} fail=${fail}`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => {
  console.error('SMOKE ERROR', e);
  process.exit(2);
});
