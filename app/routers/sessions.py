# app/routers/sessions.py
import uuid
from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException, Request
from jose import jwt

from app.config import settings
from app.db.mongo import sessions_col, audit_logs_col

router = APIRouter()


def _create_token(session_id: str) -> str:
    """Create a JWT containing the session_id, valid for 2 hours."""
    payload = {
        "session_id": session_id,
        "exp": datetime.utcnow() + timedelta(hours=2),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")


async def _audit(session_id: str, event: str, payload: dict | None = None):
    """Insert an audit log entry."""
    await audit_logs_col.insert_one(
        {
            "session_id": session_id,
            "event": event,
            "timestamp": datetime.utcnow(),
            "payload": payload or {},
        }
    )


# ── POST /api/sessions/create ──────────────────────────────
@router.post("/create")
async def create_session(request: Request):
    session_id = str(uuid.uuid4())
    token = _create_token(session_id)

    doc = {
        "_id": session_id,
        "status": "created",
        "created_at": datetime.utcnow(),
        "ip_address": request.client.host if request.client else "unknown",
        "transcript": [],
        "fields": {},
        "fraud_signals": {},
    }

    await sessions_col.insert_one(doc)
    await _audit(session_id, "session_created")

    return {"session_id": session_id, "token": token}


# ── POST /api/sessions/{session_id}/start ───────────────────
@router.post("/{session_id}/start")
async def start_session(session_id: str):
    result = await sessions_col.update_one(
        {"_id": session_id},
        {"$set": {"status": "active", "started_at": datetime.utcnow()}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")

    await _audit(session_id, "session_started")
    return {"status": "active"}


# ── POST /api/sessions/{session_id}/close ───────────────────
@router.post("/{session_id}/close")
async def close_session(session_id: str):
    result = await sessions_col.update_one(
        {"_id": session_id},
        {"$set": {"status": "closed", "closed_at": datetime.utcnow()}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")

    await _audit(session_id, "session_closed")
    return {"status": "closed"}


# ── GET /api/sessions/{session_id} ──────────────────────────
@router.get("/{session_id}")
async def get_session(session_id: str):
    doc = await sessions_col.find_one({"_id": session_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Session not found")

    # Replace _id with session_id for the response
    doc["session_id"] = doc.pop("_id")
    return doc
