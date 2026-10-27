# FraudGraph AI: Adaptive Synthetic Identity Theft & P2P Mule Detection Platform

An enterprise-grade financial crime intelligence system designed to combat sophisticated **Synthetic Identity Theft** (frankenstein identities constructed from stitched PII) and **Peer-to-Peer (P2P) Payment Fraud** (money mule networks and layering rings).

Built with a **Hybrid AI Architecture** combining **Graph-Based Relationship Analysis (NetworkX)**, **Supervised Ensemble Learning (LightGBM)**, **Unsupervised Behavioral Anomaly Detection (Isolation Forest)**, **Explainable AI (XAI)**, and an active **Investigator Feedback Loop**.

---

## 📌 Key System Features

1. **Graph-Based Relationship Analytics**:
   - **Bipartite Identity Linkage Network**: Maps and clusters accounts sharing PII (Phone numbers, SSN hashes, physical drop addresses, hardware fingerprints).
   - **Directed P2P Transaction Flow Network**: Analyzes fund velocities, detects circular laundering loops (cycle paths), and pinpoints mule aggregation fan-in ratios.

2. **Dual-Model ML Risk Engine**:
   - **LightGBM Classifier**: Detects known transaction fraud patterns with balanced weighting.
   - **Isolation Forest**: Unsupervised behavioral anomaly detector catching zero-day anomalies and unexpected spending spikes.
   - **Adaptive Score Fusion**: Synthesizes tabular ML predictions, graph cluster metrics, and velocity signals into a calibrated 0–100 Risk Score.

3. **Explainable AI (XAI) & Regulatory SAR Dossier Generation**:
   - Generates transparent, human-readable evidence summaries for analysts.
   - Automated 1-click **Suspicious Activity Report (FinCEN / FIU compliant PDF)** dossier generation via FPDF2.

4. **Continuous Learning Loop & Zero-Downtime Worker**:
   - Fraud investigators submit verified ground truth (*Confirmed Fraud* vs. *False Positive*).
   - Dedicated background retraining thread continuously checks for threshold feedback events and re-fits models without downtime.

5. **Batch Auditing & Graph Query Lab**:
   - Enterprise Drag-and-Drop CSV Batch Auditor for retroactive compliance reviews.
   - Graph Query Lab supporting Cypher / NetworkX traversals (shortest path, connected components, cycle discovery).

6. **Executive Risk Policy & P&L Simulator**:
   - Real-time threshold simulator modeling false positive customer friction vs. prevented fraud losses.

7. **Friendly & Approachable Modern UI**:
   - SaaS/Fintech light mode palette with clean Plus Jakarta Sans typography.
   - Simplified human-readable graph visualization with entity filters and quick-read guide.

---

## 🛠 Technology Stack

- **Backend**: Python 3.10+, FastAPI, Uvicorn, FPDF2, BCrypt, PyJWT
- **Machine Learning & Graph**: LightGBM, Scikit-Learn, NetworkX, Pandas, NumPy
- **Database & Storage**: SQLite, SQLAlchemy ORM, Joblib
- **Frontend**: React 19, Vite, Tailwind CSS, Lucide Icons, Vis-Network

---

## 🚀 Quickstart & Local Setup

### 1. Prerequisites
- Python 3.10+
- Node.js (v18+) & npm

### 2. Backend Setup
```bash
cd backend
python -m pip install -r requirements.txt
python -m pip install httpx fpdf2 bcrypt pyjwt

# Start the FastAPI server (Runs on http://localhost:8000)
python -m uvicorn main:app --reload --port 8000
```
*Note: On first startup, the server automatically seeds realistic synthetic bank data, trains initial ML models, and initializes the graph topology.*

### 3. Frontend Setup
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 🧪 Running Automated Tests

Run the backend verification suite:
```bash
cd backend
python test_api.py
```
**Tests Covered (6/6 passing)**:
- `test_01_api_health_and_stats`: Real-time system analytics integrity.
- `test_02_alerts_listing`: Alert triage queue retrieval.
- `test_03_subgraph_retrieval`: Ego-graph extraction for visualizer.
- `test_04_analyze_legit_transaction`: Confirms normal transactions pass with low risk.
- `test_05_analyze_synthetic_identity_bustout`: Confirms synthetic identity bust-out transactions are flagged as high risk with explainability factors.
- `test_06_feedback_loop`: Tests investigator confirmation feedback persistence.

---

## 📡 API Contract Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/transactions/analyze` | Evaluates a transaction in real-time and returns score, decision, and XAI factors |
| `GET` | `/api/v1/alerts` | Fetches active fraud alert triage queue |
| `POST` | `/api/v1/alerts/{id}/feedback` | Logs investigator feedback (`FRAUD` / `LEGITIMATE`) |
| `GET` | `/api/v1/alerts/{id}/report/pdf` | Downloads official regulatory SAR Compliance PDF Dossier |
| `GET` | `/api/v1/graph/subgraph` | Returns nodes and edges around an entity for graph rendering |
| `POST` | `/api/v1/graph/query` | Executes Cypher / NetworkX traversals (cycles, shortest paths) |
| `POST` | `/api/v1/batch/audit` | Audits an uploaded CSV batch of transactions |
| `GET` | `/api/v1/policy/simulate` | Simulates bank P&L trade-offs at varying risk thresholds |
| `GET` | `/api/v1/analytics/stats` | Returns aggregate dashboard metrics |
| `POST` | `/api/v1/auth/login` | RBAC authentication issuing JWT bearer tokens |
