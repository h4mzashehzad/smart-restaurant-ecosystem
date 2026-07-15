from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
from datetime import datetime

from models.sentiment_analyzer import SentimentAnalyzer
from models.recommender import MenuRecommender
from models.demand_forecaster import DemandForecaster

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

# Initialize recommender
recommender = MenuRecommender()

# Initialize demand forecaster
forecaster = DemandForecaster()

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


# Recommendation endpoint
@app.route('/api/ml/recommendations/generate', methods=['POST'])
def generate_recommendations():
    data = request.get_json()

    user_id = data.get('user_id')
    context = data.get('context', {})
    max_recommendations = data.get('max_recommendations', 5)
    
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Fetch user preferences if user_id is provided
        user_preferences = []
        if user_id:
            cursor.execute("SELECT * FROM user_preferences WHERE user_id = %s", (user_id,))
            user_preferences = cursor.fetchall()
            
        # Fetch active menu items
        cursor.execute("SELECT * FROM menu_items WHERE is_available = 1")
        menu_items = cursor.fetchall()
        
        recommendations = recommender.recommend(user_preferences, menu_items, max_recommendations)
        
        return jsonify({
            'success': True,
            'recommendations': recommendations,
            'model_version': 'v1.1.0',
            'generated_at': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()


# ── Demand Forecasting ───────────────────────────────────────────────────────


@app.route('/api/ml/forecast/demand', methods=['POST'])
def forecast_demand():
    """
    Generate per-item hourly demand forecasts for a restaurant/date.

    Request body:
    {
        "restaurant_id": 1,
        "forecast_date": "2026-07-16",
        "menu_item_ids": [87, 112],   # optional
        "lookback_days": 60,          # optional
        "hours": [11, 12, ..., 22]    # optional
    }
    """
    data = request.get_json() or {}
    restaurant_id = data.get('restaurant_id')
    forecast_date = data.get('forecast_date')
    menu_item_ids = data.get('menu_item_ids')
    lookback_days = int(data.get('lookback_days', 60))
    hours = data.get('hours')

    if not restaurant_id or not forecast_date:
        return jsonify({
            'success': False,
            'error': 'restaurant_id and forecast_date are required',
        }), 422

    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                oi.menu_item_id,
                mi.name,
                o.placed_at,
                oi.quantity
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            JOIN menu_items mi ON oi.menu_item_id = mi.id
            WHERE o.restaurant_id = %s
              AND o.status NOT IN ('cancelled', 'pending_payment')
              AND o.placed_at >= DATE_SUB(%s, INTERVAL %s DAY)
              AND o.placed_at < %s
            """,
            (restaurant_id, forecast_date, lookback_days, forecast_date),
        )
        historical_rows = cursor.fetchall()

        # Convert datetime objects to ISO strings for the forecaster
        for row in historical_rows:
            if row.get('placed_at') is not None and hasattr(row['placed_at'], 'isoformat'):
                row['placed_at'] = row['placed_at'].isoformat()

        result = forecaster.forecast(
            historical_rows=historical_rows,
            forecast_date=forecast_date,
            menu_item_ids=menu_item_ids,
            hours=hours,
        )

        return jsonify({
            'success': True,
            'insufficient_data': result.get('insufficient_data', False),
            'reason': result.get('reason'),
            'forecasts': result.get('forecasts', []),
            'model_version': result.get('model_version', 'v1.0.0-rf'),
            'trained_on_samples': result.get('trained_on_samples', 0),
            'generated_at': datetime.now().isoformat(),
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
        }), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()


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
