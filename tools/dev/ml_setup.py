"""Prepare the project's managed ML environment; reuse healthy installations."""

import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[2]
SERVICE = ROOT / "ml-service"
VENV = SERVICE / ".venv"
STATE = ROOT / ".dev-run"
PYTHON = VENV / "bin" / "python"
CHECK = """
import flask, flask_cors, dotenv, mysql.connector, pandas, numpy, sklearn, scipy, textblob, nltk, spacy
assert spacy.util.is_package('en_core_web_sm'), 'spaCy model is missing'
spacy.load('en_core_web_sm')
nltk.data.find('tokenizers/punkt')
nltk.data.find('tokenizers/punkt_tab')
"""


def run(args, **kwargs):
    subprocess.run([str(arg) for arg in args], cwd=SERVICE, check=True, **kwargs)


def main():
    STATE.mkdir(exist_ok=True)
    nlp_data = STATE / "nltk_data"
    nlp_data.mkdir(exist_ok=True)
    os.environ["NLTK_DATA"] = str(nlp_data)
    fingerprint = hashlib.sha256(
        (SERVICE / "requirements.txt").read_bytes()
        + (SERVICE / "setup_nlp.py").read_bytes()
        + Path(__file__).read_bytes()
        + sys.version.encode()
    ).hexdigest()
    stamp = STATE / "ml-setup.json"
    try:
        previous = json.loads(stamp.read_text())
    except (OSError, ValueError):
        previous = {}

    if not PYTHON.exists():
        print("Creating ml-service/.venv…", flush=True)
        run([sys.executable, "-m", "venv", VENV])

    repair = "--repair" in sys.argv
    healthy = False
    if not repair and previous.get("fingerprint") == fingerprint:
        print("Verifying installed packages and NLP assets…", flush=True)
        healthy = subprocess.run(
            [str(PYTHON), "-c", CHECK], cwd=SERVICE, capture_output=True
        ).returncode == 0

    if not healthy:
        print("Installing requirements (first use, changed requirements, or repair)…", flush=True)
        run([PYTHON, "-m", "pip", "install", "-r", "requirements.txt"])
        # Python.org macOS installations may lack the system CA link. spaCy's
        # requests dependency already supplies certifi; use it without disabling TLS.
        if not os.environ.get("SSL_CERT_FILE"):
            certificate = subprocess.check_output(
                [str(PYTHON), "-c", "import certifi; print(certifi.where())"],
                cwd=SERVICE, text=True,
            ).strip()
            if Path(certificate).is_file():
                os.environ["SSL_CERT_FILE"] = certificate
        print("Running setup_nlp.py (model downloads may take a few minutes)…", flush=True)
        run([PYTHON, "-u", "setup_nlp.py"])
        print("Verifying all packages, spaCy model, and NLTK tokenizers…", flush=True)
        run([PYTHON, "-c", CHECK])
        stamp.write_text(json.dumps({"fingerprint": fingerprint}, indent=2) + "\n")

    print("ML environment is ready. Starting app.py…", flush=True)


if __name__ == "__main__":
    try:
        main()
    except (OSError, subprocess.CalledProcessError) as error:
        print(f"ML setup failed: {error}", file=sys.stderr, flush=True)
        sys.exit(1)
