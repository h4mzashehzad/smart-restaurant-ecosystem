import { createServer } from 'node:http';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { spawn } from 'node:child_process';
import { ServiceManager } from './manager.mjs';
import { serviceDefinitions, createRedactor } from './config.mjs';

const directory = dirname(fileURLToPath(import.meta.url));

export async function startDashboard(options = {}) {
  const root = options.root || resolve(directory, '../..');
  const port = options.port ?? Number(process.env.DEV_DASHBOARD_PORT || 4310);
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Invalid dashboard port.');
  const manager = options.manager || new ServiceManager({ root, ...serviceDefinitions(root), redact: createRedactor(root) });
  const token = randomBytes(32).toString('hex');
  const clients = new Set();
  let shutdown;
  let actualPort;
  const authorized = (request, url) => {
    const supplied = request.headers['x-dev-token'] || (url.pathname === '/api/events' ? url.searchParams.get('token') : '') || '';
    const candidate = Buffer.from(String(supplied));
    return candidate.length === token.length && timingSafeEqual(candidate, Buffer.from(token));
  };
  const broadcast = (type, data) => {
    const message = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const client of clients) {
      // A suspended tab must never stall the service manager or grow memory unbounded.
      if (client.writableLength > 256_000) { client.destroy(); clients.delete(client); }
      else client.write(message);
    }
  };
  manager.on('state', (data) => broadcast('state', data));
  manager.on('log', (data) => broadcast('log', data));
  const server = createServer(async (request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
    const send = (status, payload) => {
      response.writeHead(status, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify(payload));
    };
    try {
      const host = request.headers.host;
      if (![ `127.0.0.1:${actualPort}`, `localhost:${actualPort}` ].includes(host)) return send(403, { error: 'Local dashboard access only.' });
      const origin = request.headers.origin;
      if (origin && ![`http://127.0.0.1:${actualPort}`, `http://localhost:${actualPort}`].includes(origin)) return send(403, { error: 'Cross-origin requests are not allowed.' });
      const url = new URL(request.url, `http://${host}`);
      if (url.pathname === '/health' && request.method === 'GET') return send(200, { service: 'restaurant-dev-dashboard', status: 'ok' });
      if (url.pathname.startsWith('/api/')) {
        if (!authorized(request, url)) return send(403, { error: 'Refresh the dashboard to reconnect.' });
        if (url.pathname === '/api/state' && request.method === 'GET') return send(200, { ...manager.snapshot(), logs: manager.logs });
        if (url.pathname === '/api/events' && request.method === 'GET') {
          response.writeHead(200, { 'Content-Type': 'text/event-stream', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
          response.write(`event: snapshot\ndata: ${JSON.stringify({ ...manager.snapshot(), logs: manager.logs })}\n\n`);
          clients.add(response);
          request.on('close', () => clients.delete(response));
          return;
        }
        if (request.method !== 'POST') return send(405, { error: 'Method not allowed.' });
        if (manager.closing) return send(409, { error: 'Dashboard is shutting down.' });
        // Actions are fixed; no request can supply executable names, paths, or shell text.
        const match = url.pathname.match(/^\/api\/services\/([a-z]+)\/(start|stop|restart|repair)$/);
        if (match) {
          const [, id, action] = match;
          if (!manager.definitions.has(id) || (action === 'repair' && id !== 'ml')) return send(404, { error: 'Unknown action.' });
          if (manager.batch === 'stopping') return send(409, { error: 'Wait for Stop all to finish.' });
          if (manager.batch === 'starting' && action !== 'stop') return send(409, { error: 'Start all is still in progress.' });
          const task = action === 'repair' ? manager.restart(id, { repair: true }) : manager[action](id);
          task.catch((error) => manager.log(id, error.message));
          return send(202, { accepted: true });
        }
        if (url.pathname === '/api/start-all') {
          if (manager.batch) return send(409, { error: 'A group action is already in progress.' });
          manager.startAll().catch((error) => manager.log('launcher', error.message));
          return send(202, { accepted: true });
        }
        if (url.pathname === '/api/stop-all') {
          manager.stopAll().catch((error) => manager.log('launcher', error.message));
          return send(202, { accepted: true });
        }
        if (url.pathname === '/api/shutdown') {
          send(202, { accepted: true });
          void close();
          return;
        }
        return send(404, { error: 'Unknown action.' });
      }
      if (request.method !== 'GET') return send(405, { error: 'Method not allowed.' });
      const assets = { '/': ['index.html', 'text/html'], '/app.js': ['app.js', 'text/javascript'],
        '/style.css': ['style.css', 'text/css'], '/tokens.css': ['../../tokens.css', 'text/css'] };
      const asset = assets[url.pathname];
      if (!asset) return send(404, { error: 'Not found.' });
      let content = await readFile(resolve(directory, asset[0]), 'utf8');
      if (url.pathname === '/') content = content.replace('__DEV_TOKEN__', token);
      response.writeHead(200, { 'Content-Type': `${asset[1]}; charset=utf-8` });
      response.end(content);
    } catch (error) {
      if (!response.headersSent) send(500, { error: manager.redact(error.message) });
      else response.end();
    }
  });
  server.requestTimeout = 10_000;
  server.headersTimeout = 10_000;
  await new Promise((done, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', done);
  }).catch((error) => {
    if (error.code === 'EADDRINUSE') throw new Error(`Port ${port} is already in use. Open the existing dashboard or choose DEV_DASHBOARD_PORT=4311.`);
    throw error;
  });
  actualPort = server.address().port;
  const url = `http://127.0.0.1:${actualPort}`;
  const interval = setInterval(() => { void manager.monitor().catch((error) => manager.log('launcher', error.message)); }, 5000);
  const heartbeat = setInterval(() => { for (const client of clients) client.write(': heartbeat\n\n'); }, 15_000);
  void manager.refreshExternal().catch((error) => manager.log('launcher', error.message));

  function close() {
    if (shutdown) return shutdown;
    shutdown = (async () => {
      manager.closing = true;
      clearInterval(interval);
      clearInterval(heartbeat);
      await manager.stopAll();
      for (const client of clients) client.end();
      clients.clear();
      server.closeIdleConnections();
      await new Promise((done) => server.close(done));
      process.off('SIGINT', onSignal);
      process.off('SIGTERM', onSignal);
      process.off('SIGHUP', onSignal);
      if (!options.quiet) console.log('Development services stopped. Dashboard closed.');
    })();
    return shutdown;
  }
  function onSignal() { void close(); }
  process.on('SIGINT', onSignal);
  process.on('SIGTERM', onSignal);
  process.on('SIGHUP', onSignal);
  if (!options.quiet) {
    console.log(`\nRestaurant development dashboard\n${url}\n\nOpen the dashboard and choose Start all.\nKeep this terminal open. Ctrl+C stops services owned by this launcher.\n`);
  }
  if (process.argv.includes('--open') && !options.quiet) {
    const opener = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'explorer.exe' : 'xdg-open';
    const child = spawn(opener, [url], { stdio: 'ignore' });
    child.on('error', () => console.log(`Open ${url} in your browser.`));
  }
  if (process.argv.includes('--start') && !options.quiet) void manager.startAll();
  return { server, manager, url, close };
}
