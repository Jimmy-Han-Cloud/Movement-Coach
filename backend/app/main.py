from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes.flow import router as flow_router
from app.routes.session import router as session_router
from app.routes.user_params import router as user_params_router
from app.routes.avatar import router as avatar_router
from app.routes.phase_template import router as phase_template_router

app = FastAPI(
    title="Movement Coach API",
    version="0.1.0",
    docs_url="/docs" if settings.debug else None,
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(flow_router)
app.include_router(session_router)
app.include_router(user_params_router)
app.include_router(avatar_router)
app.include_router(phase_template_router)

if settings.debug:
    from app.routes.debug import router as debug_router
    from app.routes.phase_template import seed_router as phase_seed_router

    app.include_router(debug_router)
    app.include_router(phase_seed_router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
