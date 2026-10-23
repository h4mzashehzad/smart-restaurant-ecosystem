import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { ServiceManager } from '../manager.mjs';

async function fixture(t, definitions, options = {}) {
  const root = await mkdtemp(resolve(tmpdir(), 'restaurant-launcher-'));
  const manager = new ServiceManager({ root,
    services: definitions.map((item) => ({ name: item.id, directory: '.', command: 'test fixture', executable: process.execPath, ...item })),
    ...options,
  });
  t.after(async () => { await manager.stopAll(); await rm(root, { recursive: true, force: true }); });
  return { root, manager };
}

async function until(predicate, timeout = 5000) {
  const deadline = Date.now() + timeout;
  while (!predicate() && Date.now() < deadline) await delay(20);
  assert.ok(predicate(), 'Condition did not become true');
}

test('streams output, observes failures after startup, and can restart', async (t) => {
  const { manager } = await fixture(t, [{ id: 'worker', args: ['-e', 'console.log("worker ready"); setTimeout(() => process.exit(7), 1300)'] }]);
  await manager.start('worker');
  assert.equal(manager.states.get('worker').status, 'running');
  assert.ok(manager.logs.some((entry) => entry.text.includes('worker ready')));
  await until(() => manager.states.get('worker').status === 'failed');
  assert.equal(manager.states.get('worker').exitCode, 7);
  await manager.restart('worker');
  assert.equal(manager.states.get('worker').status, 'running');
  await manager.stop('worker');
  assert.equal(manager.states.get('worker').status, 'stopped');
});

test('readiness failure stays degraded and recovers without a restart', async (t) => {
  let ready = false;
  const { manager } = await fixture(t, [{ id: 'web', args: ['-e', 'setInterval(() => {}, 1000)'], healthUrl: 'http://test', startupTimeout: 30 }], { probe: async () => ready });
  await manager.start('web');
  assert.equal(manager.states.get('web').status, 'degraded');
  ready = true;
  await manager.monitor();
  assert.equal(manager.states.get('web').status, 'ready');
});

test('an occupied port is reported without spawning or terminating its owner', async (t) => {
  const { manager } = await fixture(t, [{ id: 'web', args: ['-e', 'throw new Error("must not spawn")'], port: 9999 }], { checkPort: async () => true });
  await manager.start('web');
  assert.equal(manager.children.size, 0);
  assert.match(manager.states.get('web').detail, /already in use/);
});

test('missing executables become actionable failures', async (t) => {
  const { manager } = await fixture(t, [{ id: 'missing', executable: '/definitely/missing/binary', args: [] }]);
  await manager.start('missing');
  assert.equal(manager.states.get('missing').status, 'failed');
  assert.match(manager.states.get('missing').detail, /Cannot find/);
});

test('Stop all cancels setup and never launches the app or dependent scheduler', async (t) => {
  const { root, manager } = await fixture(t, [
    { id: 'ml', prepare: { executable: process.execPath, args: ['-e', 'console.log("preparing"); setInterval(() => {}, 1000)'] }, args: ['-e', 'require("fs").writeFileSync("should-not-exist", "bad")'] },
    { id: 'scheduler', dependsOn: ['ml'], args: ['-e', 'require("fs").writeFileSync("scheduler-started", "bad")'] },
  ]);
  const start = manager.startAll();
  await until(() => manager.states.get('ml').status === 'preparing' && manager.children.has('ml'));
  await manager.stopAll();
  await start;
  assert.ok([...manager.states.values()].every((item) => item.status === 'stopped'));
  assert.equal(manager.children.size, 0);
  await assert.rejects(readFile(resolve(root, 'should-not-exist')), { code: 'ENOENT' });
  await assert.rejects(readFile(resolve(root, 'scheduler-started')), { code: 'ENOENT' });
});

test('stopping a parent terminates its child process group', async (t) => {
  const { root, manager } = await fixture(t, [{ id: 'tree', args: ['-e', `
    const { spawn } = require('child_process');
    const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' });
    require('fs').writeFileSync('child-pid', String(child.pid));
    setInterval(() => {}, 1000);
  `] }]);
  await manager.start('tree');
  const pid = Number(await readFile(resolve(root, 'child-pid'), 'utf8'));
  assert.doesNotThrow(() => process.kill(pid, 0));
  await manager.stop('tree');
  await until(() => { try { process.kill(pid, 0); return false; } catch { return true; } });
});

test('Start all waits for ML before starting the scheduler', async (t) => {
  const { manager } = await fixture(t, [
    { id: 'ml', healthUrl: 'http://ml', args: ['-e', 'setInterval(() => {}, 1000)'] },
    { id: 'scheduler', dependsOn: ['ml'], args: ['-e', 'setInterval(() => {}, 1000)'] },
  ], { probe: async () => { await delay(100); return true; } });
  let readyAt;
  let schedulerAt;
  manager.on('state', (snapshot) => {
    if (snapshot.services[0].status === 'ready') readyAt ||= Date.now();
    if (snapshot.services[1].pid) schedulerAt ||= Date.now();
  });
  await manager.startAll();
  assert.ok(readyAt && schedulerAt >= readyAt);
  assert.equal(manager.states.get('scheduler').status, 'running');
});

test('failed setup prevents app startup, and logs are bounded and redacted', async (t) => {
  const { manager } = await fixture(t, [{ id: 'ml', prepare: { executable: process.execPath, args: ['-e', 'process.exit(3)'] }, args: ['-e', 'throw new Error("must not run")'] }], { redact: (text) => String(text).replaceAll('secret-value', '[redacted]') });
  await manager.start('ml');
  assert.equal(manager.states.get('ml').status, 'failed');
  for (let index = 0; index < 1100; index++) manager.log('ml', `secret-value ${index}`);
  assert.equal(manager.logs.length, 1000);
  assert.ok(manager.logs.every((entry) => !entry.text.includes('secret-value')));
  assert.match(manager.logs.at(-1).text, /1099/);
});

test('duplicate starts share a single process', async (t) => {
  const { manager } = await fixture(t, [{ id: 'worker', args: ['-e', 'setInterval(() => {}, 1000)'] }]);
  const first = manager.start('worker');
  const second = manager.start('worker');
  assert.equal(first, second);
  await Promise.all([first, second]);
  assert.equal(manager.children.size, 1);
});
