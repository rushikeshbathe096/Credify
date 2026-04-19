# app/routers/transcription.py
import asyncio
import json
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from deepgram import DeepgramClient, LiveTranscriptionEvents, LiveOptions

from app.config import settings
from app.services.groq_agent import AgentFSM
import app.db.mongo as mongo

logger = logging.getLogger(__name__)
router = APIRouter()

# Active agent instances keyed by session_id
active_agents: dict[str, AgentFSM] = {}


@router.websocket("/ws/transcribe/{session_id}")
async def websocket_transcribe(ws: WebSocket, session_id: str):
    """
    WebSocket endpoint that:
    1. Receives audio chunks from the browser
    2. Forwards them to Deepgram for real-time STT
    3. On final transcript → saves to DB + triggers AgentFSM turn
    4. Streams agent tokens back to the client
    """
    await ws.accept()
    logger.info("WebSocket connected: session %s", session_id)

    # ── Create agent FSM ──────────────────────────────────────
    agent = AgentFSM(session_id)
    active_agents[session_id] = agent

    # Send opening message immediately
    opening = await agent.get_opening()
    await ws.send_json({
        "type": "agent_token",
        "session_id": session_id,
        "payload": {"token": opening, "done": False},
    })
    await ws.send_json({
        "type": "agent_token",
        "session_id": session_id,
        "payload": {"token": "", "done": True},
    })

    # Save opening to DB
    if mongo.transcripts_col is not None:
        await mongo.transcripts_col.insert_one({
            "session_id": session_id,
            "speaker": "agent",
            "text": opening,
            "timestamp": datetime.now(timezone.utc),
        })

    # ── Deepgram live connection ──────────────────────────────
    dg_client = DeepgramClient(settings.DEEPGRAM_API_KEY)
    dg_connection = dg_client.listen.asynclive.v("1")

    async def on_transcript(self, result, **kwargs):
        """Called when Deepgram produces a transcript."""
        try:
            sentence = result.channel.alternatives[0].transcript
            if not sentence or len(sentence.strip()) == 0:
                return

            is_final = result.is_final

            if is_final:
                logger.info("Session %s transcript: %s", session_id, sentence)

                # Send transcript to client
                await ws.send_json({
                    "type": "transcript",
                    "session_id": session_id,
                    "payload": {"text": sentence, "is_final": True},
                })

                # Save to MongoDB
                if mongo.transcripts_col is not None:
                    await mongo.transcripts_col.insert_one({
                        "session_id": session_id,
                        "speaker": "user",
                        "text": sentence,
                        "timestamp": datetime.now(timezone.utc),
                    })

                # Trigger agent turn (non-blocking)
                asyncio.create_task(agent.turn(sentence, ws))

        except Exception as e:
            logger.error("Transcript handler error: %s", e)

    async def on_error(self, error, **kwargs):
        logger.error("Deepgram error for session %s: %s", session_id, error)

    async def on_close(self, close, **kwargs):
        logger.info("Deepgram connection closed for session %s", session_id)

    # Register event handlers
    dg_connection.on(LiveTranscriptionEvents.Transcript, on_transcript)
    dg_connection.on(LiveTranscriptionEvents.Error, on_error)
    dg_connection.on(LiveTranscriptionEvents.Close, on_close)

    # Start Deepgram connection
    options = LiveOptions(
        model="nova-2",
        language="hi",
        punctuate=True,
        interim_results=False,
        endpointing=400,
        encoding="linear16",
        sample_rate=16000,
        channels=1,
    )

    started = await dg_connection.start(options)
    if not started:
        logger.error("Failed to start Deepgram for session %s", session_id)
        await ws.send_json({
            "type": "error",
            "session_id": session_id,
            "payload": {"message": "Failed to start speech recognition"},
        })
        await ws.close()
        return

    # ── Main receive loop ─────────────────────────────────────
    try:
        while True:
            data = await ws.receive()

            if data["type"] == "websocket.receive":
                if "bytes" in data:
                    # Audio chunk → forward to Deepgram
                    await dg_connection.send(data["bytes"])
                elif "text" in data:
                    # Handle text messages (e.g. control messages)
                    msg = json.loads(data["text"])
                    if msg.get("type") == "ping":
                        await ws.send_json({"type": "pong"})
                    elif msg.get("type") == "system_turn":
                        # Push synthetic user message directly into agent
                        sys_text = msg.get("text", "")
                        logger.info("Session %s SYSTEM TURN: %s", session_id, sys_text)
                        
                        # Save to MongoDB as a user/system action so it persists
                        if mongo.transcripts_col is not None:
                            await mongo.transcripts_col.insert_one({
                                "session_id": session_id,
                                "speaker": "user",
                                "text": "[SYSTEM AUTOMATED INPUT] " + sys_text,
                                "timestamp": datetime.now(timezone.utc),
                            })
                            
                        asyncio.create_task(agent.turn("SYSTEM MESSAGE: " + sys_text, ws))

    except WebSocketDisconnect:
        logger.info("WebSocket disconnected: session %s", session_id)
    except Exception as e:
        logger.error("WebSocket error for session %s: %s", session_id, e)
    finally:
        # Cleanup
        try:
            await dg_connection.finish()
        except Exception:
            pass
        active_agents.pop(session_id, None)
        logger.info("Cleanup complete for session %s", session_id)
