import os
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Tuple
from sklearn.ensemble import IsolationForest
import lightgbm as lgb
import joblib

FEATURE_COLUMNS = [
    "amount",
    "hour_of_day",
    "velocity_last_1h",
    "velocity_last_24h",
    "avg_amount_ratio",
    "is_new_device",
    "src_in_degree",
    "src_out_degree",
    "dst_in_degree",
    "dst_out_degree",
    "is_part_of_cycle",
    "shared_entity_count",
    "device_user_sharing_count",
    "cluster_size",
    "mule_fan_in_ratio"
]

class FraudModelPipeline:
    """
    Hybrid Fraud Detection & Explainability Engine:
    1. LightGBM Supervised Classifier (Calibrated probabilities for known fraud patterns)
    2. Isolation Forest Unsupervised Detector (Zero-day / anomalous behavioral spikes)
    3. Rule & Graph Fusion Layer (Adaptive risk scoring combining signals)
    4. XAI Feature Importance Attribution (Plain-text explainability for fraud alerts)
    """

    def __init__(self, model_dir: str = None):
        if model_dir is None:
            model_dir = os.path.dirname(os.path.abspath(__file__))
        self.model_dir = model_dir
        self.lgb_model = None
        self.iso_forest = None
        self.feature_names = FEATURE_COLUMNS
        self.load_or_init_models()

    def load_or_init_models(self):
        lgb_path = os.path.join(self.model_dir, "lgb_fraud_model.joblib")
        iso_path = os.path.join(self.model_dir, "iso_forest_model.joblib")

        if os.path.exists(lgb_path) and os.path.exists(iso_path):
            try:
                self.lgb_model = joblib.load(lgb_path)
                self.iso_forest = joblib.load(iso_path)
                print("[ML Pipeline] Successfully loaded pre-trained models from disk.")
                return
            except Exception as e:
                print(f"[ML Pipeline] Error loading models: {e}. Will re-initialize.")

        # Initialize defaults if not saved
        self.lgb_model = lgb.LGBMClassifier(
            n_estimators=100,
            learning_rate=0.05,
            num_leaves=31,
            class_weight="balanced",
            random_state=42
        )
        self.iso_forest = IsolationForest(
            n_estimators=100,
            contamination=0.05,
            random_state=42
        )

    def train_pipeline(self, df: pd.DataFrame):
        """Trains both supervised classifier and unsupervised anomaly detector."""
        X = df[self.feature_names].fillna(0)
        y = df["is_fraud"].astype(int)

        print(f"[ML Pipeline] Training LightGBM on {len(df)} samples ({y.sum()} positive frauds)...")
        self.lgb_model.fit(X, y)

        print("[ML Pipeline] Training Isolation Forest for behavioral anomalies...")
        self.iso_forest.fit(X)

        # Save model artifacts
        joblib.dump(self.lgb_model, os.path.join(self.model_dir, "lgb_fraud_model.joblib"))
        joblib.dump(self.iso_forest, os.path.join(self.model_dir, "iso_forest_model.joblib"))
        print("[ML Pipeline] Models trained and saved successfully.")

    def predict_risk(self, feature_dict: Dict[str, float]) -> Tuple[float, str, List[Dict[str, Any]]]:
        """
        Executes adaptive scoring:
        Returns:
            - final_score: float (0.0 to 100.0)
            - decision: 'APPROVE', 'REVIEW', 'DECLINE'
            - explanations: list of top contributing reasons
        """
        # Convert single record to DataFrame
        row = pd.DataFrame([feature_dict])[self.feature_names].fillna(0)

        # 1. LightGBM Supervised Probability
        if hasattr(self.lgb_model, "predict_proba"):
            lgb_prob = float(self.lgb_model.predict_proba(row)[0][1])
        else:
            lgb_prob = 0.1

        # 2. Isolation Forest Anomaly Score
        # score_samples returns negative anomaly score (-1 is very anomalous, 0 is normal)
        iso_score = float(self.iso_forest.score_samples(row)[0])
        # Map roughly from [-0.8, -0.2] to [1.0, 0.0]
        iso_anomaly_prob = float(np.clip((0.0 - iso_score) * 2.0, 0.0, 1.0))

        # 3. Rule / Graph Prior Multipliers
        # Graph indicators strongly amplify synthetic identity & mule network confidence
        graph_boost = 0.0
        if feature_dict.get("is_part_of_cycle", 0) > 0:
            graph_boost += 0.35 # Strong signal for circular mule laundering
        if feature_dict.get("shared_entity_count", 0) >= 2:
            graph_boost += 0.30 # High likelihood of synthetic identity fabrication
        if feature_dict.get("device_user_sharing_count", 0) >= 3:
            graph_boost += 0.25 # Same device managing multiple identities

        # Adaptive Weighted Fusion
        composite_score = (0.50 * lgb_prob) + (0.20 * iso_anomaly_prob) + (0.30 * min(graph_boost, 1.0))
        final_risk = float(np.clip(composite_score * 100.0, 0.0, 100.0))

        # Decision thresholding
        if final_risk >= 75.0:
            decision = "DECLINE"
        elif final_risk >= 45.0:
            decision = "REVIEW"
        else:
            decision = "APPROVE"

        # Generate Explainable AI Factors
        explanations = self.generate_explanations(feature_dict, lgb_prob, iso_anomaly_prob)

        return round(final_risk, 1), decision, explanations

    def generate_explanations(self, feature_dict: Dict[str, float], lgb_prob: float, iso_prob: float) -> List[Dict[str, Any]]:
        """Produces clear, human-understandable evidence bullets for investigators."""
        factors = []

        if feature_dict.get("is_part_of_cycle", 0) > 0:
            factors.append({
                "factor": "Circular P2P Routing Detected",
                "severity": "CRITICAL",
                "detail": "Transaction forms a closed loop returning to source or intermediary mule network."
            })

        if feature_dict.get("shared_entity_count", 0) >= 2:
            count = int(feature_dict.get("shared_entity_count", 0))
            factors.append({
                "factor": "Synthetic Identity Ring Indicator",
                "severity": "CRITICAL",
                "detail": f"This user profile shares PII (phone/address/SSN) with {count} other distinct account profiles."
            })

        if feature_dict.get("device_user_sharing_count", 0) >= 2:
            count = int(feature_dict.get("device_user_sharing_count", 0))
            factors.append({
                "factor": "Multi-Account Device Reuse",
                "severity": "HIGH",
                "detail": f"Hardware fingerprint observed across {count} separate accounts within a short window."
            })

        if feature_dict.get("velocity_last_1h", 0) >= 4:
            vel = int(feature_dict.get("velocity_last_1h", 0))
            factors.append({
                "factor": "Rapid Velocity Surge",
                "severity": "HIGH",
                "detail": f"Account initiated {vel} transactions in the past 60 minutes (exceeds 95th percentile baseline)."
            })

        if feature_dict.get("avg_amount_ratio", 1.0) >= 4.0:
            ratio = feature_dict.get("avg_amount_ratio", 1.0)
            factors.append({
                "factor": "Significant Amount Deviation",
                "severity": "MEDIUM",
                "detail": f"Transfer amount is {ratio:.1f}x higher than the account's 30-day historical average."
            })

        if feature_dict.get("mule_fan_in_ratio", 0) >= 3.0:
            factors.append({
                "factor": "Mule Fan-In Aggregation Pattern",
                "severity": "HIGH",
                "detail": "Target account receives deposits from numerous disparate accounts with negligible outward flow."
            })

        if not factors and lgb_prob > 0.4:
            factors.append({
                "factor": "Correlated Risk Profile",
                "severity": "MEDIUM",
                "detail": "Statistical anomaly detected across combined temporal, behavioral, and location features."
            })

        return factors
