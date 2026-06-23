from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
from datetime import datetime

from models.sentiment_analyzer import SentimentAnalyzer

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Restrict CORS to the backend service only — the ML service is internal and
# should never be called from a browser. ALLOWED_ORIGIN defaults to localhost
# for local development; set it to the backend's Docker service name in production
# (e.g. http://backend or http://laravel).
CORS(app, origins=[os.getenv('ALLOWED_ORIGIN', 'http://localhost:8000')])

# Initialize the sentiment analyzer (loads spaCy model once)
analyzer = SentimentAnalyzer()


# Database connection
def get_db_connection():
    import mysql.connector
    return mysql.connector.connect(
        host=os.getenv('DB_HOST'),
        port=int(os.getenv('DB_PORT', 3306)),
        database=os.getenv('DB_NAME'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD')
    )


# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.now().isoformat(),
        'service': 'ML Service'
    })


# Recommendation endpoint (placeholder)
@app.route('/api/ml/recommendations/generate', methods=['POST'])
def generate_recommendations():
    data = request.get_json()

    user_id = data.get('user_id')
    context = data.get('context', {})
    max_recommendations = data.get('max_recommendations', 5)

    # TODO: Implement recommendation algorithm
    # For now, return mock data

    recommendations = [
        {
            'menu_item_id': 87,
            'score': 0.92,
            'reason': 'Popular choice on Friday evenings',
            'confidence': 0.87
        },
        {
            'menu_item_id': 112,
            'score': 0.88,
            'reason': 'Frequently ordered together',
            'confidence': 0.82
        }
    ]

    return jsonify({
        'success': True,
        'recommendations': recommendations[:max_recommendations],
        'model_version': 'v1.0.0',
        'generated_at': datetime.now().isoformat()
    })


# ── Sentiment Analysis Endpoints ──────────────────────────────────────────────


@app.route('/api/ml/sentiment/analyze', methods=['POST'])
def analyze_sentiment():
    """Analyze sentiment of a single text review."""
    data = request.get_json()

    feedback_id = data.get('feedback_id')
    text = data.get('text', '')
    rating = data.get('rating', 3)

    if not text or not text.strip():
        return jsonify({
            'success': True,
            'sentiment': {
                'feedback_id': feedback_id,
                'sentiment_score': 0.0,
                'sentiment_label': 'neutral',
                'sentiment_confidence': 0.5,
                'aspects': {},
                'should_flag': False,
                'flagged_reason': None,
                'processed_at': datetime.now().isoformat(),
            }
        })

    try:
        result = analyzer.analyze_feedback(
            feedback_id=feedback_id,
            text=text,
            rating=rating
        )

        return jsonify({
            'success': True,
            'sentiment': result
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/ml/sentiment/analyze-batch', methods=['POST'])
def analyze_sentiment_batch():
    """
    Analyze multiple review texts independently (one per menu item).

    Each item's text is analyzed separately so that a single bad review
    out of many still triggers a flag.

    Request body:
    {
        "feedback_id": 123,
        "overall_text": "Great experience overall",
        "overall_rating": 4,
        "items": [
            {"id": 1, "text": "Amazing biryani!", "rating": 5},
            {"id": 2, "text": "Terrible naan, tasted stale", "rating": 1}
        ]
    }
    """
    data = request.get_json()
    items = data.get('items', [])
    overall_text = data.get('overall_text', '')
    overall_rating = data.get('overall_rating', 3)
    feedback_id = data.get('feedback_id')

    results = {
        'feedback_id': feedback_id,
        'item_results': [],
        'overall': None,
        'any_flagged': False,
        'flag_reasons': [],
    }

    try:
        # ── Analyze overall text if provided ──────────────────────────
        if overall_text and overall_text.strip():
            overall_result = analyzer.analyze_feedback(
                feedback_id=feedback_id,
                text=overall_text,
                rating=overall_rating,
            )
            results['overall'] = overall_result

            if overall_result['should_flag']:
                results['any_flagged'] = True
                results['flag_reasons'].append(
                    overall_result['flagged_reason']
                )

        # ── Analyze each item independently ───────────────────────────
        for item in items:
            item_text = item.get('text', '')
            item_id = item.get('id')
            item_rating = item.get('rating', overall_rating)

            if not item_text or not item_text.strip():
                results['item_results'].append({
                    'menu_item_id': item_id,
                    'sentiment_score': None,
                    'sentiment_label': None,
                    'should_flag': False,
                    'flagged_reason': None,
                    'aspects': {},
                })
                continue

            item_result = analyzer.analyze_feedback(
                feedback_id=feedback_id,
                text=item_text,
                rating=item_rating,
            )

            item_entry = {
                'menu_item_id': item_id,
                'sentiment_score': item_result['sentiment_score'],
                'sentiment_label': item_result['sentiment_label'],
                'should_flag': item_result['should_flag'],
                'flagged_reason': item_result.get('flagged_reason'),
                'aspects': item_result.get('aspects', {}),
            }
            results['item_results'].append(item_entry)

            if item_result['should_flag']:
                results['any_flagged'] = True
                results['flag_reasons'].append(
                    f"Item {item_id}: {item_result['flagged_reason']}"
                )

        return jsonify({'success': True, 'analysis': results})

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
        }), 500


if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        port=int(os.getenv('PORT', 5000)),
        debug=(os.getenv('FLASK_ENV') == 'development')
    )
