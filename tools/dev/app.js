const token = document.querySelector('meta[name="dev-token"]').content;
const $ = (id) => document.getElementById(id);
let snapshot;
let logs = [];
let filter = 'all';
let paused = false;
let clearBefore = 0;
let connected = false;
let lastBatch = null;
const nodes = new Map();
const pending = new Set();
const labels = { stopped: 'Stopped', preparing: 'Preparing', starting: 'Starting', ready: 'Ready', running: 'Running', degraded: 'Check logs', failed: 'Failed', stopping: 'Stopping' };

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function notice(text, error = false) {
  $('notice').hidden = !text;
  $('notice').textContent = text;
  $('notice').className = `notice${error ? ' error' : ''}`;
}

async function action(path) {
  if (pending.has(path)) return;
  pending.add(path);
  renderState();
  try {
    const response = await fetch(`/api/${path}`, { method: 'POST', headers: { 'X-Dev-Token': token } });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    notice('');
  } catch (error) { notice(error.message, true); }
  finally { pending.delete(path); renderState(); }
}

function button(label, callback, className = '') {
  const node = element('button', className, label);
  node.addEventListener('click', callback);
  return node;
}

function renderPlayback() {
  const live = document.querySelector('.live-label');
  live.classList.toggle('paused', paused);
  live.classList.toggle('offline', !connected);
  live.replaceChildren(element('span', 'dot'), document.createTextNode(!connected ? 'OFFLINE' : paused ? 'PAUSED' : 'LIVE'));
}

function selectLogs(id) {
  filter = id;
  $('log-filter').value = id;
  renderState();
  renderLogs(true);
  if (window.innerWidth < 761) $('logs-title').scrollIntoView({ block: 'start', behavior: 'instant' });
}

async function copy(text, node) {
  const old = node.textContent;
  try {
    await navigator.clipboard.writeText(text);
    node.textContent = 'Copied';
    setTimeout(() => { node.textContent = old; }, 1400);
  } catch { notice('Clipboard access is unavailable. Select the text and copy it manually.', true); }
}

function serviceNode(service) {
  const article = element('article', 'service');
  const runtimes = { frontend: ['N', 'NEXT.JS', 'node'], queue: ['php', 'LARAVEL', 'php'], scheduler: ['cron', 'LARAVEL', 'php'], socket: ['io', 'NODE.JS', 'node'], ml: ['py', 'PYTHON', 'py'], ngrok: ['↗', 'TUNNEL', 'tunnel'] };
  const [glyph, runtime, runtimeId] = runtimes[service.id] || ['>_', 'PROCESS', 'node'];
  article.dataset.runtime = runtimeId;
  article.setAttribute('aria-label', service.name);
  const top = element('div', 'service-top');
  const title = element('div', 'service-title');
  const icon = element('span', 'service-icon', glyph);
  icon.setAttribute('aria-hidden', 'true');
  title.append(icon, element('h3', '', service.name), element('span', 'service-runtime', runtime));
  const badge = element('span', 'badge');
  top.append(title, badge);
  const detail = element('p', 'detail');
  const bottom = element('div', 'service-bottom');
  const controls = element('div', 'service-actions');
  const start = button('Start', () => action(`services/${service.id}/start`));
  const stop = button('Stop', () => action(`services/${service.id}/stop`));
  const restart = button('Restart', () => action(`services/${service.id}/restart`));
  const viewLogs = button('Logs ↗', () => selectLogs(service.id), 'logs-button');
  for (const node of [start, stop, restart, viewLogs]) node.setAttribute('aria-label', `${node.textContent.replace(' ↗', '')} ${service.name}`);
  controls.append(start, stop, restart, viewLogs);
  const meta = element('span', 'service-meta');
  bottom.append(controls, meta);
  const command = element('code', 'command', service.command);
  command.title = `${service.directory}/ · ${service.command}`;
  article.append(top, command, detail, bottom);
  if (service.url) {
    const row = element('div', 'service-link');
    const link = element('a', '', service.url.replace(/^https?:\/\//, ''));
    link.href = service.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    row.append(link);
    if (service.id === 'ngrok') {
      const copyLink = button('Copy URL', () => copy(service.url, copyLink));
      row.append(copyLink);
    }
    article.append(row);
  }
  const option = element('option', '', service.name);
  option.value = service.id;
  $('log-filter').append(option);
  $('services').append(article);
  const result = { article, badge, detail, start, stop, restart, meta };
  nodes.set(service.id, result);
  return result;
}

function renderState() {
  if (!snapshot) return;
  const busyGlobal = Boolean(snapshot.batch) || snapshot.closing;
  const ready = snapshot.services.filter((item) => ['ready', 'running'].includes(item.status)).length;
  $('ready-count').textContent = `${ready} / ${snapshot.services.length} running`;
  $('metric-running').textContent = String(ready).padStart(2, '0');
  $('metric-starting').textContent = String(snapshot.services.filter((item) => ['preparing', 'starting', 'stopping'].includes(item.status)).length).padStart(2, '0');
  $('metric-stopped').textContent = String(snapshot.services.filter((item) => item.status === 'stopped').length).padStart(2, '0');
  $('metric-attention').textContent = String(snapshot.services.filter((item) => ['failed', 'degraded'].includes(item.status)).length).padStart(2, '0');
  $('start-all').disabled = !connected || busyGlobal || pending.has('start-all');
  $('start-all').setAttribute('aria-busy', String(snapshot.batch === 'starting'));
  $('stop-all').disabled = !connected || snapshot.closing || snapshot.batch === 'stopping' || pending.has('stop-all');
  $('stop-all').setAttribute('aria-busy', String(snapshot.batch === 'stopping'));
  $('repair-ml').disabled = !connected || busyGlobal || snapshot.services.find((item) => item.id === 'ml')?.busy || pending.has('services/ml/repair');
  $('shutdown').disabled = !connected || snapshot.closing;
  $('external-status').replaceChildren(...snapshot.external.map((item) => {
    const node = element('span', `external-item ${item.status}`);
    node.append(element('span', 'dot'), document.createTextNode(`${item.name} · ${item.status === 'available' ? 'Available' : item.status === 'checking' ? 'Checking' : 'Unavailable'}`));
    return node;
  }));
  for (const service of snapshot.services) {
    const node = nodes.get(service.id) || serviceNode(service);
    node.article.className = `service ${service.status}${filter === service.id ? ' selected' : ''}`;
    node.badge.className = `badge ${service.status}`;
    node.badge.replaceChildren(element('span', 'dot'), document.createTextNode(labels[service.status] || service.status));
    node.detail.textContent = service.detail;
    const hasProcess = ['preparing', 'starting', 'ready', 'running', 'degraded', 'stopping'].includes(service.status);
    const requestPending = [...pending].some((path) => path.startsWith(`services/${service.id}/`));
    node.start.disabled = !connected || busyGlobal || service.busy || hasProcess || requestPending;
    node.stop.disabled = !connected || snapshot.closing || snapshot.batch === 'stopping' || !hasProcess || requestPending;
    node.restart.disabled = !connected || busyGlobal || service.busy || requestPending;
    node.meta.textContent = [service.port ? `:${service.port}` : '', service.pid ? `PID ${service.pid}` : '', service.startedAt && hasProcess ? uptime(service.startedAt) : ''].filter(Boolean).join(' · ');
  }
  if (snapshot.closing) notice(connected ? 'Stopping services and closing the launcher…' : 'Launcher closed. To use it again, double-click Start Development.command.');
  else if (snapshot.batch === 'starting') notice('Starting services… ML setup may take a few minutes. The scheduler will start after ML is ready.');
  else if (snapshot.batch === 'stopping') notice('Stopping services owned by this launcher…');
  else if (lastBatch) notice('');
  lastBatch = snapshot.batch;
  $('log-caption').textContent = filter === 'all' ? 'All services' : snapshot.services.find((item) => item.id === filter)?.name || filter;
}

function uptime(start) {
  const seconds = Math.max(0, Math.floor((Date.now() - start) / 1000));
  return seconds < 60 ? `${seconds}s` : seconds < 3600 ? `${Math.floor(seconds / 60)}m ${seconds % 60}s` : `${Math.floor(seconds / 3600)}h ${Math.floor(seconds % 3600 / 60)}m`;
}

function visibleLogs() { return logs.filter((item) => item.id > clearBefore && (filter === 'all' || item.service === filter)); }

function renderLogs(force = false) {
  if (paused && !force) return;
  const target = $('logs');
  const atBottom = target.scrollHeight - target.clientHeight - target.scrollTop < 70;
  const entries = visibleLogs();
  const fragment = document.createDocumentFragment();
  if (!entries.length) {
    const empty = element('div', 'log-empty');
    empty.append(element('strong', '', 'Waiting for output'), element('p', '', 'Start a process to follow its output here. Select a service to isolate its stream.'));
    fragment.append(empty);
  }
  for (const entry of entries) {
    const line = element('div', 'log-line');
    line.append(element('span', 'log-time', new Date(entry.time).toLocaleTimeString([], { hour12: false })),
      element('span', 'log-service', entry.service), element('span', `log-message${entry.stream === 'stderr' ? ' error' : ''}`, entry.text));
    fragment.append(line);
  }
  const oldPosition = target.scrollTop;
  target.replaceChildren(fragment);
  target.scrollTop = atBottom || force ? target.scrollHeight : oldPosition;
  $('log-count').textContent = `${entries.length} lines${paused ? ' · paused' : ''}`;
}

$('start-all').addEventListener('click', () => action('start-all'));
$('stop-all').addEventListener('click', () => action('stop-all'));
$('shutdown').addEventListener('click', () => action('shutdown'));
$('repair-ml').addEventListener('click', () => { selectLogs('ml'); void action('services/ml/repair'); });
$('log-filter').addEventListener('change', (event) => selectLogs(event.target.value));
$('clear-logs').addEventListener('click', () => { clearBefore = logs.at(-1)?.id || 0; renderLogs(true); });
$('copy-logs').addEventListener('click', () => copy(visibleLogs().map((item) => `[${item.time}] [${item.service}] ${item.text}`).join('\n'), $('copy-logs')));
$('pause-logs').addEventListener('click', () => {
  paused = !paused;
  $('pause-logs').textContent = paused ? 'Resume' : 'Pause';
  $('pause-logs').setAttribute('aria-pressed', String(paused));
  renderPlayback();
  $('log-count').textContent = `${visibleLogs().length} lines${paused ? ' · paused' : ''}`;
  if (!paused) renderLogs(true);
});

const events = new EventSource(`/api/events?token=${encodeURIComponent(token)}`);
events.onopen = () => { connected = true; $('connection').textContent = '● Connected locally'; $('connection').className = 'connection online'; renderPlayback(); renderState(); };
events.onerror = () => {
  connected = false;
  renderPlayback();
  $('connection').textContent = snapshot?.closing ? 'Launcher closed' : 'Reconnecting…';
  $('connection').className = 'connection offline';
  if (snapshot?.closing) { events.close(); notice('Launcher closed. To use it again, double-click Start Development.command.'); }
  renderState();
};
events.addEventListener('snapshot', (event) => { snapshot = JSON.parse(event.data); logs = snapshot.logs; renderState(); renderLogs(true); });
events.addEventListener('state', (event) => { snapshot = JSON.parse(event.data); renderState(); });
let logFrame;
events.addEventListener('log', (event) => {
  logs.push(JSON.parse(event.data));
  if (logs.length > 1000) logs.shift();
  if (!logFrame) logFrame = requestAnimationFrame(() => { logFrame = null; renderLogs(); });
});
renderLogs();
setInterval(() => { renderState(); }, 1000);
