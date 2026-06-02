"""
One-time setup script for NLP models.

Run this before starting the ML service for the first time:
    python setup_nlp.py
"""

import subprocess
import sys


def main():
    print("=== Downloading spaCy en_core_web_sm model ===")
    subprocess.run(
        [sys.executable, "-m", "spacy", "download", "en_core_web_sm"],
        check=True,
    )

    print("\n=== Downloading NLTK punkt tokenizer ===")
    import nltk
    nltk.download('punkt')
    nltk.download('punkt_tab')

    print("\n✅ NLP models downloaded successfully. You can now start the ML service.")


if __name__ == '__main__':
    main()
