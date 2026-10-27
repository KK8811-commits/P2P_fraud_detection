# FraudGraph AI — Comprehensive Viva & Technical Presentation Guide

This guide is structured specifically for your **B.Tech Project Presentation / Viva Voce**. It covers high-level concepts, internal algorithms, architecture, and expected evaluator questions with crisp, technically precise answers.

---

## 1. 1-Minute Pitch (How to introduce your project)
> *"Good morning/afternoon. Traditional fraud detection relies on static rule-based thresholds that fail to catch modern financial crimes like Synthetic Identity Theft and P2P Money Mule Rings. In our project, **FraudGraph AI**, we built a hybrid fraud intelligence system that fuses **Graph-Based Relationship Analysis (NetworkX)** with a **Dual-Model ML Architecture (LightGBM + Isolation Forest)**.*
> *Our system doesn't treat transactions as isolated numbers: it models identity linkages to catch fabricated users sharing PII, tracks directed fund flows to catch money laundering cycles, produces transparent Explainable AI (XAI) factors for fraud analysts, and improves over time through a verified human feedback loop."*

---

## 2. Technical System Explanation (How it works under the hood)

1. **Dual-Graph Topology**:
   - **Identity Bipartite Graph**: Nodes represent Users and PII attributes (Phone numbers, SSN hashes, Addresses, Device IDs). Edges represent relationships (`HAS_PHONE`, `USED_DEVICE`). When 4 different account names link to the same phone and hardware fingerprint, the graph engine computes high cluster sizes and shared entity counts.
   - **Transaction Flow Directed Graph**: Nodes represent bank accounts; edges represent directional transfers weighted by dollar volume. Algorithms detect **cycles** (circular laundering paths) and **high in-degree fan-in** (mule accounts collecting money before draining).

2. **Adaptive ML Risk Fusion**:
   - Tabular features (amount, velocity, time of day) and Graph features (cycle presence, degree centrality, shared entity counts) are extracted in real time.
   - The **LightGBM Classifier** evaluates probability of known fraud ($P_{\text{supervised}}$).
   - The **Isolation Forest** evaluates behavioral outlier scores ($P_{\text{unsupervised}}$).
   - The **Rule & Graph Multiplier** boosts risk if topological cycles or PII reuse are detected.
   - Output: An adaptive calibrated risk score between $0$ and $100$ and a verdict (`APPROVE`, `REVIEW`, `DECLINE`).

3. **Explainable AI (XAI)**:
   - Evaluators hate "black box" models. Our system generates actionable evidence bullets explaining exactly why a transaction was flagged (e.g., *"Shared phone number with 3 other identities"*, *"Surge in 1-hour velocity"*).

4. **Continuous Learning Loop**:
   - When analysts review alerts in the UI and click "Confirm Fraud" or "False Positive", the feedback is stored in SQLite/PostgreSQL, closing the loop for automated model re-calibration.

---

## 3. Top 15 Viva Questions & Technically Correct Answers

### Q1: What is Synthetic Identity Theft, and why can't normal ML detect it easily?
**Answer**: *Synthetic identity theft occurs when criminals combine real and fabricated PII (e.g., a real SSN with a fake name, phone, or address) to create entirely new credit profiles. Traditional tabular ML models only look at a single transaction in isolation, where each field looks syntactically valid. By using a graph relationship network, we can detect that multiple disparate profiles share identical devices, phone numbers, or addresses.*

### Q2: Why did you use LightGBM instead of standard Logistic Regression or Random Forest?
**Answer**: *LightGBM is a gradient boosting tree algorithm that uses histogram-based decision trees and Leaf-wise (Best-First) tree growth. It handles imbalanced datasets common in fraud detection significantly better than Random Forest, provides lower memory overhead, faster inference latency (< 5ms per transaction), and natively supports feature importance ranking.*

### Q3: Why combine supervised (LightGBM) with unsupervised (Isolation Forest)?
**Answer**: *Supervised models excel at catching known, historical fraud patterns with labels. However, fraudsters constantly innovate new techniques (zero-day fraud). Isolation Forest isolates anomalies without requiring labels by randomly partitioning feature space—anomalous points require fewer splits to isolate.*

### Q4: How is graph data represented and analyzed in your backend?
**Answer**: *We utilize NetworkX to maintain two graphs: an undirected bipartite graph for identity linkage and a directed graph for transaction flows. For each incoming transaction, we compute real-time topological properties: node in/out degree, cycle existence via path-finding algorithms (`nx.has_path`), and connected component sizes.*

### Q5: What is P2P mule circular routing, and how do you detect it?
**Answer**: *Money mules often bounce stolen funds through 3 to 5 intermediary peer accounts before routing them back or cashing out to break the audit trail. In our directed flow graph, we run cycle detection: if a path exists from the destination account back to the source account or its immediate cluster, the transaction forms a closed loop and is flagged immediately.*

### Q6: How do you prevent cold-start false positives for new legitimate users?
**Answer**: *New legitimate users without historical transaction baselines are scored primarily on identity uniqueness (absence of shared high-risk PII clusters) and normal initial velocity limits. Their risk score defaults to a conservative middle band rather than an instant decline.*

### Q7: Why did you hash the SSN instead of storing it plain?
**Answer**: *To follow data security and privacy compliance (PCI-DSS & GDPR). Personally Identifiable Information like Social Security Numbers or National IDs must never be stored in plaintext. We use SHA-256 hashing to compare identity linkages mathematically while keeping the underlying credential private.*

### Q8: What is Explainable AI (XAI), and why is it mandatory in banking?
**Answer**: *In banking and credit systems, regulations (like the Fair Credit Reporting Act and EU AI Act) prohibit automated adverse actions without justification. XAI breaks down the model's decision into human-interpretable factors so fraud analysts can audit and verify the reason for blocking an account.*

### Q9: How does the Continuous Learning / Feedback Loop operate?
**Answer**: *When an investigator triages an alert, their decision (`CONFIRMED_FRAUD` or `FALSE_POSITIVE`) is recorded in the `investigator_feedback` table. These verified ground-truth labels update the training corpus, allowing the model pipeline to be retrained periodically to adapt to newly emerging fraud topologies.*

### Q10: How scalable is this graph approach if we have millions of transactions?
**Answer**: *For our prototype, in-memory NetworkX with SQLite handles thousands of operations with sub-second response times. In enterprise production, the architecture seamlessly scales by replacing NetworkX with a distributed graph database like Neo4j or Amazon Neptune, and pairing FastAPI with Apache Kafka for distributed stream processing.*

### Q11: What is the purpose of velocity features?
**Answer**: *Velocity measures the frequency of transactions over specific rolling time windows (e.g., 1 hour, 24 hours). Sudden spikes in velocity are characteristic of "smurfing" or automated bot-driven cash draining.*

### Q12: Why did you choose FastAPI over Flask or Django?
**Answer**: *FastAPI is built on Starlette and Pydantic, offering asynchronous (`async/await`) non-blocking I/O, automatic OpenAPI documentation, and up to 3x higher throughput compared to Flask, which is critical for real-time payment gateway latency constraints.*

### Q13: What happens if the database or ML model fails?
**Answer**: *Our system employs structured exception handling. If the ML pipeline throws an error or experiences timeout, the transaction triggers a fallback `REVIEW` status rather than failing silently or auto-declining legitimate customer funds.*

### Q14: How are transactions visualized on the frontend?
**Answer**: *We integrated Vis-Network with HTML5 Canvas. Nodes are color-coded by entity category (Green for Users, Blue for Accounts, Amber for Phones, Red for SSNs, Purple for Devices) and physics simulation algorithms automatically position clusters to highlight identity rings.*

### Q15: What would you improve in Version 2.0 of this project?
**Answer**: *In Version 2.0, we would:
1. Implement Graph Neural Networks (GNNs) using PyTorch Geometric for end-to-end node embeddings.
2. Integrate Apache Kafka for distributed streaming ingestion.
3. Deploy containerized microservices on Kubernetes with Prometheus/Grafana monitoring for model drift.*
