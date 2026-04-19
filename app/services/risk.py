# app/services/risk.py
import logging

logger = logging.getLogger(__name__)

def compute_risk(fields: dict, doc_verified: bool) -> dict:
    """
    Compute risk score based on extracted fields.
    Score: 0.0 (Lowest risk) to 1.0 (Highest risk).
    """
    reasons = []
    
    # Base risk starts in the middle
    risk_score = 0.5
    
    # 1. Income parsing
    income_data = fields.get("monthly_income", {})
    income = float(income_data.get("value") or 0)
    income_conf = float(income_data.get("confidence") or 0.0)

    # 2. Existing EMIs parsing
    emis_data = fields.get("existing_emis", {})
    emis = float(emis_data.get("value") or 0)
    
    # --- Rule 1: Income ---
    if income < 15000:
        risk_score += 0.3
        reasons.append({"factor": "Income", "impact": "negative", "detail": f"Monthly income (₹{int(income)}) is below standard threshold.", "confidence": income_conf})
    elif 15000 <= income <= 40000:
        risk_score -= 0.1
        reasons.append({"factor": "Income", "impact": "neutral", "detail": f"Monthly income (₹{int(income)}) is moderate.", "confidence": income_conf})
    else:
        risk_score -= 0.25
        reasons.append({"factor": "Income", "impact": "positive", "detail": f"Strong monthly income (₹{int(income)}).", "confidence": income_conf})
        
    # --- Rule 2: FOIR (Fixed Obligation to Income Ratio) ---
    if income > 0:
        foir = emis / income
        if foir > 0.5:
            risk_score += 0.4
            reasons.append({"factor": "EMI Burden", "impact": "negative", "detail": f"Existing obligations (₹{int(emis)}) exceed 50% of income.", "confidence": emis_data.get("confidence", 0.0)})
        else:
            risk_score -= 0.1
            reasons.append({"factor": "EMI Burden", "impact": "positive", "detail": f"Acceptable existing obligation ratio ({foir:.0%}).", "confidence": emis_data.get("confidence", 0.0)})
    elif emis > 0:
        # EMIs but no income -> very risky
        risk_score += 0.5
        reasons.append({"factor": "EMI Burden", "impact": "negative", "detail": "Existing obligations but no verified income.", "confidence": emis_data.get("confidence", 0.0)})

    # --- Rule 3: Aadhaar Verification ---
    if doc_verified:
        risk_score -= 0.1
        reasons.append({"factor": "Identity", "impact": "positive", "detail": "Aadhaar verified successfully.", "confidence": 1.0})
    else:
        risk_score += 0.2
        reasons.append({"factor": "Identity", "impact": "negative", "detail": "Aadhaar verification missing or failed.", "confidence": 1.0})

    # --- Rule 4: Low Confidence Penalty ---
    confidences = [
        float(v.get("confidence", 0.0)) for k, v in fields.items() 
        if isinstance(v, dict) and "confidence" in v and v.get("value") is not None
    ]
    avg_conf = sum(confidences) / len(confidences) if confidences else 0.0
    if avg_conf < 0.6:
        risk_score += 0.2
        reasons.append({"factor": "Conversation Clarity", "impact": "negative", "detail": "Responses were vague or unclear; high inferred data.", "confidence": avg_conf})
    elif avg_conf > 0.8:
        risk_score -= 0.1

    # Clamp risk score between 0.0 and 1.0
    risk_score = max(0.0, min(1.0, risk_score))

    # Determine Decision
    if risk_score >= 0.7:
        decision = "Reject"
    elif risk_score >= 0.4:
        decision = "Review"
    else:
        decision = "Approve"

    # Edge case: always reject if income is truly 0 despite Aadhaar
    if income == 0:
        decision = "Reject"
        risk_score = 1.0

    return {
        "score": round(risk_score, 3),
        "decision": decision,
        "reasons": reasons
    }

def generate_offer(fields: dict, risk: dict) -> dict:
    """
    Generate accurate loan offer based on the computed risk metrics.
    """
    decision = risk["decision"]
    risk_score = risk["score"]
    
    if decision == "Reject":
        return {
            "principal": 0,
            "rate": 0,
            "emi": 0,
            "tenure": 0,
            "status": "Rejected"
        }

    income_data = fields.get("monthly_income", {})
    income = float(income_data.get("value") or 0)
    
    # Determine risk tier
    if risk_score < 0.4:  # low risk
        multiplier = 24
        rate = 10.5
    elif risk_score < 0.7: # medium risk
        multiplier = 20
        rate = 12.5
    else: # high risk (unlikely to reach here due to rejection, but just in case)
        multiplier = 16
        rate = 14.5

    # Loan cap calculation
    requested_data = fields.get("loan_amount_requested", {})
    requested = float(requested_data.get("value") or 0)
    
    max_loan_from_income = income * multiplier
    principal = min(max_loan_from_income, 5000000.0) # Cap at 50L
    
    # If they requested a specific amount, and we can offer it, don't force max limit on them.
    # We offer the smaller of what they requested or what they can afford, but provide at least *something* if requested is 0.
    if requested > 0:
        principal = min(principal, requested)
        
    tenure_months = 24

    if principal <= 0:
        return {
            "principal": 0, "rate": 0, "emi": 0, "tenure": 0, "status": "Rejected"
        }

    # EMI Calculation: E = P * r * (1+r)^n / ((1+r)^n - 1)
    # Target EMI: 17.5% of monthly income
    target_emi = 0.175 * income
    monthly_rate = (rate / 100.0) / 12.0
    
    import math
    
    if principal > 0 and target_emi > principal * monthly_rate:
        # n = log(E / (E - P*r)) / log(1 + r)
        k = target_emi / (principal * monthly_rate)
        tenure_months = math.log(k / (k - 1)) / math.log(1 + monthly_rate)
        tenure_months = int(round(tenure_months))
        
        # Clamp tenure between 6 and 84 months (typical loan terms)
        if tenure_months > 84:
            tenure_months = 84
        elif tenure_months < 6:
            tenure_months = 6
            
        # Recalculate EMI based on fixed tenure to be precise
        power = (1 + monthly_rate) ** tenure_months
        emi = principal * monthly_rate * power / (power - 1)
    elif principal > 0:
        # If target EMI is too low, reduce principal or max out tenure
        tenure_months = 84
        power = (1 + monthly_rate) ** tenure_months
        # Principal they can afford at target_emi for max tenure
        affordable_principal = target_emi * (power - 1) / (monthly_rate * power)
        principal = min(principal, affordable_principal)
        emi = target_emi
    else:
        emi = 0
        tenure_months = 0

    return {
        "principal": int(principal),
        "rate": rate,
        "emi": int(emi),
        "tenure": int(tenure_months),
        "status": "Approved" if decision == "Approve" else "Under Review"
    }
