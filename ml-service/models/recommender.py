import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

class MenuRecommender:
    def __init__(self):
        pass
        
    def recommend(self, user_preferences, menu_items, max_recommendations=5):
        """
        Generate recommendations based on user preferences and menu item features using Cosine Similarity.
        """
        if not menu_items:
            return []
            
        if not user_preferences:
            return self._fallback_popularity(menu_items, max_recommendations)

        # 1. Identify all unique feature spaces from the menu items
        cuisine_types = set([item.get('cuisine_type') for item in menu_items if item.get('cuisine_type')])
        spice_levels = set([str(item.get('spice_level')) for item in menu_items if item.get('spice_level') is not None])
        
        feature_cols = []
        feature_cols.extend([f"cuisine_type_{c}" for c in cuisine_types])
        feature_cols.extend([f"spice_level_{s}" for s in spice_levels])
        feature_cols.extend(['is_vegetarian_1', 'is_vegan_1', 'is_gluten_free_1'])

        if not feature_cols:
            return self._fallback_popularity(menu_items, max_recommendations)

        # 2. Build the User Preference Vector
        user_vec = np.zeros(len(feature_cols))
        pref_dict = {}
        for pref in user_preferences:
            key = f"{pref['preference_type']}_{pref['preference_value']}"
            pref_dict[key] = float(pref.get('weight', 1.0))

        for i, col in enumerate(feature_cols):
            if col in pref_dict:
                user_vec[i] = pref_dict[col]

        # If user vector is empty (no matching preferences), fallback
        if np.sum(user_vec) == 0:
            return self._fallback_popularity(menu_items, max_recommendations)

        # 3. Build the Item Feature Matrix
        item_matrix = []
        for item in menu_items:
            vec = np.zeros(len(feature_cols))
            
            # Map item features to vector
            if item.get('cuisine_type'):
                col_name = f"cuisine_type_{item['cuisine_type']}"
                if col_name in feature_cols:
                    vec[feature_cols.index(col_name)] = 1.0
                    
            if item.get('spice_level') is not None:
                col_name = f"spice_level_{item['spice_level']}"
                if col_name in feature_cols:
                    vec[feature_cols.index(col_name)] = 1.0
                    
            for diet in ['is_vegetarian', 'is_vegan', 'is_gluten_free']:
                if item.get(diet):
                    col_name = f"{diet}_1"
                    if col_name in feature_cols:
                        vec[feature_cols.index(col_name)] = 1.0
            
            item_matrix.append(vec)

        item_matrix = np.array(item_matrix)

        # 4. Compute Cosine Similarity
        # Reshape user_vec to (1, n_features)
        similarities = cosine_similarity(user_vec.reshape(1, -1), item_matrix)[0]

        # 5. Compile and rank recommendations
        recommendations = []
        for idx, item in enumerate(menu_items):
            sim_score = similarities[idx]
            
            # Add a slight popularity bonus (max 0.1) to break ties or boost good items
            pop_bonus = (float(item.get('popularity_score', 0)) / 100.0)
            final_score = sim_score + pop_bonus
            
            if final_score > 0:
                # Generate a dynamic reason based on the highest matching feature
                reason = "Based on your taste preferences"
                item_vec = item_matrix[idx]
                overlap = user_vec * item_vec
                if np.sum(overlap) > 0:
                    best_feature_idx = np.argmax(overlap)
                    best_feature = feature_cols[best_feature_idx]
                    if best_feature.startswith('cuisine_type_'):
                        reason = f"Matches your love for {best_feature.replace('cuisine_type_', '')} cuisine"
                    elif best_feature.startswith('spice_level_'):
                        reason = "Matches your preferred spice level"
                    elif best_feature.startswith('is_'):
                        reason = "Matches your dietary preferences"
                
                recommendations.append({
                    'menu_item_id': item['id'],
                    'score': round(final_score, 4),
                    'reason': reason,
                    'confidence': round(min(sim_score, 0.99), 2)
                })

        # Sort by final score descending
        recommendations = sorted(recommendations, key=lambda x: x['score'], reverse=True)
        
        if not recommendations:
            return self._fallback_popularity(menu_items, max_recommendations)
            
        return recommendations[:max_recommendations]
        
    def _fallback_popularity(self, menu_items, max_recommendations):
        # Sort by popularity_score
        items_sorted = sorted(menu_items, key=lambda x: float(x.get('popularity_score', 0) or 0), reverse=True)
        
        recommendations = []
        for item in items_sorted[:max_recommendations]:
            recommendations.append({
                'menu_item_id': item['id'],
                'score': float(item.get('popularity_score', 0) or 0),
                'reason': 'Popular choice',
                'confidence': 0.8
            })
        return recommendations
