# Smart Restaurant Ecosystem

## Development dashboard

Double-click **Start Development.command** in Finder, or run this from the project root:

```sh
node dev.mjs --open
```

Open **http://127.0.0.1:4310** if the browser does not open automatically. Choose **Start all** to launch the frontend, Laravel queue listener, scheduler, Socket.IO server, ML service, and your existing ngrok tunnel. Each service also has Start, Stop, Restart, and Logs controls. The dashboard itself requires Node.js 20.9+ and has no npm dependencies or build step.

Herd, MySQL, and Redis must already be running. The launcher never starts or stops them. It uses Herd's PHP from your PATH, the existing service `.env` files, and your fixed ngrok `APP_URL`. The ngrok CLI must already be installed and authenticated. The tunnel command is exactly:

```sh
ngrok http smart-restaurant-ecosystem.test:80 --host-header=rewrite
```

### First ML start

The launcher creates or reuses `ml-service/.venv`, installs `requirements.txt`, runs `setup_nlp.py`, and verifies the spaCy model and NLTK assets. The first start needs internet access and may take several minutes. Subsequent starts reuse verified dependencies; requirements or setup changes trigger setup again. NLTK data and setup metadata are stored in ignored `.dev-run/`. Use **Repair ML setup** to repeat installation and model setup without deleting your environment. The older `ml-service/venv` directory is left alone.

Your configured ML port is read from `ml-service/.env` (currently 5005). Backend queue and scheduler processes use the backend's own configuration. The scheduler waits for ML readiness when using Start all; its current forecast task runs at 02:00 UTC / 07:00 Pakistan time, only while the scheduler is running. The queue listener reloads PHP changes automatically.

### Logs and stopping

Select **Logs** on a service, or choose it in the log filter. You can pause, clear the displayed output, or copy the latest logs. The dashboard keeps the latest 1,000 lines in memory and masks known local secrets. “Running” means a background process has started; “Ready” means an HTTP readiness check passed. Socket and ML health endpoints are basic liveness checks, not full Redis/database feature tests. MySQL's external indicator checks TCP availability, not authentication or schema correctness.

Keep the launcher terminal open. Closing the browser tab leaves services running. **Stop all** stops only processes started by this launcher. **Stop & close launcher**, or **Ctrl+C** in its terminal, stops those services and closes the dashboard. The launcher shuts down child processes too, including Next.js, Flask's reloader, and Laravel's queue listener. Avoid force-quitting the terminal; use Ctrl+C for orderly shutdown.

If a port is already occupied by a manually started service, the launcher reports it and does not take ownership or kill it. Stop that service in its original terminal and retry. If port 4310 is occupied, open the existing dashboard or choose a different dashboard port:

```sh
DEV_DASHBOARD_PORT=4311 node dev.mjs --open
```

Optional settings: `DEV_PYTHON` selects the Python executable for environment preparation; `DEV_PHP` selects PHP; `DEV_FRONTEND_PORT` selects the Next.js port; `DEV_NGROK_API` selects the ngrok inspection API if you changed its default address (`http://127.0.0.1:4040`). Settings are passed as environment variables, for example `DEV_PYTHON=python3.13 node dev.mjs --open`. To open the dashboard and immediately start services, use `node dev.mjs --open --start`.

The frontend and socket services need their existing `node_modules`; run `npm install` in the respective directory if missing. Laravel needs its existing `vendor` directory and `.env`. The launcher does not run migrations, start Laravel's HTTP server, or modify your environment files.

### Launcher checks

```sh
node --test tools/dev/tests/*.test.mjs
```

