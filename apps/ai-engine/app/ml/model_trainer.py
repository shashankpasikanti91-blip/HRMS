"""
ML model training pipelines for HR analytics.
Trains and evaluates models for attrition prediction, engagement scoring, etc.
"""

import os
import pickle
import structlog
import numpy as np
from typing import Optional
from datetime import datetime

logger = structlog.get_logger()


class ModelTrainer:
    """Trains and manages ML models for HR predictions."""

    def __init__(self, model_dir: str = "./models"):
        self.model_dir = model_dir
        os.makedirs(model_dir, exist_ok=True)

    async def train_attrition_model(self, training_data: list[dict]) -> dict:
        """Train an attrition prediction model using employee features."""
        if len(training_data) < 10:
            return {"error": "Insufficient training data", "minimum_required": 10}

        try:
            from sklearn.ensemble import RandomForestClassifier
            from sklearn.model_selection import train_test_split
            from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

            X, y = self._prepare_attrition_features(training_data)
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

            model = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)
            model.fit(X_train, y_train)

            y_pred = model.predict(X_test)
            metrics = {
                "accuracy": float(accuracy_score(y_test, y_pred)),
                "precision": float(precision_score(y_test, y_pred, zero_division=0)),
                "recall": float(recall_score(y_test, y_pred, zero_division=0)),
                "f1_score": float(f1_score(y_test, y_pred, zero_division=0)),
            }

            model_path = os.path.join(self.model_dir, "attrition_model.pkl")
            with open(model_path, "wb") as f:
                pickle.dump(model, f)

            logger.info("attrition_model_trained", metrics=metrics, samples=len(training_data))
            return {
                "model": "attrition_predictor",
                "version": datetime.utcnow().isoformat(),
                "metrics": metrics,
                "training_samples": len(training_data),
                "model_path": model_path,
            }

        except ImportError:
            return {"error": "scikit-learn not available"}

    async def train_engagement_model(self, training_data: list[dict]) -> dict:
        """Train an engagement prediction model."""
        if len(training_data) < 10:
            return {"error": "Insufficient training data", "minimum_required": 10}

        try:
            from sklearn.ensemble import GradientBoostingRegressor
            from sklearn.model_selection import train_test_split
            from sklearn.metrics import mean_squared_error, r2_score

            X, y = self._prepare_engagement_features(training_data)
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

            model = GradientBoostingRegressor(n_estimators=100, max_depth=5, random_state=42)
            model.fit(X_train, y_train)

            y_pred = model.predict(X_test)
            metrics = {
                "mse": float(mean_squared_error(y_test, y_pred)),
                "rmse": float(np.sqrt(mean_squared_error(y_test, y_pred))),
                "r2": float(r2_score(y_test, y_pred)),
            }

            model_path = os.path.join(self.model_dir, "engagement_model.pkl")
            with open(model_path, "wb") as f:
                pickle.dump(model, f)

            logger.info("engagement_model_trained", metrics=metrics, samples=len(training_data))
            return {
                "model": "engagement_predictor",
                "version": datetime.utcnow().isoformat(),
                "metrics": metrics,
                "training_samples": len(training_data),
                "model_path": model_path,
            }

        except ImportError:
            return {"error": "scikit-learn not available"}

    async def predict(self, model_name: str, features: list[dict]) -> list[dict]:
        """Run inference using a trained model."""
        model_path = os.path.join(self.model_dir, f"{model_name}.pkl")
        if not os.path.exists(model_path):
            return [{"error": f"Model '{model_name}' not found"}]

        with open(model_path, "rb") as f:
            model = pickle.load(f)

        if model_name == "attrition_model":
            X, _ = self._prepare_attrition_features(features)
        elif model_name == "engagement_model":
            X, _ = self._prepare_engagement_features(features)
        else:
            return [{"error": f"Unknown model: {model_name}"}]

        predictions = model.predict(X)
        probabilities = model.predict_proba(X) if hasattr(model, "predict_proba") else None

        results = []
        for i, feat in enumerate(features):
            result = {
                "employee_id": feat.get("employee_id", f"emp_{i}"),
                "prediction": float(predictions[i]),
            }
            if probabilities is not None:
                result["probability"] = float(probabilities[i][1]) if len(probabilities[i]) > 1 else float(probabilities[i][0])
            results.append(result)

        return results

    def _prepare_attrition_features(self, data: list[dict]) -> tuple:
        """Extract feature vectors for attrition model."""
        feature_names = [
            "tenure_months", "age", "salary", "performance_score",
            "leaves_taken", "overtime_hours", "distance_from_home",
            "num_promotions", "years_since_promotion", "num_companies_worked",
        ]

        X = []
        y = []
        for row in data:
            features = [float(row.get(f, 0)) for f in feature_names]
            X.append(features)
            y.append(int(row.get("left", row.get("attrited", 0))))

        return np.array(X), np.array(y)

    def _prepare_engagement_features(self, data: list[dict]) -> tuple:
        """Extract feature vectors for engagement model."""
        feature_names = [
            "attendance_rate", "task_completion_rate", "collaboration_score",
            "training_hours", "feedback_score", "tenure_months",
        ]

        X = []
        y = []
        for row in data:
            features = [float(row.get(f, 0)) for f in feature_names]
            X.append(features)
            y.append(float(row.get("engagement_score", 50)))

        return np.array(X), np.array(y)

    def list_models(self) -> list[dict]:
        """List all trained models."""
        models = []
        for filename in os.listdir(self.model_dir):
            if filename.endswith(".pkl"):
                filepath = os.path.join(self.model_dir, filename)
                stat = os.stat(filepath)
                models.append({
                    "name": filename.replace(".pkl", ""),
                    "file": filename,
                    "size_bytes": stat.st_size,
                    "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                })
        return models


# Singleton
model_trainer = ModelTrainer()
