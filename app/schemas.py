from enum import Enum
from typing import Any, Literal, Union

from pydantic import BaseModel


class AgentState(str, Enum):
    INTRO = "intro"
    INCOME = "income"
    EMPLOYMENT = "employment"
    DOCUMENTS = "documents"
    ASSETS = "assets"
    CLOSE = "close"


class AadhaarFields(BaseModel):
    name: str | None = None
    dob: str | None = None
    gender: str | None = None
    address: str | None = None
    last_four: str | None = None


class OfferPayload(BaseModel):
    amount: int
    interest_rate: float
    tenure_months: int
    reasons: list[str]


# ---------------------------------------------------------
# Event Payloads
# ---------------------------------------------------------

class TranscriptPayload(BaseModel):
    text: str
    is_final: bool


class AgentTokenPayload(BaseModel):
    token: str
    done: bool


class StateChangePayload(BaseModel):
    state: AgentState


class FieldUpdatePayload(BaseModel):
    field: str
    value: Any
    confidence: float


class DocVerifiedPayload(BaseModel):
    fields: AadhaarFields


class FraudSignalPayload(BaseModel):
    signal: str
    triggered: bool


class ErrorPayload(BaseModel):
    message: str


# ---------------------------------------------------------
# Event Envelopes
# ---------------------------------------------------------

class BaseEvent(BaseModel):
    session_id: str


class TranscriptEvent(BaseEvent):
    type: Literal["transcript"] = "transcript"
    payload: TranscriptPayload


class AgentTokenEvent(BaseEvent):
    type: Literal["agent_token"] = "agent_token"
    payload: AgentTokenPayload


class StateChangeEvent(BaseEvent):
    type: Literal["state_change"] = "state_change"
    payload: StateChangePayload


class FieldUpdateEvent(BaseEvent):
    type: Literal["field_update"] = "field_update"
    payload: FieldUpdatePayload


class DocVerifiedEvent(BaseEvent):
    type: Literal["doc_verified"] = "doc_verified"
    payload: DocVerifiedPayload


class FraudSignalEvent(BaseEvent):
    type: Literal["fraud_signal"] = "fraud_signal"
    payload: FraudSignalPayload


class OfferEvent(BaseEvent):
    type: Literal["offer"] = "offer"
    payload: OfferPayload


class ErrorEvent(BaseEvent):
    type: Literal["error"] = "error"
    payload: ErrorPayload


# ---------------------------------------------------------
# Union Type for Generic Event Handling
# ---------------------------------------------------------

VeloxEvent = Union[
    TranscriptEvent,
    AgentTokenEvent,
    StateChangeEvent,
    FieldUpdateEvent,
    DocVerifiedEvent,
    FraudSignalEvent,
    OfferEvent,
    ErrorEvent
]
