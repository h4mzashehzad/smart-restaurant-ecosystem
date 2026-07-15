"""
Demand forecasting model for restaurant menu items.

Uses a RandomForestRegressor trained on historical order quantities
with time features (hour, day-of-week, weekend flag) plus rolling
historical averages. Falls back gracefully when training data is sparse.
"""

from __future__ import annotations

from collections import defaultdict
from datetime import datetime
from typing import Any

import numpy as np

try:
    from sklearn.ensemble import RandomForestRegressor
except ImportError:  # pragma: no cover
    RandomForestRegressor = None


class DemandForecaster:
    """Per-restaurant demand forecaster for menu items."""

    MIN_SAMPLES = 24
    MIN_ITEMS_WITH_DATA = 1

    def forecast(
        self,
        historical_rows: list[dict[str, Any]],
        forecast_date: str,
        menu_item_ids: list[int] | None = None,
        hours: list[int] | None = None,
    ) -> dict[str, Any]:
        """
        historical_rows: list of dicts with keys:
            menu_item_id, name, placed_at (datetime or ISO string), quantity
        """
        if RandomForestRegressor is None:
            return {
                "insufficient_data": True,
                "reason": "scikit-learn is not installed",
                "forecasts": [],
            }

        if not historical_rows:
            return {
                "insufficient_data": True,
                "reason": "No historical order data available",
                "forecasts": [],
            }

        parsed = self._parse_rows(historical_rows)
        if len(parsed) < self.MIN_SAMPLES:
            return {
                "insufficient_data": True,
                "reason": f"Need at least {self.MIN_SAMPLES} order-item samples, got {len(parsed)}",
                "forecasts": [],
            }

        # Aggregate to (menu_item_id, date, hour) quantity buckets
        buckets: dict[tuple[int, str, int], float] = defaultdict(float)
        names: dict[int, str] = {}
        for row in parsed:
            key = (row["menu_item_id"], row["date"], row["hour"])
            buckets[key] += row["quantity"]
            names[row["menu_item_id"]] = row["name"]

        # Build rolling averages keyed by (menu_item_id, hour, dow)
        history_by_feature: dict[tuple[int, int, int], list[float]] = defaultdict(list)
        for (item_id, date_str, hour), qty in buckets.items():
            dt = datetime.strptime(date_str, "%Y-%m-%d")
            history_by_feature[(item_id, hour, dt.weekday())].append(qty)

        feature_rows = []
        targets = []
        meta = []

        for (item_id, date_str, hour), qty in buckets.items():
            dt = datetime.strptime(date_str, "%Y-%m-%d")
            dow = dt.weekday()
            is_weekend = 1.0 if dow >= 5 else 0.0
            hist = history_by_feature[(item_id, hour, dow)]
            rolling_avg = float(np.mean(hist)) if hist else 0.0
            rolling_std = float(np.std(hist)) if len(hist) > 1 else 0.0

            feature_rows.append([
                float(item_id),
                float(hour),
                float(dow),
                is_weekend,
                rolling_avg,
                rolling_std,
                float(len(hist)),
            ])
            targets.append(qty)
            meta.append({"menu_item_id": item_id, "hour": hour, "dow": dow})

        X = np.array(feature_rows, dtype=float)
        y = np.array(targets, dtype=float)

        model = RandomForestRegressor(
            n_estimators=80,
            max_depth=8,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1,
        )
        model.fit(X, y)

        # Per-tree confidence proxy via prediction variance
        tree_preds = np.array([tree.predict(X) for tree in model.estimators_])
        train_std = float(np.mean(np.std(tree_preds, axis=0)))
        train_mean = float(np.mean(y)) if len(y) else 1.0
        baseline_confidence = max(
            0.35,
            min(0.95, 1.0 - (train_std / max(train_mean, 1.0))),
        )

        forecast_dt = datetime.strptime(forecast_date, "%Y-%m-%d")
        target_hours = hours if hours is not None else list(range(11, 23))  # typical service window
        item_ids = menu_item_ids if menu_item_ids else sorted(names.keys())

        if not item_ids:
            return {
                "insufficient_data": True,
                "reason": "No menu items found in historical data",
                "forecasts": [],
            }

        forecasts = []
        for item_id in item_ids:
            hourly_predictions = []
            for hour in target_hours:
                dow = forecast_dt.weekday()
                is_weekend = 1.0 if dow >= 5 else 0.0
                hist = history_by_feature.get((item_id, hour, dow), [])
                rolling_avg = float(np.mean(hist)) if hist else 0.0
                rolling_std = float(np.std(hist)) if len(hist) > 1 else 0.0

                features = np.array([[
                    float(item_id),
                    float(hour),
                    float(dow),
                    is_weekend,
                    rolling_avg,
                    rolling_std,
                    float(len(hist)),
                ]])

                pred = float(model.predict(features)[0])
                # Blend with historical average when available
                if hist:
                    pred = 0.7 * pred + 0.3 * rolling_avg

                quantity = max(0, int(round(pred)))

                tree_pred = np.array([tree.predict(features)[0] for tree in model.estimators_])
                pred_std = float(np.std(tree_pred))
                confidence = max(
                    0.3,
                    min(
                        0.98,
                        baseline_confidence * (1.0 - min(pred_std / max(pred, 1.0), 0.5)),
                    ),
                )
                if not hist:
                    confidence = min(confidence, 0.45)

                hourly_predictions.append({
                    "hour": int(hour),
                    "quantity": int(quantity),
                    "confidence": float(round(confidence, 4)),
                })

            total_daily = sum(p["quantity"] for p in hourly_predictions)
            avg_confidence = (
                sum(p["confidence"] for p in hourly_predictions) / len(hourly_predictions)
                if hourly_predictions
                else 0.0
            )

            forecasts.append({
                "menu_item_id": int(item_id),
                "name": names.get(item_id, f"Item {item_id}"),
                "hourly_predictions": hourly_predictions,
                "total_daily": int(total_daily),
                "recommended_prep_quantity": int(np.ceil(total_daily * 1.1)),
                "avg_confidence": float(round(avg_confidence, 4)),
            })

        forecasts.sort(key=lambda f: f["total_daily"], reverse=True)

        return {
            "insufficient_data": False,
            "reason": None,
            "forecasts": forecasts,
            "model_version": "v1.0.0-rf",
            "trained_on_samples": len(parsed),
        }

    def _parse_rows(self, rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
        parsed = []
        for row in rows:
            placed_at = row.get("placed_at")
            if isinstance(placed_at, str):
                try:
                    placed_at = datetime.fromisoformat(placed_at.replace("Z", "+00:00")).replace(tzinfo=None)
                except ValueError:
                    continue
            elif not isinstance(placed_at, datetime):
                continue

            qty = row.get("quantity", 0)
            try:
                qty = float(qty)
            except (TypeError, ValueError):
                continue

            if qty <= 0:
                continue

            item_id = row.get("menu_item_id")
            if item_id is None:
                continue

            parsed.append({
                "menu_item_id": int(item_id),
                "name": row.get("name") or f"Item {item_id}",
                "date": placed_at.strftime("%Y-%m-%d"),
                "hour": placed_at.hour,
                "quantity": qty,
            })

        return parsed
