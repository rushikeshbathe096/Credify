// types/index.ts

// ─── Agent State Machine ───────────────────────────────────
export type AgentState = "intro" | "income" | "documents" | "assets" | "close";

// ─── Offer & Explanation ───────────────────────────────────
export interface Reason {
  factor: string;
  impact: "positive" | "negative" | "neutral";
  detail: string;
  confidence_label: string;
}

export interface OfferPayload {
  approved: boolean;
  principal: number;
  rate_pct: number;
  tenure_months: number;
  emi: number;
  risk_score: number;
  risk_band: string;
  reasons: Reason[];
}

// ─── Session ───────────────────────────────────────────────
export interface Session {
  session_id: string;
  status: string;
  created_at: string;
}

// ─── Server-Sent Event Types ──────────────────────────────
export type VeloxEvent =
  | { type: "transcript";    session_id: string; payload: { text: string; is_final: boolean } }
  | { type: "agent_token";   session_id: string; payload: { token: string; done: boolean } }
  | { type: "state_change";  session_id: string; payload: { state: AgentState } }
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  | { type: "field_update";  session_id: string; payload: { field: string; value: any; confidence: number } }
  | { type: "doc_verified";  session_id: string; payload: { fields: Record<string, string> } }
  | { type: "offer";         session_id: string; payload: OfferPayload }
  | { type: "error";         session_id: string; payload: { message: string } };
