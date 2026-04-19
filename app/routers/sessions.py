# app/routers/sessions.py
import uuid
from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException, Request
from jose import jwt

from app.config import settings
import app.db.mongo as mongo

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
    from app.db.mongo import audit_logs_col
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
    from app.db.mongo import sessions_col
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
    from app.db.mongo import sessions_col
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
    from app.db.mongo import sessions_col, transcripts_col
    result = await sessions_col.update_one(
        {"_id": session_id},
        {"$set": {"status": "closed", "closed_at": datetime.utcnow()}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")

    await _audit(session_id, "session_closed")

    # Fetch all user transcripts
    user_cursor = transcripts_col.find({"session_id": session_id, "speaker": "user"}).sort("timestamp", 1)
    user_transcripts = await user_cursor.to_list(length=None)
    transcript_text = "\n".join([doc["text"] for doc in user_transcripts])

    # Extract fields
    from app.services.extractor import extract_application_fields
    extracted_fields = await extract_application_fields(transcript_text)
    
    # Fetch session to get Aadhaar state
    session = await sessions_col.find_one({"_id": session_id})
    existing_fields = session.get("fields", {})
    
    doc_verified = False
    if "doc_verified" in existing_fields:
        # Assuming the structure is {"value": True, "confidence": 1.0}
        doc_verified = existing_fields["doc_verified"].get("value", False)
        
    merged_fields = {**existing_fields, **extracted_fields}
    
    # Compute Risk and Generate Offer
    from app.services.risk import compute_risk, generate_offer
    risk = compute_risk(merged_fields, doc_verified)
    offer = generate_offer(merged_fields, risk)
    
    # Save back to MongoDB
    await sessions_col.update_one(
        {"_id": session_id},
        {"$set": {
            "fields": merged_fields,
            "risk_score": risk["score"],
            "decision": risk["decision"],
            "risk_reasons": risk["reasons"],
            "offer": offer
        }}
    )

    return {"status": "closed", "offer_generated": True}

# ── GET /api/sessions/{session_id}/offer ──────────────────────
@router.get("/{session_id}/offer")
async def get_offer(session_id: str):
    from app.db.mongo import sessions_col
    doc = await sessions_col.find_one({"_id": session_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Session not found")
        
    if "offer" not in doc:
        raise HTTPException(status_code=400, detail="Offer not ready")
        
    return {
        "offer": doc["offer"],
        "risk": {
            "score": doc.get("risk_score"),
            "decision": doc.get("decision"),
            "reasons": doc.get("risk_reasons")
        },
        "fields": doc.get("fields", {})
    }


# ── GET /api/sessions/{session_id} ──────────────────────────
@router.get("/{session_id}")
async def get_session(session_id: str):
    from app.db.mongo import sessions_col
    doc = await sessions_col.find_one({"_id": session_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Session not found")

    # Replace _id with session_id for the response
    doc["session_id"] = doc.pop("_id")
    return doc
