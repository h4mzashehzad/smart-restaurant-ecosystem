import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { request, createServer } from 'node:http';
import { ServiceManager } from '../manager.mjs';
import { startDashboard } from '../server.mjs';
import { readEnv, serviceDefinitions, createRedactor } from '../config.mjs';

test('local dashboard serves assets, protects actions, and streams status', async (t) => {
  const manager = new ServiceManager({ root: tmpdir(), services: [] });
  const dashboard = await startDashboard({ manager, port: 0, quiet: true });
  t.after(() => dashboard.close());
  const page = await fetch(dashboard.url);
  assert.equal(page.status, 200);
  assert.match(page.headers.get('content-security-policy'), /frame-ancestors 'none'/);
  const html = await page.text();
  const token = html.match(/name="dev-token" content="([a-f0-9]+)"/)[1];
  const headers = { 'X-Dev-Token': token };
  for (const asset of ['/style.css', '/tokens.css', '/app.js']) assert.equal((await fetch(dashboard.url + asset)).status, 200);
  assert.equal((await fetch(dashboard.url + '/api/start-all', { method: 'POST' })).status, 403);
  assert.equal((await fetch(dashboard.url + '/api/start-all', { method: 'POST', headers: { ...headers, Origin: 'https://untrusted.example' } })).status, 403);
  assert.equal((await fetch(dashboard.url + '/api/services/arbitrary/start', { method: 'POST', headers })).status, 404);
  const reboundStatus = await new Promise((done, reject) => {
    const req = request(dashboard.url + '/api/state', { headers: { ...headers, Host: 'rebound.example' } }, (response) => {
      response.resume();
      done(response.statusCode);
    });
    req.on('error', reject);
    req.end();
  });
  assert.equal(reboundStatus, 403);
  const state = await fetch(dashboard.url + '/api/state', { headers });
  assert.deepEqual((await state.json()).services, []);
  const stream = await fetch(dashboard.url + `/api/events?token=${token}`);
  const reader = stream.body.getReader();
  const first = new TextDecoder().decode((await reader.read()).value);
  assert.match(first, /event: snapshot/);
  manager.log('launcher', 'live log fixture');
  const next = new TextDecoder().decode((await reader.read()).value);
  assert.match(next, /live log fixture/);
  await reader.cancel();
  assert.equal((await fetch(dashboard.url + '/api/start-all', { method: 'POST', headers })).status, 202);
});

test('config reads project ports without registering Redis or changing APP_URL', async (t) => {
  const root = await mkdtemp(resolve(tmpdir(), 'restaurant-config-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const directory of ['backend', 'frontend', 'socket-server', 'ml-service']) await mkdir(resolve(root, directory));
  await writeFile(resolve(root, 'backend/.env'), 'APP_URL="https://fixed.example"\nQUEUE_CONNECTION=database\nAPP_KEY=secret-fixture-key\n');
  await writeFile(resolve(root, 'ml-service/.env'), 'PORT=5005\nDB_PASSWORD=secret-password\n');
  await writeFile(resolve(root, 'socket-server/.env'), 'PORT=3001\nLARAVEL_API_URL=http://smart-restaurant-ecosystem.test\n');
  const definitions = serviceDefinitions(root);
  assert.equal(definitions.services.find((item) => item.id === 'ml').port, 5005);
  assert.equal(definitions.services.find((item) => item.id === 'ngrok').url, 'https://fixed.example');
  assert.ok(!definitions.services.some((item) => item.id === 'redis'));
  assert.equal(readEnv(resolve(root, 'backend/.env')).APP_URL, 'https://fixed.example');
  const redact = createRedactor(root);
  assert.equal(redact('secret-fixture-key secret-password redis://name:password@localhost:6379'), '[redacted] [redacted] redis://[redacted]@localhost:6379');
  assert.equal(redact('Debugger PIN: 123-456-789'), 'Debugger PIN: [redacted]');
});

test('ngrok readiness verifies the fixed URL and supports older agent APIs', async (t) => {
  const previous = process.env.DEV_NGROK_API;
  let legacy = false;
  const api = createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    if (req.url === '/api/endpoints' && legacy) { res.writeHead(404); res.end('{}'); return; }
    res.end(JSON.stringify(legacy ? { tunnels: [{ public_url: 'https://fixed.example' }] } : { endpoints: [{ url: 'https://fixed.example' }] }));
  });
  await new Promise((done) => api.listen(0, '127.0.0.1', done));
  process.env.DEV_NGROK_API = `http://127.0.0.1:${api.address().port}`;
  t.after(async () => {
    if (previous === undefined) delete process.env.DEV_NGROK_API; else process.env.DEV_NGROK_API = previous;
    await new Promise((done) => api.close(done));
  });
  const manager = new ServiceManager({ root: tmpdir(), services: [] });
  assert.equal(await manager.ngrokReady({ expectedUrl: 'https://fixed.example' }), true);
  assert.equal(await manager.ngrokReady({ expectedUrl: 'https://wrong.example' }), false);
  legacy = true;
  assert.equal(await manager.ngrokReady({ expectedUrl: 'https://fixed.example' }), true);
});
