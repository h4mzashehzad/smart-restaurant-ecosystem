"""
One-time setup script for NLP models.

Run this before starting the ML service for the first time:
    python setup_nlp.py
"""

import subprocess
import sys
import os

def main():
    print("=== Checking spaCy en_core_web_sm model ===")
    try:
        import spacy
        if not spacy.util.is_package("en_core_web_sm"):
            print("Downloading spaCy model...")
            subprocess.run(
                [sys.executable, "-m", "spacy", "download", "en_core_web_sm"],
                check=True,
            )
        else:
            print("spaCy model 'en_core_web_sm' is already installed.")
    except ImportError:
        print("spaCy is not installed. Please run 'pip install -r requirements.txt' first.")
        sys.exit(1)

    print("\n=== Checking NLTK punkt tokenizer ===")
    try:
        import nltk
        nltk.download('punkt', quiet=True)
        nltk.download('punkt_tab', quiet=True)
        print("NLTK models are ready.")
    except ImportError:
        print("NLTK is not installed. Please run 'pip install -r requirements.txt' first.")
        sys.exit(1)

    print("\n✅ All ML and NLP dependencies are set up successfully.")
    print("You can start the ML service with: python app.py")

if __name__ == '__main__':
    main()
