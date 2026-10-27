# Production Deployment Guide: FraudGraph AI

This document provides step-by-step instructions to deploy **FraudGraph AI** into real production cloud environments (AWS, DigitalOcean, Render, or Railway) using Docker & Nginx.

---

## 🚢 Option A: Single-Command Docker Deployment (Local or VPS)

Deploy the complete multi-container setup (Backend API + Nginx + React Frontend):

```bash
# From the root directory:
docker compose up --build -d
```

- **Frontend Application**: `http://<your-server-ip>` (Port 80)
- **Backend API**: `http://<your-server-ip>:8000/docs` (Port 8000)

---

## ☁️ Option B: Free / Low-Cost Cloud Deployment (Render.com / Railway)

### 1. Deploy the Backend (FastAPI)
1. Push your repository to **GitHub**.
2. Go to **[Render.com](https://render.com)** -> Create a new **Web Service**.
3. Select your repository.
4. Set the following configuration:
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt && pip install python-jose cryptography bcrypt httpx`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. In **Environment Variables**, add:
   - `JWT_SECRET_KEY`: `<generate-a-strong-secret-key>`
   - `PYTHONUNBUFFERED`: `1`

### 2. Deploy the Frontend (React + Vite)
1. In Render or **Vercel** ([vercel.com](https://vercel.com)), create a new **Static Site**.
2. Set configuration:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Update `vite.config.js` or set `VITE_API_BASE_URL` to point to your deployed backend URL.

---

## 🔐 Analyst Production Credentials

To log in via the new **Analyst Login** portal:
- **Lead Investigator**: `lead_analyst` / `FraudGuard2026!`
- **Compliance Officer**: `risk_officer` / `RiskShield2026!`

---

## 🔄 Automated Model Retraining in Production

To run the continuous learning worker on a cron schedule (e.g., every 6 hours):
```bash
# Add to crontab:
0 */6 * * * cd /path/to/backend && python retraining_worker.py >> /var/log/retraining.log 2>&1
```
