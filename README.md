# Movement Coach

A browser-based guided movement experience for desk workers. Uses the device camera to detect body position in real-time and guides users through short, music-synchronized movement sessions — no account required, no scoring, no judgment.

## Features

- **Real-time pose detection** — 7-point body tracking runs entirely in the browser via MediaPipe
- **Animated coach** — Rive-powered cartoon character demonstrates each movement
- **Music-synchronized flow** — movement sequences are generated to match the tempo and energy of the selected track
- **Personalized avatar** — optional photo upload generates a cartoon likeness of the user
- **AI session summary** — brief, encouraging post-session feedback
- **Zero friction** — anonymous sign-in, no onboarding required

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| Pose Detection | MediaPipe Pose Landmarker (WASM, in-browser) |
| Animation | Rive |
| Backend | Python 3.12, FastAPI |
| Auth | Firebase Anonymous Auth |
| Database | Firestore |
| AI | Google Gemini API |

## Project Structure

```
Movement-Coach/
├── frontend/
│   ├── app/                # Pages: /, /avatar, /game, /session
│   ├── components/         # Shared UI components
│   ├── modules/
│   │   ├── flow-engine/    # Movement sequence playback
│   │   ├── pose-validation/# Real-time pose scoring
│   │   ├── session-summary/# Post-session result logic
│   │   └── visual-feedback/# On-screen feedback overlays
│   └── lib/                # API client, hooks, utilities
└── backend/
    └── app/
        ├── routes/         # API endpoints
        ├── services/       # Business logic (auth, AI, music analysis)
        └── models/         # Pydantic request/response schemas
```

## Setup

### Prerequisites

- Node.js 20+
- Python 3.12+
- A Firebase project with Anonymous Auth and Firestore enabled
- A Gemini API key

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Fill in .env with your credentials
```

Required environment variables (`backend/.env`):

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google Gemini API key |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Path to Firebase service account JSON |
| `GOOGLE_CLOUD_PROJECT` | GCP project ID |
| `CORS_ORIGINS` | Allowed origins (e.g. `http://localhost:3000`) |

```bash
uvicorn app.main:app --reload
# API available at http://localhost:8000
```

### Frontend

```bash
cd frontend
npm install

cp .env.example .env.local
# Fill in .env.local with your Firebase web app config
```

Required environment variables (`frontend/.env.local`):

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend URL (e.g. `http://localhost:8000`) |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase web app configuration values |

```bash
npm run dev
# App available at http://localhost:3000
```

## User Flow

```
Welcome → Avatar Setup → Movement Session → Result
```

1. **Welcome** — product intro, camera permission request
2. **Avatar Setup** — optional photo upload to generate a personalized cartoon avatar; music selection
3. **Session** — follow the animated coach through music-synchronized poses and hand motions; real-time pose feedback via camera
4. **Result** — AI-generated session summary; option to repeat or exit

## API Overview

All endpoints require a Firebase ID token (`Authorization: Bearer <token>`).

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/music/analyze` | Classify song tempo and energy |
| `POST` | `/api/music/flow` | Generate a movement flow for a song |
| `POST` | `/api/session` | Save session result |
| `POST` | `/api/avatar` | Generate cartoon avatar from photo |
| `GET` | `/api/user-params` | Retrieve saved user preferences |

## License

Private — all rights reserved.
