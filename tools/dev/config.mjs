import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Read local dotenv files without evaluating shell expressions or changing process.env.
export function readEnv(path) {
  try {
    const result = {};
    for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
      const match = line.match(/^\s*(?:export\s+)?([\w]+)\s*=\s*(.*)?$/);
      if (!match) continue;
      let value = (match[2] || '').trim();
      if (value.startsWith('"') || value.startsWith("'")) {
        const quote = value[0];
        const end = value.lastIndexOf(quote);
        value = end > 0 ? value.slice(1, end) : value.slice(1);
        if (quote === '"') value = value.replace(/\\n/g, '\n').replace(/\\r/g, '\r');
      } else {
        value = value.replace(/\s+#.*$/, '').trim();
      }
      result[match[1]] = value;
    }
    return result;
  } catch (error) {
    if (error.code === 'ENOENT') return {};
    throw error;
  }
}

export function httpUrl(value, fallback) {
  try {
    const url = new URL(value || fallback);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Invalid protocol');
    url.username = '';
    url.password = '';
    return url.origin;
  } catch {
    return fallback;
  }
}

export function createRedactor(root) {
  const secrets = [process.env.NGROK_AUTHTOKEN];
  for (const path of ['backend/.env', 'frontend/.env.local', 'socket-server/.env', 'ml-service/.env']) {
    for (const [key, value] of Object.entries(readEnv(resolve(root, path)))) {
      if (/PASSWORD|SECRET|TOKEN|PRIVATE|APP_KEY|ACCESS_KEY/i.test(key) && value.length >= 4) {
        secrets.push(value);
      }
    }
  }
  const values = [...new Set(secrets.filter(Boolean))].sort((a, b) => b.length - a.length);
  return (input) => {
    let text = String(input).replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, '');
    for (const secret of values) text = text.split(secret).join('[redacted]');
    return text
      .replace(/([a-z][a-z\d+.-]*:\/\/)[^\s/@]+:[^\s/@]+@/gi, '$1[redacted]@')
      .replace(/(Debugger PIN:\s*)[\d-]+/gi, '$1[redacted]');
  };
}

export function serviceDefinitions(root) {
  const backend = readEnv(resolve(root, 'backend/.env'));
  const socket = readEnv(resolve(root, 'socket-server/.env'));
  const ml = readEnv(resolve(root, 'ml-service/.env'));
  const frontend = readEnv(resolve(root, 'frontend/.env.local'));
  const php = process.env.DEV_PHP || 'php';
  const python = process.env.DEV_PYTHON || 'python3';
  const localBackend = httpUrl(frontend.BACKEND_URL || socket.LARAVEL_API_URL, 'http://smart-restaurant-ecosystem.test');
  const frontendPort = Number(process.env.DEV_FRONTEND_PORT || 3000);
  const socketPort = Number(socket.PORT || 3001);
  const mlPort = Number(ml.PORT || 5000);
  for (const port of [frontendPort, socketPort, mlPort]) {
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Service ports must be between 1 and 65535.');
  }
  const publicUrl = httpUrl(backend.APP_URL, localBackend);
  return {
    external: [
      { id: 'backend', name: 'Herd backend', url: localBackend, healthUrl: `${localBackend}/up`, kind: 'http' },
      { id: 'mysql', name: 'MySQL', host: backend.DB_HOST || '127.0.0.1', port: Number(backend.DB_PORT || 3306), kind: 'tcp' },
    ],
    services: [
      { id: 'frontend', name: 'Frontend', subtitle: 'Next.js development server', directory: 'frontend',
        command: 'npm run dev', executable: 'npm', args: ['run', 'dev'],
        env: { PORT: String(frontendPort) }, port: frontendPort, url: `http://localhost:${frontendPort}`,
        healthUrl: `http://127.0.0.1:${frontendPort}`, requires: ['node_modules'], startupTimeout: 180_000 },
      { id: 'queue', name: 'Backend queue', subtitle: `${backend.QUEUE_CONNECTION || 'database'} connection · reloads PHP changes`, directory: 'backend',
        command: 'php artisan queue:listen --tries=1', executable: php,
        args: ['artisan', 'queue:listen', '--tries=1', '--no-interaction'], requires: ['vendor/autoload.php', '.env'], dependsOn: ['backend'] },
      { id: 'scheduler', name: 'Scheduler', subtitle: 'Runs scheduled Laravel tasks while open', directory: 'backend',
        command: 'php artisan schedule:work', executable: php,
        args: ['artisan', 'schedule:work', '--no-interaction'], requires: ['vendor/autoload.php', '.env'], dependsOn: ['backend', 'ml'] },
      { id: 'socket', name: 'Socket server', subtitle: 'Socket.IO · uses your running Redis', directory: 'socket-server',
        command: 'node src/server.js', executable: process.execPath, args: ['src/server.js'],
        env: { PORT: String(socketPort) },
        port: socketPort, url: `http://localhost:${socketPort}/health`, healthUrl: `http://127.0.0.1:${socketPort}/health`,
        requires: ['node_modules', '.env'], startupTimeout: 30_000 },
      { id: 'ml', name: 'ML service', subtitle: 'Python · spaCy, sentiment & forecasting', directory: 'ml-service',
        command: '.venv/bin/python app.py', executable: resolve(root, 'ml-service/.venv/bin/python'), args: ['-u', 'app.py'],
        port: mlPort, url: `http://localhost:${mlPort}/health`, healthUrl: `http://127.0.0.1:${mlPort}/health`,
        env: { PORT: String(mlPort), PYTHONUNBUFFERED: '1', NLTK_DATA: resolve(root, '.dev-run/nltk_data') },
        prepare: { executable: python, args: ['-u', resolve(root, 'tools/dev/ml_setup.py')] },
        requires: ['requirements.txt', 'setup_nlp.py', '.env'], startupTimeout: 90_000 },
      { id: 'ngrok', name: 'ngrok tunnel', subtitle: 'Your fixed public backend URL', directory: '.',
        command: 'ngrok http smart-restaurant-ecosystem.test:80 --host-header=rewrite', executable: 'ngrok',
        args: ['http', 'smart-restaurant-ecosystem.test:80', '--host-header=rewrite'],
        url: publicUrl, expectedUrl: publicUrl, ngrok: true, dependsOn: ['backend'], startupTimeout: 45_000 },
    ],
  };
}
