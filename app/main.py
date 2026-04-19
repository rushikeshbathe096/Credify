# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.routers import sessions, transcription, cv, dashboard
from app.db.mongo import connect_to_mongo, close_mongo_connection, ping_db
from app.config import settings
print("Loaded Mongo URL:", settings.MONGODB_URL)
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_to_mongo()
    yield
    # Shutdown
    await close_mongo_connection()


app = FastAPI(title="Credify AI", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.vercel.app"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sessions.router, prefix="/api/sessions")
app.include_router(transcription.router, prefix="/api")
app.include_router(cv.router, prefix="/api/cv")
app.include_router(dashboard.router, prefix="/api/dashboard")


@app.get("/health")
async def health():
    db_ok = await ping_db()
    return {
        "status": "ok",
        "service": "credify",
        "db": "connected" if db_ok else "disconnected",
    }