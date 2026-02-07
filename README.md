# Movement Coach

A browser-based, camera-driven, music-synchronized guided movement experience for sedentary computer users.

## Overview

Movement Coach helps desk workers take meaningful movement breaks through:
- **3-5 minute guided sessions**
- **Real-time pose tracking** (7 body points via MediaPipe)
- **Cartoon avatar guidance** (Rive animations)
- **Music-synchronized movements**

No scoring, no failure, no judgment — just healthy movement.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS |
| Pose Detection | MediaPipe Pose Landmarker |
| Animation | Rive |
| Backend | Python 3.11, FastAPI, Uvicorn |
| Auth | Firebase Anonymous Auth |
| Database | Firestore |
| AI | Gemini API (post-session summary) |

## Project Structure

```
Movement-Coach/
├── frontend/           # Next.js application
│   ├── app/            # Pages (/, /avatar, /game)
│   ├── components/     # UI components
│   ├── modules/        # Core modules (flow-engine, pose-validation, etc.)
│   ├── lib/            # Utilities and hooks
│   └── types/          # TypeScript types
├── backend/            # FastAPI application
│   ├── app/
│   │   ├── models/     # Pydantic models
│   │   ├── routers/    # API endpoints
│   │   └── services/   # Business logic
│   └── credentials/    # Firebase credentials (gitignored)
├── WORKFLOW.md         # Complete product specification
└── PROGRESS.md         # Development progress tracker
```

## Quick Start

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

## Documentation

| Document | Description |
|----------|-------------|
| [WORKFLOW.md](./WORKFLOW.md) | Complete product specification, user flows, and technical guide |
| [PROGRESS.md](./PROGRESS.md) | Development progress and V1 checklist |

## User Flow

```
Page 1 (Welcome) → Page 2 (Avatar Setup) → Page 3 (Game) → Page 4 (Result)
```

1. **Welcome**: Product info, remote pairing
2. **Avatar Setup**: Generate cartoon avatar, select music
3. **Game**: Follow avatar movements, real-time pose detection
4. **Result**: Session summary, repeat/exit options

## Tracked Body Points

| # | Point | Usage |
|---|-------|-------|
| 1 | Head | Neck movements |
| 2-3 | Shoulders | Shoulder opening |
| 4-5 | Elbows | Arm participation |
| 6-7 | Hands | Hand motion tracking |

## License

Private project.
