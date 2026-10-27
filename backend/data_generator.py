import random
import hashlib
from datetime import datetime, timedelta
import pandas as pd
from typing import List, Dict, Any, Tuple

FIRST_NAMES = ["James", "Emma", "Liam", "Olivia", "Noah", "Sophia", "Lucas", "Mia", "Ethan", "Ava", "William", "Isabella", "Alexander", "Charlotte"]
LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez"]
CITIES = ["New York, NY", "Austin, TX", "Chicago, IL", "Miami, FL", "Seattle, WA", "San Jose, CA", "Denver, CO", "Boston, MA"]

def generate_ssn_hash(seed_str: str) -> str:
    return hashlib.sha256(seed_str.encode()).hexdigest()[:16]

class SyntheticDataGenerator:
    """
    Generates realistic banking entities with deliberate fraud topologies:
    1. Legitimate users with distinct PII and standard spending patterns.
    2. Synthetic Identity Rings: Multiple accounts created with combined PII
       (e.g., shared phone number, shared SSN or address, single device).
    3. P2P Mule Rings: Groups of accounts executing fan-in aggregation and circular transfers.
    """

    def __init__(self, num_legit_users: int = 50):
        self.num_legit_users = num_legit_users

    def generate_full_dataset(self) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]]]:
        users = []
        accounts = []
        transactions = []

        now = datetime.utcnow()

        # -------------------------------------------------------------
        # 1. Generate Legitimate Users & Accounts
        # -------------------------------------------------------------
        for i in range(1, self.num_legit_users + 1):
            fname = random.choice(FIRST_NAMES)
            lname = random.choice(LAST_NAMES)
            uid = f"USR_NORM_{i:03d}"
            acc_id = f"ACC_NORM_{i:03d}"
            
            user = {
                "user_id": uid,
                "full_name": f"{fname} {lname}",
                "email": f"{fname.lower()}.{lname.lower()}{i}@example.com",
                "phone_number": f"+1-555-01{i:02d}",
                "ssn_hash": generate_ssn_hash(f"NORM_SSN_{i}"),
                "address": f"{100 + i} Elm St, {random.choice(CITIES)}",
                "created_at": now - timedelta(days=random.randint(60, 365))
            }
            users.append(user)
            accounts.append({
                "account_id": acc_id,
                "user_id": uid,
                "balance": round(random.uniform(1500.0, 8000.0), 2),
                "status": "ACTIVE",
                "created_at": user["created_at"]
            })

        # -------------------------------------------------------------
        # 2. Inject Synthetic Identity Rings
        # (Fabricated identities sharing 1 Phone + 1 Address + 1 Device)
        # -------------------------------------------------------------
        shared_phone_ring1 = "+1-555-999-0111"
        shared_addr_ring1 = "742 Evergreen Terrace, Springfield, OR"
        shared_device_ring1 = "DEV_FINGERPRINT_RING1"

        synth_uids = []
        synth_accs = []
        for j in range(1, 5):
            fname = random.choice(["Victor", "Marcus", "Valeria", "Damon"])
            lname = random.choice(["Vance", "Cross", "Stark", "Frost"])
            uid = f"USR_SYNTH_{j:02d}"
            acc_id = f"ACC_SYNTH_{j:02d}"
            synth_uids.append(uid)
            synth_accs.append(acc_id)

            users.append({
                "user_id": uid,
                "full_name": f"{fname} {lname}",
                "email": f"credit_builder_{j}@guerrillamail.com",
                "phone_number": shared_phone_ring1,  # Shared Phone across all 4!
                "ssn_hash": generate_ssn_hash(f"SYNTH_STOLEN_SSN_{j%2}"), # Shared/recycled SSN
                "address": shared_addr_ring1, # Shared drop address
                "created_at": now - timedelta(days=random.randint(10, 40))
            })
            accounts.append({
                "account_id": acc_id,
                "user_id": uid,
                "balance": round(random.uniform(300.0, 1200.0), 2),
                "status": "ACTIVE",
                "created_at": now - timedelta(days=20)
            })

        # -------------------------------------------------------------
        # 3. Inject P2P Money Mule Ring (Circular & Fan-In Topology)
        # -------------------------------------------------------------
        mule_accs = []
        for k in range(1, 5):
            uid = f"USR_MULE_{k:02d}"
            acc_id = f"ACC_MULE_{k:02d}"
            mule_accs.append(acc_id)
            users.append({
                "user_id": uid,
                "full_name": f"Mule Operative {k}",
                "email": f"mule_user_{k}@proton.me",
                "phone_number": f"+1-555-888-00{k}",
                "ssn_hash": generate_ssn_hash(f"MULE_SSN_{k}"),
                "address": f"Warehouse Unit {k}, Chicago, IL",
                "created_at": now - timedelta(days=15)
            })
            accounts.append({
                "account_id": acc_id,
                "user_id": uid,
                "balance": 250.0,
                "status": "ACTIVE",
                "created_at": now - timedelta(days=15)
            })

        # -------------------------------------------------------------
        # 4. Generate Historical Transactions
        # -------------------------------------------------------------
        tx_count = 1

        # A. Normal baseline transactions
        for _ in range(180):
            src_acc = random.choice(accounts[:self.num_legit_users])
            dst_acc = random.choice(accounts[:self.num_legit_users])
            if src_acc["account_id"] == dst_acc["account_id"]:
                continue

            tx_time = now - timedelta(days=random.randint(1, 30), hours=random.randint(0, 23), minutes=random.randint(0, 59))
            transactions.append({
                "transaction_id": f"TXN_{tx_count:05d}",
                "source_account_id": src_acc["account_id"],
                "target_account_id": dst_acc["account_id"],
                "amount": round(random.uniform(15.0, 350.0), 2),
                "channel": "P2P_MOBILE",
                "ip_address": f"192.168.1.{random.randint(10, 250)}",
                "device_id": f"DEV_{src_acc['account_id']}",
                "timestamp": tx_time,
                "is_fraud_ground_truth": False,
                "fraud_type": None
            })
            tx_count += 1

        # B. Injected Synthetic ID Bust-Out Transactions (High amounts, single device)
        for s_acc in synth_accs:
            dst_acc = random.choice(accounts[:self.num_legit_users])
            tx_time = now - timedelta(hours=random.randint(1, 12))
            transactions.append({
                "transaction_id": f"TXN_SYNTH_{tx_count:05d}",
                "source_account_id": s_acc,
                "target_account_id": dst_acc["account_id"],
                "amount": round(random.uniform(2500.0, 4900.0), 2), # Unusually high
                "channel": "P2P_WEB",
                "ip_address": "10.0.88.99",
                "device_id": shared_device_ring1, # All 4 bust-outs come from same device!
                "timestamp": tx_time,
                "is_fraud_ground_truth": True,
                "fraud_type": "SYNTHETIC_ID"
            })
            tx_count += 1

        # C. Injected P2P Mule Ring Cycle & Velocity Smurfing
        # Cycle: MULE_1 -> MULE_2 -> MULE_3 -> MULE_4 -> MULE_1
        cycle_chain = [
            (mule_accs[0], mule_accs[1]),
            (mule_accs[1], mule_accs[2]),
            (mule_accs[2], mule_accs[3]),
            (mule_accs[3], mule_accs[0])
        ]
        cycle_time = now - timedelta(minutes=45)
        for idx, (s_mule, d_mule) in enumerate(cycle_chain):
            transactions.append({
                "transaction_id": f"TXN_MULE_{tx_count:05d}",
                "source_account_id": s_mule,
                "target_account_id": d_mule,
                "amount": round(random.uniform(900.0, 990.0), 2), # Smurfing below $1000 reporting threshold
                "channel": "P2P_MOBILE",
                "ip_address": f"172.16.0.{idx+1}",
                "device_id": f"DEV_MULE_{idx+1}",
                "timestamp": cycle_time + timedelta(minutes=idx * 4),
                "is_fraud_ground_truth": True,
                "fraud_type": "P2P_MULE_RING"
            })
            tx_count += 1

        return users, accounts, transactions
