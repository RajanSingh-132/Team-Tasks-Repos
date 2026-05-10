# Team Tasks Repos — Railway Deployment Guide

A full-stack task management app with a React (Vite) frontend and FastAPI backend, both deployed on Railway.

---

## Project Structure

```
team-tasks-repos/
├── frontend/        # React + Vite app
└── backend/         # FastAPI (Python)
```

---

## Before You Start

Make sure you have:

- A [Railway account](https://railway.app) — sign up free
- Your code pushed to GitHub under the repo **team-tasks-repos**
- Node.js installed locally
- Python 3.10+ installed locally

---

## Step 1 — Deploy the Backend (FastAPI)

1. Go to [railway.app](https://railway.app) and click **New Project**
2. Select **Deploy from GitHub repo**
3. Choose your repo **team-tasks-repos** and select the **backend folder**
4. Railway will auto-detect Python and start building

### Backend Environment Variables

Go to your backend service → **Variables** tab and add all the variables your app needs, for example:

```
MONGO_URI=your_mongodb_connection_string
SECRET_KEY=your_secret_key
```

### CORS Setup

In your backend `main.py`, make sure CORS is configured **before** your routes:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend-url.up.railway.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

> Once your frontend is deployed (Step 2), come back and update `allow_origins` with the actual frontend URL — no trailing slash at the end.

### Get Your Backend URL

After deployment, go to **Settings → Networking → Generate Domain**. You will get a URL like:

```
https://team-tasks-repos-production.up.railway.app
```

Save this — you will need it for the frontend.

---

## Step 2 — Deploy the Frontend (React + Vite)

1. In the same Railway project, click **+ New Service**
2. Select **Deploy from GitHub repo** → choose **team-tasks-repos** → select the **frontend folder**

### Frontend Environment Variables

Go to your frontend service → **Variables** tab and add:

```
VITE_API_URL=https://team-tasks-repos-production.up.railway.app
```

> This must point to your Railway backend URL, not localhost. Vite bakes this value at build time, so the variable must be set in Railway — not just in your local `.env` file.

### Build and Start Commands

Go to **Settings → Build** and set:

```
npm install && npm run build
```

Go to **Settings → Deploy → Start Command** and set:

```
npx serve -s dist -l ${PORT:-8080}
```

### Get Your Frontend URL

Go to **Settings → Networking → Generate Domain**. You will get something like:

```
https://outstanding-fascination-production-xxxx.up.railway.app
```

Now go back to your backend `main.py` and update `allow_origins` with this URL, then push to GitHub so Railway redeploys.

---

## Step 3 — Final Check

Once both services are deployed and CORS is updated:

- Open your frontend URL in the browser
- Try registering or logging in
- Check that data loads correctly from the backend

If login fails, open browser DevTools (`F12` → Console tab) and look for any red error messages.

---

## Common Issues and How to Fix Them

### Site not loading — "This site can't be reached" (DNS_PROBE_FINISHED_NXDOMAIN)

This is a DNS propagation issue. When Railway generates a new domain, it takes some time for that domain to become visible across different networks and regions — usually 10 to 30 minutes, but it can take longer depending on your ISP.

**What to do:**

Wait 10–30 minutes and try again. If it still does not load, try the steps below.

**Clear DNS cache on Windows:**

1. Press `Windows + R` on your keyboard
2. Type `cmd` and press Enter
3. In the Command Prompt window, type:
   ```
   ipconfig /flushdns
   ```
4. Press Enter and wait for the confirmation message
5. Try opening the URL again in your browser

**Change DNS server on Windows (if the above did not work):**

1. Press `Windows + R` on your keyboard
2. Type `ncpa.cpl` and press Enter — this opens your Network Connections
3. Right-click your active connection (WiFi or Ethernet) and click **Properties**
4. Double-click **Internet Protocol Version 4 (TCP/IPv4)**
5. Select **Use the following DNS server addresses** and enter:
   - Preferred DNS server: `8.8.8.8`
   - Alternate DNS server: `8.8.4.4`
6. Click OK and close all windows
7. Try opening the URL again

**Why does this happen in some regions?**

Railway hosts its services on servers located in Singapore (Southeast Asia). Internet Service Providers in certain countries — especially in South Asia and parts of the Middle East — have DNS servers that are slower to update when new domains are created. This means a Railway URL might open instantly for someone in Singapore but take an hour or more to become accessible for someone in India or another region. This is not a problem with your app or your Railway setup — it is purely a DNS timing issue that resolves on its own.

---

### CORS error — login or API calls fail

This means your backend is rejecting requests from your frontend domain.

Check your `main.py`:

```python
allow_origins=["https://your-frontend-url.up.railway.app"],  # no trailing slash
```

Two things to watch:
- The URL must exactly match your frontend Railway domain
- There must be **no trailing slash** at the end of the URL

After fixing, push to GitHub and wait for Railway to redeploy the backend.

---

### VITE_API_URL pointing to localhost

If your app loads but nothing works, check your Railway frontend variables. The `VITE_API_URL` must be your Railway backend URL:

```
VITE_API_URL=https://team-tasks-repos-production.up.railway.app
```

Not:
```
VITE_API_URL=http://127.0.0.1:8000   ← this only works on your own machine
```

After updating the variable, go to **Deployments → Redeploy** so Vite rebuilds with the new value.

---

### Port mismatch

Railway automatically assigns a port via the `$PORT` environment variable. Make sure your start command uses it:

```
npx serve -s dist -l ${PORT:-8080}
```

And in Railway **Variables**, set:

```
PORT=8080
```

---

## Tips to Avoid Problems

- Never delete or regenerate your Railway domain once it is working — every regeneration resets DNS and you have to wait again
- Always update CORS in your backend whenever the frontend URL changes
- Set all environment variables in Railway's dashboard, not just in your local `.env` file
- After changing any variable, redeploy the affected service so it picks up the new value

---

## Architecture Overview

```
Browser
  │
  ▼
Frontend (Railway)
React + Vite — served via `serve`
  │
  │  API calls (HTTPS)
  ▼
Backend (Railway)
FastAPI (Python) — handles auth, tasks, projects
  │
  ▼
Database (MongoDB Atlas or Railway DB)
```

---

## Local Development

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Make sure your local `.env` has:
```
VITE_API_URL=http://127.0.0.1:8000
```

For local development only — change this to your Railway backend URL before deploying.
