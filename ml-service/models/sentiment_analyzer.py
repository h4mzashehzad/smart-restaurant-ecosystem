"""
Sentiment Analyzer — TextBlob + spaCy pipeline for restaurant feedback.

Provides overall sentiment scoring, aspect-based extraction across five
dimensions (food quality, service, ambiance, price, cleanliness), and
automated flagging for urgent negative reviews.
"""

import re
from datetime import datetime
from typing import Dict, List, Tuple, Optional

import spacy
from textblob import TextBlob


class SentimentAnalyzer:
    def __init__(self):
        self.nlp = spacy.load("en_core_web_sm")

        # Aspect-based sentiment keywords
        self.aspect_keywords: Dict[str, List[str]] = {
            'food_quality': [
                'food', 'taste', 'flavor', 'flavour', 'dish', 'meal',
                'delicious', 'bland', 'spicy', 'overcooked', 'undercooked',
                'fresh', 'stale', 'portion', 'biryani', 'karahi', 'tikka',
                'naan', 'rice', 'chicken', 'mutton', 'beef',
            ],
            'service': [
                'service', 'waiter', 'staff', 'server', 'attention',
                'friendly', 'rude', 'slow', 'fast', 'quick', 'helpful',
                'polite', 'impolite', 'attentive', 'ignored',
            ],
            'ambiance': [
                'atmosphere', 'ambiance', 'ambience', 'decor', 'music',
                'lighting', 'seating', 'noisy', 'quiet', 'cozy', 'crowded',
                'vibe', 'comfortable', 'uncomfortable',
            ],
            'price': [
                'price', 'expensive', 'cheap', 'value', 'worth', 'cost',
                'overpriced', 'affordable', 'reasonable', 'pricey',
            ],
            'cleanliness': [
                'clean', 'dirty', 'hygiene', 'sanitary', 'tidy',
                'messy', 'filthy', 'spotless', 'gross', 'hair',
                'insect', 'cockroach', 'unhygienic',
            ],
        }

        # Intensifiers and negations (reserved for future enhancement)
        self.intensifiers = ['very', 'really', 'extremely', 'absolutely', 'incredibly']
        self.negations = ['not', 'never', 'no', 'hardly', 'barely']

    # ── Text preprocessing ────────────────────────────────────────────────

    def preprocess_text(self, text: str) -> str:
        """Clean and normalize text."""
        text = text.lower()
        text = re.sub(r'[^a-z0-9\s.,!?\'-]', '', text)
        text = re.sub(r'\s+', ' ', text).strip()
        return text

    # ── Overall sentiment ─────────────────────────────────────────────────

    def analyze_overall_sentiment(self, text: str) -> Dict:
        """Analyze overall sentiment using TextBlob."""
        blob = TextBlob(text)
        polarity = blob.sentiment.polarity        # -1 … +1
        subjectivity = blob.sentiment.subjectivity  # 0 … 1

        if polarity > 0.1:
            label = 'positive'
        elif polarity < -0.1:
            label = 'negative'
        else:
            label = 'neutral'

        # Confidence based on subjectivity (more subjective = more confident)
        confidence = min(max(subjectivity, 0.5), 0.95)

        return {
            'score': round(polarity, 4),
            'label': label,
            'confidence': round(confidence, 4),
        }

    # ── Aspect-based extraction ───────────────────────────────────────────

    def extract_aspects(self, text: str) -> Dict[str, Dict]:
        """Extract aspect-based sentiments using spaCy + TextBlob."""
        doc = self.nlp(text)
        aspects: Dict[str, Dict] = {}

        for aspect, keywords in self.aspect_keywords.items():
            aspect_sentences: List[str] = []

            for sent in doc.sents:
                if any(kw in sent.text.lower() for kw in keywords):
                    aspect_sentences.append(sent.text)

            if aspect_sentences:
                combined_text = ' '.join(aspect_sentences)
                blob = TextBlob(combined_text)
                found_keywords = [kw for kw in keywords if kw in text.lower()]

                aspects[aspect] = {
                    'score': round(blob.sentiment.polarity, 4),
                    'label': (
                        'positive' if blob.sentiment.polarity > 0.1
                        else 'negative' if blob.sentiment.polarity < -0.1
                        else 'neutral'
                    ),
                    'keywords': found_keywords[:5],
                }

        return aspects

    # ── Flagging logic ────────────────────────────────────────────────────

    def should_flag(
        self,
        overall_score: float,
        rating: int,
        aspects: Dict,
    ) -> Tuple[bool, Optional[str]]:
        """Determine if feedback should be flagged for immediate attention."""
        flag = False
        reason = None

        # Flag 1: Very negative sentiment with low rating
        if overall_score < -0.5 and rating <= 2:
            flag = True
            reason = "Highly negative feedback with low rating"

        # Flag 2: Negative service sentiment
        if 'service' in aspects and aspects['service']['score'] < -0.4:
            flag = True
            reason = "Negative service experience reported"

        # Flag 3: Cleanliness concerns
        if 'cleanliness' in aspects and aspects['cleanliness']['score'] < -0.3:
            flag = True
            reason = "Cleanliness concerns mentioned"

        # Flag 4: Rating-sentiment mismatch (sarcasm detection)
        if rating >= 4 and overall_score < -0.3:
            flag = True
            reason = "Potential sarcasm detected (high rating, negative text)"

        # Flag 5: Extremely negative text regardless of rating
        if overall_score < -0.7:
            flag = True
            reason = reason or "Extremely negative sentiment detected"

        return flag, reason

    # ── Full pipeline ─────────────────────────────────────────────────────

    def analyze_feedback(
        self,
        feedback_id: int,
        text: str,
        rating: int,
    ) -> Dict:
        """Complete sentiment analysis pipeline for a single text."""
        cleaned_text = self.preprocess_text(text)

        if not cleaned_text:
            return {
                'feedback_id': feedback_id,
                'sentiment_score': 0.0,
                'sentiment_label': 'neutral',
                'sentiment_confidence': 0.5,
                'aspects': {},
                'should_flag': False,
                'flagged_reason': None,
                'processed_at': datetime.now().isoformat(),
            }

        # Overall sentiment
        overall = self.analyze_overall_sentiment(cleaned_text)

        # Aspect-based sentiment
        aspects = self.extract_aspects(cleaned_text)

        # Flagging logic
        flag, flag_reason = self.should_flag(overall['score'], rating, aspects)

        return {
            'feedback_id': feedback_id,
            'sentiment_score': overall['score'],
            'sentiment_label': overall['label'],
            'sentiment_confidence': overall['confidence'],
            'aspects': aspects,
            'should_flag': flag,
            'flagged_reason': flag_reason,
            'processed_at': datetime.now().isoformat(),
        }
