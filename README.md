# ResumeIQ — AI-Powered Resume Analyzer

ResumeIQ is an AI-powered resume analysis application designed to help users evaluate their resumes against their career goals. It provides resume feedback and insights to help users identify strengths and areas for improvement.

## Features

- **Google Authentication:** Sign in using Firebase Authentication.
- **Resume Upload:** Upload a resume for analysis.
- **AI-Powered Analysis:** Analyze resume content using Google's Gemini API.
- **Resume Scoring:** Evaluate resume quality across relevant criteria.
- **Career Targets:** Set a target job role, company, or career objective.
- **Score History:** Track previous resume analysis results.
- **Database Integration:** Store user profiles, career targets, and analysis history in Supabase.

## Tech Stack

| Component | Technology |
|---|---|
| Frontend | React, Vite |
| Backend | Python, FastAPI |
| Authentication | Firebase Authentication |
| Database | Supabase PostgreSQL |
| AI Analysis | Google Gemini API |
| API Communication | REST API |

## Project Structure

```text
resumeanalyser/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   └── main.py
│   ├── .env
│   └── requirements.txt
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
├── .gitignore
├── README.md
└── dev.sh
```

## Prerequisites

- Python 3.10 or later
- Node.js and npm
- A Firebase project with Google sign-in configured
- A Supabase project
- A Google Gemini API key

## Setup and Installation

### 1. Clone the repository

```bash
git clone https://github.com/sathyaprakash122333-pixel/resume-analyser.git
cd resume-analyser
```

### 2. Configure the backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create a `backend/.env` file and configure the environment variables required by the backend, including the Gemini API key and Supabase connection settings. Configure Firebase Admin credentials according to the backend configuration.

**Never commit API keys, service-account JSON files, or other secrets.**

### 3. Configure the frontend

```bash
cd ../frontend
npm install
```

Create `frontend/.env.local` with:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Configure the Firebase client settings using the variable names expected by the frontend code.

### 4. Run the application

Open a terminal for the backend:

```bash
cd ~/Projects/resumeanalyser/backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Open another terminal for the frontend:

```bash
cd ~/Projects/resumeanalyser/frontend
npm run dev
```

Open the frontend URL printed by Vite in your browser. The FastAPI documentation is available at:

http://127.0.0.1:8000/docs

## Database

ResumeIQ uses Supabase PostgreSQL to manage user profiles, career targets, and resume analysis history. Database credentials and configuration must be supplied through environment variables.

## Security

- Keep API keys and private credentials out of Git.
- Do not commit `.env` files or Firebase Admin service-account credentials.
- Use Firebase Authentication to authenticate users and validate tokens on the backend.

## Project Status

ResumeIQ is under development. Features and implementation details may evolve as the project progresses.
