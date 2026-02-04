# Movement Coach — Backend

Python 3.11 + FastAPI

## Local Setup

```bash
cd backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install pip-tools
pip-compile requirements.in
pip install -r requirements.txt
cp .env.example .env   # edit as needed
```

## Run

```bash
uvicorn app.main:app --reload
```

Server starts at `http://127.0.0.1:8000`.

## Verify

```bash
curl http://127.0.0.1:8000/health
# {"status":"ok"}
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DEBUG` | No | `true` enables /docs and debug endpoints (default: `false`) |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | No | Path to Firebase service account JSON. Omit for in-memory fallback |
| `GOOGLE_CLOUD_PROJECT` | No | GCP project ID |
| `GEMINI_API_KEY` | No | Gemini API key for post-session summaries |
| `CORS_ORIGINS` | No | Comma-separated allowed origins (default: `http://localhost:3000`) |

## API Reference

### Public

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/api/flows` | List available flow IDs |
| `GET` | `/api/flows/{flow_id}` | Get full flow definition |

### Authenticated (requires `Authorization: Bearer <token>` or `X-Debug-User-Id` in debug mode)

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/sessions` | Create a new session |
| `POST` | `/api/sessions/{id}/result` | Submit session results |
| `POST` | `/api/sessions/{id}/summary` | Generate AI summary (requires Gemini key) |
| `GET` | `/api/sessions/{id}` | Get session details |
| `GET` | `/api/users/me/params` | Get user personalization params |
| `PATCH` | `/api/users/me/params` | Update user personalization params |

### Debug only (`DEBUG=true`)

| Method | Path | Description |
|---|---|---|
| `GET` | `/debug/sessions` | List all session IDs (in-memory only) |
| `GET` | `/debug/user-params` | List all user param entries (in-memory only) |
| `POST` | `/debug/reset` | Clear all in-memory data |

## API Docs (development only)

Set `DEBUG=true` in `.env`, then visit `http://127.0.0.1:8000/docs`.
