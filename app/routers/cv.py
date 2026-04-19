# app/routers/cv.py
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.services.gemini_ocr import extract_aadhaar
import app.db.mongo as mongo

logger = logging.getLogger(__name__)

router = APIRouter()

CONFIDENCE_MAP = {
    "high": 0.95,
    "medium": 0.70,
    "low": 0.30,
}


@router.post("/doc/{session_id}")
async def verify_document(session_id: str, frame: UploadFile = File(...)):
    """
    Receive a camera frame, run Gemini OCR to extract Aadhaar fields,
    store results in the session document, and insert an audit log.
    """
    # Validate session exists
    if mongo.sessions_col is None:
        raise HTTPException(status_code=503, detail="Database unavailable")

    session = await mongo.sessions_col.find_one({"_id": session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Read image bytes
    image_bytes = await frame.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty frame received")

    logger.info("Session %s: doc verification — received %d bytes", session_id, len(image_bytes))

    # Run Gemini OCR
    extracted = await extract_aadhaar(image_bytes)

    confidence_label = extracted.get("extraction_confidence", "low")
    confidence_score = CONFIDENCE_MAP.get(confidence_label, 0.30)
    is_verified = confidence_score != 0.30

    # Build field updates for MongoDB
    field_updates = {
        "fields.aadhaar_name": {
            "value": extracted.get("name"),
            "confidence": confidence_score,
        },
        "fields.aadhaar_dob": {
            "value": extracted.get("dob"),
            "confidence": confidence_score,
        },
        "fields.aadhaar_gender": {
            "value": extracted.get("gender"),
            "confidence": confidence_score,
        },
        "fields.aadhaar_uid_last4": {
            "value": extracted.get("uid_last4"),
            "confidence": confidence_score,
        },
        "fields.doc_verified": {
            "value": is_verified,
            "confidence": 1.0,
        },
    }

    await mongo.sessions_col.update_one(
        {"_id": session_id},
        {"$set": field_updates},
    )

    # Audit log
    if mongo.audit_logs_col is not None:
        await mongo.audit_logs_col.insert_one({
            "session_id": session_id,
            "event": "doc_verified",
            "timestamp": datetime.now(timezone.utc),
            "payload": {
                "extraction_confidence": confidence_label,
                "is_verified": is_verified,
                "extracted_fields": extracted,
            },
        })

    logger.info(
        "Session %s: doc verified=%s confidence=%s",
        session_id, is_verified, confidence_label,
    )

    # Surface any OCR error to the frontend for debugging
    if "_error" in extracted:
        logger.error("Session %s: OCR error — %s", session_id, extracted["_error"])

    return extracted


@router.post("/frame/{session_id}")
async def receive_frame(session_id: str):
    """Stub endpoint for continuous frame streaming (future use)."""
    return {"status": "received"}
