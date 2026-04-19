# app/services/extractor.py
import json
import logging
import re
from groq import AsyncGroq
from app.config import settings

logger = logging.getLogger(__name__)

_client = AsyncGroq(api_key=settings.GROQ_API_KEY)

_EXTRACTION_PROMPT = """You are a financial data extraction AI.
Read the following conversation transcript between an AI agent and a loan applicant.
Extract the relevant financial and personal information into JSON format.

Output EXACTLY this JSON structure, and nothing else:
{
  "full_name": {"value": "string or null", "confidence": 0.0},
  "monthly_income": {"value": 0, "raw_spoken": "e.g. '2 lakhs' or '50k' exactly as said by user", "confidence": 0.0},
  "employment_type": {"value": "salaried/self-employed/business/null", "confidence": 0.0},
  "employer_name": {"value": "string or null", "confidence": 0.0},
  "existing_emis": {"value": 0, "raw_spoken": "exact string", "confidence": 0.0},
  "loan_amount_requested": {"value": 0, "raw_spoken": "exact string", "confidence": 0.0},
  "declared_city": {"value": "string or null", "confidence": 0.0}
}

Confidence Scoring Rules:
- 0.9: Explicitly stated by the user clearly.
- 0.5: Inferred from context.
- 0.0: Missing entirely (set value to null).

CRITICAL: For 'monthly_income', 'existing_emis', and 'loan_amount_requested', MUST fill 'raw_spoken' with the exact words the user used. 

Transcript:
"""

def parse_indian_amount(raw_str: str, default_val: float) -> int:
    if not isinstance(raw_str, str) or not raw_str.strip():
        return int(default_val) if default_val else 0
        
    raw_str = raw_str.lower().replace(",", "").replace("₹", "").replace("rs", "").strip()
    
    # Extract the first pure number found
    match = re.search(r"(\d+(\.\d+)?)", raw_str)
    if not match:
        return int(default_val) if default_val else 0
        
    base_val = float(match.group(1))
    
    if "lakh" in raw_str or "lac" in raw_str or re.search(r"\d+(\.\d+)?\s*l\b", raw_str):
        return int(base_val * 100000)
    if "k" in raw_str or "thousand" in raw_str:
        return int(base_val * 1000)
    if "crore" in raw_str or "cr" in raw_str:
        return int(base_val * 10000000)
        
    return int(base_val)

async def extract_application_fields(transcript_text: str) -> dict:
    if not transcript_text or not transcript_text.strip():
        logger.warning("Empty transcript provided to extractor.")
        return _fallback_empty_fields()
        
    try:
        messages = [
            {"role": "system", "content": _EXTRACTION_PROMPT},
            {"role": "user", "content": transcript_text}
        ]
        
        response = await _client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.1,
            max_tokens=1024,
            response_format={"type": "json_object"}
        )
        
        raw_output = response.choices[0].message.content
        if not raw_output:
            raise ValueError("Empty response from Groq.")
            
        data = json.loads(raw_output)
        
        # Post-process amounts using our deterministic python parser to avoid LLM dropping zeros
        for key in ["monthly_income", "existing_emis", "loan_amount_requested"]:
            if key in data and isinstance(data[key], dict):
                raw_spoken = data[key].get("raw_spoken")
                current_value = data[key].get("value", 0)
                if raw_spoken:
                    corrected_val = parse_indian_amount(raw_spoken, current_value)
                    # Use corrected val if it's larger or if LLM failed
                    if corrected_val > 0:
                        data[key]["value"] = corrected_val

        # Ensure all required keys exist, fill with fallbacks if missing
        expected_keys = [
            "full_name", "monthly_income", "employment_type", "employer_name",
            "existing_emis", "loan_amount_requested", "declared_city"
        ]
        
        for key in expected_keys:
            if key not in data or not isinstance(data[key], dict):
                data[key] = {"value": None, "confidence": 0.0}
                
        return data

    except Exception as e:
        logger.error("Extraction failed: %s", e)
        return _fallback_empty_fields()

def _fallback_empty_fields() -> dict:
    return {
        "full_name": {"value": None, "confidence": 0.0},
        "monthly_income": {"value": None, "confidence": 0.0},
        "employment_type": {"value": None, "confidence": 0.0},
        "employer_name": {"value": None, "confidence": 0.0},
        "existing_emis": {"value": None, "confidence": 0.0},
        "loan_amount_requested": {"value": None, "confidence": 0.0},
        "declared_city": {"value": None, "confidence": 0.0}
    }
