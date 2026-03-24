from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import mysql.connector
from datetime import datetime

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Database connection
def get_db_connection():
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

# Sentiment analysis endpoint (placeholder)
@app.route('/api/ml/sentiment/analyze', methods=['POST'])
def analyze_sentiment():
    data = request.get_json()
    
    feedback_id = data.get('feedback_id')
    text = data.get('text')
    rating = data.get('rating')
    
    # TODO: Implement sentiment analysis
    # For now, return mock data
    
    sentiment = {
        'overall_score': 0.65,
        'label': 'positive',
        'confidence': 0.89,
        'aspects': {
            'food_quality': {
                'score': 0.95,
                'label': 'positive',
                'keywords': ['amazing', 'best']
            },
            'service': {
                'score': -0.34,
                'label': 'negative',
                'keywords': ['slow']
            }
        },
        'should_flag': False,
        'processed_at': datetime.now().isoformat()
    }
    
    return jsonify({
        'success': True,
        'sentiment': sentiment
    })

if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        port=int(os.getenv('PORT', 5000)),
        debug=(os.getenv('FLASK_ENV') == 'development')
    )
