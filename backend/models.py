from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    user_id = Column(String(64), primary_key=True, index=True)
    full_name = Column(String(128), nullable=False)
    email = Column(String(128), index=True)
    phone_number = Column(String(32), index=True)
    ssn_hash = Column(String(64), index=True)
    address = Column(String(256), index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    accounts = relationship("Account", back_populates="user", cascade="all, delete-orphan")


class Account(Base):
    __tablename__ = "accounts"

    account_id = Column(String(64), primary_key=True, index=True)
    user_id = Column(String(64), ForeignKey("users.user_id"), nullable=False)
    balance = Column(Float, default=1000.0)
    status = Column(String(32), default="ACTIVE")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="accounts")
    sent_transactions = relationship("Transaction", foreign_keys="Transaction.source_account_id", back_populates="source_account")
    received_transactions = relationship("Transaction", foreign_keys="Transaction.target_account_id", back_populates="target_account")


class Transaction(Base):
    __tablename__ = "transactions"

    transaction_id = Column(String(64), primary_key=True, index=True)
    source_account_id = Column(String(64), ForeignKey("accounts.account_id"), nullable=False, index=True)
    target_account_id = Column(String(64), ForeignKey("accounts.account_id"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    channel = Column(String(32), default="P2P_MOBILE")
    ip_address = Column(String(64))
    device_id = Column(String(64), index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Model Verdicts
    risk_score = Column(Float, default=0.0)
    decision = Column(String(32), default="APPROVE") # APPROVE, REVIEW, DECLINE
    is_fraud_ground_truth = Column(Boolean, default=False)
    fraud_type = Column(String(64), nullable=True) # SYNTHETIC_ID, P2P_MULE_RING, BEHAVIORAL_SPIKE

    # Relationships
    source_account = relationship("Account", foreign_keys=[source_account_id], back_populates="sent_transactions")
    target_account = relationship("Account", foreign_keys=[target_account_id], back_populates="received_transactions")
    alert = relationship("FraudAlert", back_populates="transaction", uselist=False)


class FraudAlert(Base):
    __tablename__ = "fraud_alerts"

    alert_id = Column(String(64), primary_key=True, index=True)
    transaction_id = Column(String(64), ForeignKey("transactions.transaction_id"), nullable=False, unique=True)
    risk_score = Column(Float, nullable=False)
    severity = Column(String(32), default="HIGH") # LOW, MEDIUM, HIGH, CRITICAL
    status = Column(String(32), default="PENDING") # PENDING, CONFIRMED_FRAUD, FALSE_POSITIVE
    explanation_json = Column(Text, nullable=False) # JSON list of SHAP reason bullets
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    transaction = relationship("Transaction", back_populates="alert")
    feedback = relationship("InvestigatorFeedback", back_populates="alert", uselist=False)


class InvestigatorFeedback(Base):
    __tablename__ = "investigator_feedback"

    feedback_id = Column(String(64), primary_key=True, index=True)
    alert_id = Column(String(64), ForeignKey("fraud_alerts.alert_id"), nullable=False, unique=True)
    verified_outcome = Column(String(32), nullable=False) # FRAUD, LEGITIMATE
    notes = Column(Text, nullable=True)
    investigator_id = Column(String(64), default="analyst_01")
    reviewed_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    alert = relationship("FraudAlert", back_populates="feedback")
