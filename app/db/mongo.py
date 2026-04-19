# app/db/mongo.py
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

logger = logging.getLogger(__name__)

client: AsyncIOMotorClient = None  # type: ignore
db = None

# Collection references (initialised in connect_to_mongo)
sessions_col = None
transcripts_col = None
applications_col = None
audit_logs_col = None


async def connect_to_mongo():
    """Initialise the Motor client and bind collection references."""
    global client, db, sessions_col, transcripts_col, applications_col, audit_logs_col

    try:
        client = AsyncIOMotorClient(
            settings.MONGODB_URL,
            serverSelectionTimeoutMS=5000,
        )
        # Force a connection check
        await client.admin.command("ping")
        print("MongoDB connected successfully")
        logger.info("✅ MongoDB connected")
    except Exception as e:
        logger.warning(f"⚠️  MongoDB not reachable: {e}. Server will start without DB.")
        client = None

    if client:
        db = client["credify"]
        sessions_col = db["sessions"]
        transcripts_col = db["transcripts"]
        applications_col = db["applications"]
        audit_logs_col = db["audit_logs"]


async def close_mongo_connection():
    """Gracefully close the Motor client."""
    global client
    if client:
        client.close()


async def get_db():
    """Return the database handle."""
    return db


async def ping_db() -> bool:
    """Return True if MongoDB is reachable."""
    if not client:
        return False
    try:
        await client.admin.command("ping")
        return True
    except Exception:
        return False
