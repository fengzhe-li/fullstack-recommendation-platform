import os

from fastapi import Depends, FastAPI, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.db.database import get_db
from app.routes.participants import router as participants_router
from app.routes.recommendations import router as recommendations_router
from app.routes.rooms import router as rooms_router
from app.routes.votes import router as votes_router


def _cors_origins() -> list[str]:
    value = os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
    return [origin.strip() for origin in value.split(",") if origin.strip()]


app = FastAPI(
    title="MeetEat Recommendation API",
    version="0.4.0",
    description="Portfolio-ready backend with persistent rooms, deterministic recommendations, voting, and grounded AI explanations.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(recommendations_router)
app.include_router(rooms_router)
app.include_router(participants_router)
app.include_router(votes_router)


@app.get("/health")
def health_check(db=Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
    except SQLAlchemyError:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "degraded", "database": "unavailable"},
        )
    return {"status": "ok", "database": "connected"}
