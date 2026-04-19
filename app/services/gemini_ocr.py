# app/services/gemini_ocr.py
import asyncio
import logging
import random

logger = logging.getLogger(__name__)

MOCK_PROFILES = [
    {
        "name": "Rajan Sharma",
        "dob": "1996-08-14",
        "gender": "M",
        "uid_last4": "4821",
        "address_city": "Mumbai",
        "extraction_confidence": "high"
    },
    {
        "name": "Priya Patel",
        "dob": "1992-03-22",
        "gender": "F",
        "uid_last4": "9384",
        "address_city": "Ahmedabad",
        "extraction_confidence": "high"
    },
    {
        "name": "Amit Kumar",
        "dob": "1988-11-05",
        "gender": "M",
        "uid_last4": "1122",
        "address_city": "Delhi",
        "extraction_confidence": "high"
    },
    {
        "name": "Sneha Gupta",
        "dob": "1999-01-30",
        "gender": "F",
        "uid_last4": "7756",
        "address_city": "Bangalore",
        "extraction_confidence": "high"
    }
]

async def extract_aadhaar(image_bytes: bytes) -> dict:
    """Mock implementation of Aadhaar OCR to avoid Gemini API dependency."""
    logger.info("Mock extract_aadhaar called with %d bytes", len(image_bytes) if image_bytes else 0)
    
    # Simulate processing delay to feel realistic (200-500ms)
    delay = random.uniform(0.2, 0.5)
    await asyncio.sleep(delay)
    
    # We never throw an error, even if the image is empty or too small.
    # But it's good to log it.
    if not image_bytes or len(image_bytes) < 1000:
        logger.warning("Image too small (%d bytes) - but mock will still return a profile", len(image_bytes) if image_bytes else 0)
    
    # Randomly pick a mock profile
    profile = random.choice(MOCK_PROFILES)
    
    logger.info("Mock returned profile for: %s with %s confidence", profile["name"], profile["extraction_confidence"])
    
    # Return a copy to avoid mutating the original mock profile dict
    return profile.copy()
