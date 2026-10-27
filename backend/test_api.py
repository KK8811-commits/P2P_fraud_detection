import unittest
from fastapi.testclient import TestClient
import main
from database import SessionLocal

class FraudGraphAPITestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(main.app)

    def test_01_api_health_and_stats(self):
        response = self.client.get("/api/v1/analytics/stats")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("total_transactions", data)
        self.assertIn("total_alerts", data)
        self.assertGreater(data["total_transactions"], 0)

    def test_02_alerts_listing(self):
        response = self.client.get("/api/v1/alerts")
        self.assertEqual(response.status_code, 200)
        alerts = response.json()
        self.assertIsInstance(alerts, list)
        self.assertGreater(len(alerts), 0)

    def test_03_subgraph_retrieval(self):
        response = self.client.get("/api/v1/graph/subgraph?entity_id=USR_SYNTH_01&depth=2")
        self.assertEqual(response.status_code, 200)
        graph = response.json()
        self.assertIn("nodes", graph)
        self.assertIn("edges", graph)
        self.assertGreater(len(graph["nodes"]), 0)

    def test_04_analyze_legit_transaction(self):
        payload = {
            "source_account_id": "ACC_NORM_001",
            "target_account_id": "ACC_NORM_002",
            "amount": 25.0,
            "channel": "P2P_MOBILE",
            "device_id": "DEV_ACC_NORM_001",
            "ip_address": "192.168.1.100"
        }
        response = self.client.post("/api/v1/transactions/analyze", json=payload)
        self.assertEqual(response.status_code, 200)
        res = response.json()
        self.assertIn(res["decision"], ["APPROVE", "REVIEW"])
        self.assertLess(res["risk_score"], 60.0)

    def test_05_analyze_synthetic_identity_bustout(self):
        payload = {
            "source_account_id": "ACC_SYNTH_01",
            "target_account_id": "ACC_NORM_005",
            "amount": 4900.0,
            "channel": "P2P_WEB",
            "device_id": "DEV_FINGERPRINT_RING1",
            "ip_address": "10.0.88.99"
        }
        response = self.client.post("/api/v1/transactions/analyze", json=payload)
        self.assertEqual(response.status_code, 200)
        res = response.json()
        self.assertGreaterEqual(res["risk_score"], 50.0)
        self.assertGreater(len(res["explanations"]), 0)

    def test_06_feedback_loop(self):
        alerts_res = self.client.get("/api/v1/alerts")
        first_alert = alerts_res.json()[0]
        alert_id = first_alert["alert_id"]

        fb_payload = {
            "verified_outcome": "FRAUD",
            "notes": "Verified bust-out fraud pattern confirmed by automated test."
        }
        response = self.client.post(f"/api/v1/alerts/{alert_id}/feedback", json=fb_payload)
        self.assertEqual(response.status_code, 200)
        res = response.json()
        self.assertEqual(res["status"], "CONFIRMED_FRAUD")

if __name__ == "__main__":
    unittest.main()
