"""
One-time setup script for ML / NLP model assets.

Run this before starting the ML service for the first time:
    python setup_nlp.py
"""

import subprocess
import sys


def main():
    print("=== Checking Python ML packages ===")
    required = [
        ("numpy", "numpy"),
        ("pandas", "pandas"),
        ("sklearn", "scikit-learn"),
        ("spacy", "spacy"),
        ("nltk", "nltk"),
        ("textblob", "textblob"),
    ]
    missing = []
    for import_name, package_name in required:
        try:
            __import__(import_name)
            print(f"  ✓ {package_name}")
        except ImportError:
            print(f"  ✗ {package_name} missing")
            missing.append(package_name)

    if missing:
        print("\nMissing packages. Please run:")
        print("  pip install -r requirements.txt")
        sys.exit(1)

    print("\n=== Checking spaCy en_core_web_sm model ===")
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
        nltk.download("punkt", quiet=True)
        nltk.download("punkt_tab", quiet=True)
        print("NLTK models are ready.")
    except ImportError:
        print("NLTK is not installed. Please run 'pip install -r requirements.txt' first.")
        sys.exit(1)

    print("\n=== Verifying demand forecaster can import sklearn ===")
    try:
        from sklearn.ensemble import RandomForestRegressor  # noqa: F401
        print("Demand forecasting (RandomForestRegressor) is ready.")
    except ImportError:
        print("scikit-learn is not installed correctly.")
        sys.exit(1)

    print("\n✅ All ML and NLP dependencies are set up successfully.")
    print("You can start the ML service with: python app.py")


if __name__ == "__main__":
    main()
