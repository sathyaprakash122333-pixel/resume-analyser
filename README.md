# ResumeIQ — AI-Powered Resume Analyzer & Career Progress Tracker

ResumeIQ is an AI-powered resume analysis and career tracking platform. This repository contains the Phase 1 initialization: the React/Vite frontend (reproducing the reference dark UI design with Firebase Google Authentication) and the decoupled FastAPI backend (providing health check services, CORS middleware, and API structure).

---

## 1. Architecture Overview

```
resume-analyser/
├── frontend/                     # React (Vite) + Tailwind CSS + Firebase Auth
│   ├── public/                   # Static assets
│   ├── src/
│   │   ├── assets/               # Image/icon assets
│   │   ├── components/           # UI components (Header, Sidebar, ScoreGauge, etc.)
│   │   ├── pages/
│   │   │   ├── Login.jsx         # Google Sign-in Page matching reference design
│   │   │   ├── Dashboard.jsx     # Longitudinal Career Insights Dashboard
│   │   │   ├── AnalyzeResume.jsx # Drag-drop resume PDF upload & target role analysis form
│   │   │   ├── AnalysisSummary.jsx # Comprehensive results & scoring breakdown report
│   │   │   └── Profile.jsx       # Firebase authenticated account profile & display name editor
│   │   ├── services/
│   │   │   ├── firebase.js       # Firebase Client SDK initialization & Google Auth
│   │   │   └── api.js            # FastAPI integration client
│   │   ├── App.jsx               # Protected routing & auth state listener
│   │   ├── main.jsx              # React DOM entry point
│   │   └── index.css             # Tailwind CSS & theme tokens
│   ├── .env.example              # Frontend environment template
│   ├── .env.local                # Local environment config (ignored by git)
│   ├── .gitignore                # Frontend git ignore
│   ├── package.json              # NPM dependencies & scripts
│   └── vite.config.js            # Vite configuration with Tailwind CSS plugin
├── backend/                      # Python FastAPI Application
│   ├── app/
│   │   ├── __init__.py           # App package
│   │   ├── main.py               # FastAPI application & CORS configuration
│   │   ├── core/
│   │   │   ├── __init__.py       # Core package
│   │   │   └── config.py         # Pydantic Settings & environment variables
│   │   ├── api/
│   │   │   ├── __init__.py       # API package
│   │   │   └── routes/
│   │   │       ├── __init__.py   # Routes package
│   │   │       └── health.py     # GET /api/v1/health endpoint
│   │   └── schemas/
│   │       └── __init__.py       # Pydantic schemas package
│   ├── tests/
│   │   ├── __init__.py           # Test suite package
│   │   └── test_health.py        # Pytest test cases for health & root routes
│   ├── .env.example              # Backend environment template
│   ├── .gitignore                # Backend git ignore
│   └── requirements.txt          # Python dependencies
├── .gitignore                    # Root repository git ignore
└── README.md                     # Project documentation & runbook
```

---

## 2. Prerequisites

- **Node.js**: v18+ (tested on v24.21.0)
- **npm**: v9+ (tested on v11.19.0)
- **Python**: 3.10+ (tested on 3.14.4)
- A **Firebase Project** with Google Authentication enabled in the Firebase Console.

---

## 3. Frontend Setup & Run Instructions

### A. Environment Configuration
The frontend reads Firebase web configuration from `frontend/.env.local`. Create or verify `frontend/.env.local`:

```dotenv
VITE_FIREBASE_API_KEY=your_firebase_web_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=resume-analyser-e4441.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=resume-analyser-e4441
VITE_FIREBASE_STORAGE_BUCKET=resume-analyser-e4441.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=538386306246
VITE_FIREBASE_APP_ID=1:538386306246:web:add41bb1561bd4c81bb3c7
```

> **Note on Firebase Google Authentication:**
> To complete the Google Sign-In setup:
> 1. Go to the [Firebase Console](https://console.firebase.google.com/) > Select **resume-analyser-e4441**.
> 2. Navigate to **Build > Authentication > Sign-in method**.
> 3. Enable **Google** as a sign-in provider and add a support email.
> 4. Ensure `localhost` is listed under **Authorized domains** (Authentication > Settings > Authorized domains).
> 5. Obtain the Web API Key from **Project Settings > General > Web API Key** and paste it into `VITE_FIREBASE_API_KEY` in `frontend/.env.local`.

### B. Run Development Server

```bash
cd frontend
npm install
npm run dev
```

The application will be accessible at: `http://localhost:5173/`

### C. Run Production Build

```bash
cd frontend
npm run build
```

---

## 4. Backend Setup & Run Instructions

### A. Environment Setup & Dependency Installation

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### B. Run FastAPI Server

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### C. Access Documentation & Health Checks

- **Root API Info**: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
- **Health Check Endpoint**: [http://127.0.0.1:8000/api/v1/health](http://127.0.0.1:8000/api/v1/health)
- **Interactive Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc Documentation**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

### D. Run Automated Tests

```bash
cd backend
pytest tests/
```

Expected output:
```text
tests/test_health.py ..                                          [100%]
============================== 2 passed in 0.17s ==============================
```

---

## 5. Visual Fidelity & Reference Implementation

The UI precisely reproduces the dark theme (`#000000` background) reference design:
- **Login (`/login`)**: Gradient document icon, hero value propositions ("AI-powered feedback", "Find skill gaps", "Track your progress"), and Google sign-in card with terms.
- **Dashboard (`/dashboard`)**:
  - Radial score gauge displaying latest score (`78/100`) and green upward delta (`↑ +8 from previous`).
  - Total analyses count card (`6 Completed reviews`).
  - Current target indicator card (`Python Backend Developer`).
  - Interactive SVG score progression line chart (`Oct 1 – Oct 24`).
  - Recent analyses table with score status badges.
  - Score breakdown category bars (Skills Match, Experience & Projects, Content Quality, Structure & Readability, Completeness).
  - Prominent "Analyze Resume" call to action.
  - Mode toggle allowing preview of both the **Reference Mockup** and genuine **Empty State** for fresh accounts.
