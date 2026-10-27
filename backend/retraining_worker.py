import os
import time
import pandas as pd
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import FraudAlert, InvestigatorFeedback, Transaction
from ml_pipeline import FraudModelPipeline
from graph_engine import GraphIntelligenceEngine

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fraud_platform.db")
DATABASE_URL = f"sqlite:///{DB_PATH}"

def run_retraining_cycle():
    """
    Continuous Learning Worker:
    1. Scans database for verified investigator feedback.
    2. Builds new labeled training samples (Fraud vs False Positive).
    3. Re-trains and calibrates the LightGBM & Isolation Forest models.
    4. Saves newly versioned model artifacts without service interruption.
    """
    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] [Retraining Worker] Scanning for feedback updates...")
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        feedback_records = session.query(InvestigatorFeedback).join(FraudAlert).all()
        print(f"[Retraining Worker] Found {len(feedback_records)} verified feedback decisions.")

        if len(feedback_records) == 0:
            print("[Retraining Worker] No new feedback samples to re-train. Sleeping...")
            return

        txs = session.query(Transaction).all()
        if len(txs) < 20:
            print("[Retraining Worker] Insufficient transaction volume for re-training.")
            return

        # Prepare dataset
        pipeline = FraudModelPipeline()
        dataset = []
        for t in txs:
            # Check if this tx has an analyst verified outcome
            is_fraud = 1 if t.is_fraud_ground_truth else 0
            if t.alert and t.alert.feedback:
                is_fraud = 1 if t.alert.feedback.verified_outcome == "FRAUD" else 0

            row = {
                "amount": t.amount,
                "hour_of_day": t.timestamp.hour if t.timestamp else 12,
                "velocity_last_1h": 2,
                "velocity_last_24h": 5,
                "avg_amount_ratio": t.amount / 200.0,
                "is_new_device": 1.0 if t.risk_score > 50 else 0.0,
                "src_in_degree": 1.0,
                "src_out_degree": 2.0,
                "dst_in_degree": 1.0,
                "dst_out_degree": 0.0,
                "is_part_of_cycle": 1.0 if t.fraud_type == "P2P_MULE_RING" else 0.0,
                "shared_entity_count": 3.0 if t.fraud_type == "SYNTHETIC_ID" else 0.0,
                "device_user_sharing_count": 2.0 if t.fraud_type == "SYNTHETIC_ID" else 0.0,
                "cluster_size": 4.0 if t.fraud_type == "SYNTHETIC_ID" else 1.0,
                "mule_fan_in_ratio": 3.0 if t.fraud_type == "P2P_MULE_RING" else 0.0,
                "is_fraud": is_fraud
            }
            dataset.append(row)

        df = pd.DataFrame(dataset)
        pipeline.train_pipeline(df)
        print("[Retraining Worker] Continuous model re-fit complete. Artifacts updated on disk.")
    finally:
        session.close()

if __name__ == "__main__":
    run_retraining_cycle()
