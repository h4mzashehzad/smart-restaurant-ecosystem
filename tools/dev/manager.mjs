import { EventEmitter } from 'node:events';
import { spawn } from 'node:child_process';
import { access } from 'node:fs/promises';
import { createConnection } from 'node:net';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

export async function httpProbe(url, timeout = 2500) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(timeout), redirect: 'manual' });
    await response.body?.cancel();
    return response.status >= 200 && response.status < 400;
  } catch { return false; }
}

export function tcpProbe(host, port) {
  return new Promise((done) => {
    const socket = createConnection({ host, port });
    const finish = (result) => { socket.destroy(); done(result); };
    socket.setTimeout(1500);
    socket.once('connect', () => finish(true));
    socket.once('error', () => finish(false));
    socket.once('timeout', () => finish(false));
  });
}

const activeStates = new Set(['preparing', 'starting', 'ready', 'running', 'degraded', 'stopping']);

export class ServiceManager extends EventEmitter {
  constructor({ root, services, external = [], redact = String, probe = httpProbe, checkPort = tcpProbe }) {
    super();
    this.root = root;
    this.redact = redact;
    this.probe = probe;
    this.checkPort = checkPort;
    this.definitions = new Map(services.map((item) => [item.id, item]));
    this.states = new Map(services.map((item) => [item.id, {
      id: item.id, name: item.name, subtitle: item.subtitle, directory: item.directory,
      command: item.command, url: item.url, port: item.port, status: 'stopped', detail: 'Ready to start',
      pid: null, startedAt: null, busy: false, exitCode: null,
    }]));
    this.external = external.map((item) => ({ ...item, status: 'checking' }));
    this.children = new Map();
    this.controllers = new Map();
    this.operations = new Map();
    this.logs = [];
    this.logSequence = 0;
    this.batch = null;
    this.closing = false;
  }

  snapshot() {
    return { services: [...this.states.values()].map((item) => ({ ...item })),
      external: this.external.map(({ healthUrl, ...item }) => ({ ...item })), batch: this.batch, closing: this.closing };
  }

  update(id, patch) {
    Object.assign(this.states.get(id), patch);
    this.emit('state', this.snapshot());
  }

  log(id, text, stream = 'system') {
    for (const line of this.redact(text).split(/\r?\n/)) {
      if (!line.trim()) continue;
      const entry = { id: ++this.logSequence, service: id, stream, text: line.slice(0, 6000), time: new Date().toISOString() };
      this.logs.push(entry);
      if (this.logs.length > 1000) this.logs.shift();
      this.emit('log', entry);
    }
  }

  async refreshExternal() {
    await Promise.all(this.external.map(async (item) => {
      const ready = item.kind === 'http' ? await this.probe(item.healthUrl) : await this.checkPort(item.host, item.port);
      item.status = ready ? 'available' : 'unavailable';
    }));
    this.emit('state', this.snapshot());
  }

  async dependencyCheck(definition) {
    for (const id of definition.dependsOn || []) {
      const external = this.external.find((item) => item.id === id);
      if (external) {
        const ready = external.kind === 'http' ? await this.probe(external.healthUrl) : await this.checkPort(external.host, external.port);
        if (!ready) throw new Error(`${external.name} is unavailable. Check your running Herd services, then retry.`);
      } else if (this.states.get(id)?.status !== 'ready') {
        throw new Error(`Start ${this.states.get(id)?.name || id} first and wait until it is ready.`);
      }
    }
  }

  spawnChild(id, executable, args, env, signal) {
    return new Promise((done, reject) => {
      if (signal.aborted) return reject(new Error('Startup cancelled'));
      const definition = this.definitions.get(id);
      const child = spawn(executable, args, {
        cwd: resolve(this.root, definition.directory),
        env: { ...process.env, ...definition.env, ...env, FORCE_COLOR: '0', NO_COLOR: '1' },
        detached: process.platform !== 'win32', stdio: ['ignore', 'pipe', 'pipe'],
      });
      this.children.set(id, child);
      this.update(id, { pid: child.pid || null });
      let stdout = '', stderr = '';
      const append = (chunk, stream) => {
        const current = (stream === 'stdout' ? stdout : stderr) + chunk.toString();
        const lines = current.split(/\r\n|\n|\r/);
        let remainder = lines.pop();
        if (remainder.length > 6000) { lines.push(remainder.slice(0, 6000)); remainder = ''; }
        for (const line of lines) this.log(id, line, stream);
        if (stream === 'stdout') stdout = remainder; else stderr = remainder;
      };
      child.stdout.on('data', (chunk) => append(chunk, 'stdout'));
      child.stderr.on('data', (chunk) => append(chunk, 'stderr'));
      child.once('error', (error) => {
        if (this.children.get(id) === child) this.children.delete(id);
        reject(new Error(error.code === 'ENOENT' ? `Cannot find ${executable}. Check installation or the launcher PATH.` : error.message));
      });
      child.once('close', (code, exitSignal) => {
        if (stdout) this.log(id, stdout, 'stdout');
        if (stderr) this.log(id, stderr, 'stderr');
        if (this.children.get(id) === child) this.children.delete(id);
        done({ code, signal: exitSignal, child });
      });
    });
  }

  start(id, { repair = false } = {}) {
    if (!this.definitions.has(id)) return Promise.reject(new Error('Unknown service'));
    if (this.closing) return Promise.reject(new Error('Dashboard is shutting down'));
    if (this.operations.has(id)) return this.operations.get(id);
    if (activeStates.has(this.states.get(id).status)) return Promise.resolve();
    const operation = this.startInternal(id, repair).finally(() => {
      this.operations.delete(id);
      if (!this.children.has(id)) this.controllers.delete(id);
      this.update(id, { busy: false });
    });
    this.operations.set(id, operation);
    return operation;
  }

  async startInternal(id, repair) {
    const definition = this.definitions.get(id);
    const controller = new AbortController();
    const { signal } = controller;
    this.controllers.set(id, controller);
    this.update(id, { busy: true, status: 'starting', detail: 'Checking prerequisites…', exitCode: null });
    try {
      for (const path of definition.requires || []) {
        try { await access(resolve(this.root, definition.directory, path)); }
        catch { throw new Error(`Missing ${definition.directory}/${path}. ${path === 'node_modules' ? `Run npm install inside ${definition.directory}.` : 'Complete the service setup, then retry.'}`); }
      }
      await this.dependencyCheck(definition);
      if (signal.aborted) throw new Error('Startup cancelled');
      if (definition.port && await this.checkPort('127.0.0.1', definition.port)) {
        throw new Error(`Port ${definition.port} is already in use. Stop the existing service in its terminal, then retry.`);
      }
      if (definition.ngrok) {
        const api = new URL(process.env.DEV_NGROK_API || 'http://127.0.0.1:4040');
        if (await this.checkPort(api.hostname, Number(api.port || 80))) {
          throw new Error('The ngrok inspection port is already in use. Stop the existing ngrok agent in its terminal before starting it here.');
        }
      }
      if (definition.prepare) {
        this.update(id, { status: 'preparing', detail: repair ? 'Repairing Python dependencies and NLP assets…' : 'Checking Python environment and NLP assets…' });
        const result = await this.spawnChild(id, definition.prepare.executable,
          [...definition.prepare.args, ...(repair ? ['--repair'] : [])], {}, signal);
        if (signal.aborted) throw new Error('Startup cancelled');
        if (result.code !== 0) throw new Error('ML setup failed. Read the ML logs, fix the reported problem, then use Repair ML setup.');
      }
      if (signal.aborted) throw new Error('Startup cancelled');
      this.log(id, `Starting: ${definition.command}`);
      this.update(id, { status: 'starting', detail: definition.healthUrl || definition.ngrok ? 'Waiting for application readiness…' : 'Starting process…', startedAt: Date.now() });
      const completion = this.spawnChild(id, definition.executable, definition.args, {}, signal);
      // Observe exit immediately, including while readiness polling is still running.
      let exited = false;
      let spawnError;
      const observed = completion.then((result) => {
        exited = true;
        if (!signal.aborted) {
          this.log(id, `Process exited (${result.signal || result.code}).`, 'system');
          this.update(id, { status: 'failed', detail: `Process exited (${result.signal || result.code}). Open the logs, then restart.`, pid: null, exitCode: result.code });
        }
        return result;
      }, (error) => {
        exited = true;
        spawnError = error;
        if (!signal.aborted) this.update(id, { status: 'failed', detail: error.message, pid: null });
      });
      const deadline = Date.now() + (definition.startupTimeout || 30_000);
      let ready = false;
      while (!signal.aborted && !exited && Date.now() < deadline) {
        if (definition.ngrok) ready = await this.ngrokReady(definition);
        else if (definition.healthUrl) ready = await this.probe(definition.healthUrl);
        else { await delay(800, undefined, { signal }); ready = !exited; }
        if (ready || exited || signal.aborted) break;
        await delay(700, undefined, { signal });
      }
      if (signal.aborted) throw new Error('Startup cancelled');
      if (spawnError) throw spawnError;
      if (exited) { await observed; return; }
      if (!ready) {
        this.log(id, 'Readiness check timed out. The process is still running; check its logs.', 'system');
        this.update(id, { status: 'degraded', detail: 'Readiness check timed out. Check the logs or restart.' });
      } else {
        this.update(id, { status: definition.healthUrl || definition.ngrok ? 'ready' : 'running',
          detail: definition.healthUrl || definition.ngrok ? 'Responding to readiness checks' : 'Process running · no HTTP health endpoint' });
      }
      // Keep the controller until stop so normal later exits remain observable.
    } catch (error) {
      if (!signal.aborted) {
        this.log(id, error.message, 'system');
        this.update(id, { status: 'failed', detail: error.message, pid: null });
      }
    }
  }

  async ngrokReady(definition) {
    try {
      const base = process.env.DEV_NGROK_API || 'http://127.0.0.1:4040';
      let response = await fetch(`${base}/api/endpoints`, { signal: AbortSignal.timeout(2000) });
      if (response.ok) {
        const data = await response.json();
        return (data.endpoints || []).some((item) => item.url?.replace(/\/$/, '') === definition.expectedUrl?.replace(/\/$/, ''));
      }
      // Older ngrok agents expose tunnels instead of endpoints.
      response = await fetch(`${base}/api/tunnels`, { signal: AbortSignal.timeout(2000) });
      if (!response.ok) return false;
      const data = await response.json();
      return (data.tunnels || []).some((item) => item.public_url?.replace(/\/$/, '') === definition.expectedUrl?.replace(/\/$/, ''));
    } catch { return false; }
  }

  async monitor() {
    if (this.monitoring || this.closing) return;
    this.monitoring = true;
    try {
      await this.refreshExternal();
      await Promise.all([...this.definitions.values()].map(async (definition) => {
        const state = this.states.get(definition.id);
        if (state.busy || !this.children.has(definition.id) || !['ready', 'degraded'].includes(state.status)) return;
        const ready = definition.ngrok ? await this.ngrokReady(definition) : await this.probe(definition.healthUrl);
        if (state.busy || !this.children.has(definition.id)) return;
        this.update(definition.id, { status: ready ? 'ready' : 'degraded', detail: ready ? 'Responding to readiness checks' : 'Process is running, but the readiness check failed.' });
      }));
    } finally { this.monitoring = false; }
  }

  async stop(id) {
    if (!this.definitions.has(id)) throw new Error('Unknown service');
    // Concurrent stops share one shutdown, avoiding PID reuse and double signals.
    if (this.stops?.has(id)) return this.stops.get(id);
    this.stops ||= new Map();
    const operation = this.stopInternal(id).finally(() => this.stops.delete(id));
    this.stops.set(id, operation);
    return operation;
  }

  async stopInternal(id) {
    const operation = this.operations.get(id);
    this.controllers.get(id)?.abort();
    const child = this.children.get(id);
    this.update(id, { status: 'stopping', busy: true, detail: 'Stopping owned processes…' });
    if (child?.pid) {
      const send = (signal) => {
        try { process.kill(process.platform === 'win32' ? child.pid : -child.pid, signal); }
        catch (error) { if (error.code !== 'ESRCH') this.log(id, error.message); }
      };
      send('SIGTERM');
      // Wait for the entire group (npm/Next, Flask reloader, Laravel listener).
      const groupExists = () => {
        try { process.kill(process.platform === 'win32' ? child.pid : -child.pid, 0); return true; }
        catch { return false; }
      };
      const deadline = Date.now() + 5000;
      while (groupExists() && Date.now() < deadline) await delay(100);
      if (groupExists()) send('SIGKILL');
    }
    await operation;
    this.children.delete(id);
    this.update(id, { status: 'stopped', detail: 'Stopped', busy: false, pid: null, startedAt: null });
    this.log(id, 'Stopped.');
  }

  async restart(id, options = {}) {
    await this.stop(id);
    await this.start(id, options);
  }

  async startAll() {
    if (this.batch || this.closing) return;
    this.batch = 'starting';
    this.batchController = new AbortController();
    this.emit('state', this.snapshot());
    try {
      const independent = [...this.definitions.values()].filter((item) => !(item.dependsOn || []).some((id) => this.definitions.has(id)));
      await Promise.all(independent.map((item) => this.start(item.id)));
      if (!this.batchController.signal.aborted) {
        const dependent = [...this.definitions.values()].filter((item) => !independent.includes(item));
        for (const item of dependent) {
          if (this.batchController.signal.aborted) break;
          await this.start(item.id);
        }
      }
    } finally {
      if (this.batch === 'starting') this.batch = null;
      this.emit('state', this.snapshot());
    }
  }

  async stopAll() {
    if (this.stopAllOperation) return this.stopAllOperation;
    this.stopAllOperation = this.stopAllInternal().finally(() => { this.stopAllOperation = null; });
    return this.stopAllOperation;
  }

  async stopAllInternal() {
    this.batchController?.abort();
    this.batch = 'stopping';
    this.emit('state', this.snapshot());
    // Stop scheduled callers before their ML dependency.
    if (this.definitions.has('scheduler')) await this.stop('scheduler');
    await Promise.all([...this.definitions.keys()].filter((id) => id !== 'scheduler').map((id) => this.stop(id)));
    this.batch = null;
    this.emit('state', this.snapshot());
  }
}
