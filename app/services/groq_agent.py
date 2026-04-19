# app/services/groq_agent.py
import re
import json
import logging
from groq import AsyncGroq
from app.config import settings

logger = logging.getLogger(__name__)

STATES = ["lang_selection", "intro", "income", "documents", "assets", "close"]

SYSTEM_PROMPTS: dict[str, str] = {
    "lang_selection": (
        "You are Credify, a friendly AI loan officer.\n"
        "Your first task is language selection. You already greeted them.\n"
        "If the user has chosen Hindi or English, acknowledge their choice shortly and output EXACTLY: [STATE:intro]\n"
        "If they haven't chosen, politely ask if they prefer Hindi or English.\n"
        "Rules: Max 20 words. Once they choose, output [STATE:intro] immediately."
    ),
    "intro": (
        "You are Credify, a friendly AI loan officer.\n"
        "Your job in this stage:\n"
        "1. Ask for their full legal name.\n"
        "2. Once they give their name, ask for consent to record and proceed.\n"
        "Rules:\n"
        "- STRICTLY ask ONE question at a time. Do NOT ask for consent until they provide their name.\n"
        "- Wait for the user to answer before asking the next question.\n"
        "- Max 30 words per response.\n"
        "- Once you have BOTH name and consent, output EXACTLY: [STATE:income]"
    ),
    "income": (
        "You are Credify. You are now collecting income details. You must ask these ONE by ONE sequentially:\n"
        "1. Monthly income.\n"
        "2. Only after knowing income, ask Employment type (salaried/business).\n"
        "3. Only after knowing employment type, ask Employer or business name.\n"
        "Rules:\n"
        "- STRICTLY ask ONLY ONE question in a response.\n"
        "- Max 30 words per response. Wait for the user's answer.\n"
        "- Once you have ALL three, output EXACTLY: [STATE:documents]"
    ),
    "documents": (
        "You are Credify. We are verifying the user's Aadhaar.\n"
        "Rules:\n"
        "- The system will pop up an Aadhaar scanner on their screen.\n"
        "- Just say: 'Please show your Aadhaar card to the camera so we can scan it automatically.' and do not ask any further questions.\n"
        "- When the user finishes, you will receive a SYSTEM message: 'Aadhaar verified successfully'.\n"
        "- The MOMENT you receive that system message, output EXACTLY: [STATE:assets] and say 'Thank you, Aadhaar is verified.'"
    ),
    "assets": (
        "You are Credify. You are collecting asset/liability info. Ask ONE by ONE sequentially:\n"
        "1. Any existing EMIs or loans?\n"
        "2. Only after knowing EMIs, ask Monthly expenses estimate.\n"
        "3. Only after knowing expenses, ask Desired loan amount.\n"
        "Rules:\n"
        "- STRICTLY ask ONLY ONE question in a response.\n"
        "- Max 30 words per response.\n"
        "- Once you have all absolute info, output EXACTLY: [STATE:close]"
    ),
    "close": (
        "You are Credify. The interview is wrapping up.\n"
        "1. Confirm the loan amount the user requested.\n"
        "2. Tell them their personalized offer will appear on screen shortly.\n"
        "3. Thank them for their time.\n"
        "Rules:\n"
        "- Max 40 words.\n"
        "- Do NOT output any [STATE:...] tag."
    ),
}

STATE_TRANSITION_RE = re.compile(r"\[STATE:(\w+)\]")


class AgentFSM:
    """Finite-state-machine agent powered by Groq Llama-3.3-70B."""

    def __init__(self, session_id: str) -> None:
        self.session_id = session_id
        self.state: str = "lang_selection"
        self.history: list[dict[str, str]] = []
        self._client = AsyncGroq(api_key=settings.GROQ_API_KEY)

    async def get_opening(self) -> str:
        """Return the opening greeting (no LLM call needed)."""
        opening = "Welcome to Credify! Would you prefer to continue this conversation in English or Hindi?"
        self.history.append({"role": "assistant", "content": opening})
        return opening

    async def turn(self, user_text: str, ws) -> None:  # noqa: ANN001
        """Process one user turn: stream Groq response token-by-token over WebSocket."""
        self.history.append({"role": "user", "content": user_text})

        messages = [
            {"role": "system", "content": SYSTEM_PROMPTS[self.state]},
            *self.history,
        ]

        full_response = ""

        try:
            stream = await self._client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                stream=True,
                max_tokens=150,
                temperature=0.4,
            )

            async for chunk in stream:
                delta = chunk.choices[0].delta
                if delta and delta.content:
                    token = delta.content
                    full_response += token
                    await ws.send_json({
                        "type": "agent_token",
                        "session_id": self.session_id,
                        "payload": {"token": token, "done": False},
                    })

            # Send done signal
            await ws.send_json({
                "type": "agent_token",
                "session_id": self.session_id,
                "payload": {"token": "", "done": True},
            })

        except Exception as e:
            logger.error("Groq streaming error for session %s: %s", self.session_id, e)
            await ws.send_json({
                "type": "error",
                "session_id": self.session_id,
                "payload": {"message": f"AI error: {str(e)}"},
            })
            return

        # Store full response in history
        self.history.append({"role": "assistant", "content": full_response})

        # Check for state transition
        await self._check_transition(full_response, ws)

    async def _check_transition(self, response: str, ws) -> None:  # noqa: ANN001
        """Detect [STATE:xyz] in agent response and transition."""
        match = STATE_TRANSITION_RE.search(response)
        if match:
            new_state = match.group(1)
            if new_state in STATES and new_state != self.state:
                old_state = self.state
                self.state = new_state
                logger.info(
                    "Session %s: state %s → %s",
                    self.session_id, old_state, new_state,
                )
                await ws.send_json({
                    "type": "state_change",
                    "session_id": self.session_id,
                    "payload": {"state": new_state},
                })
                
                # Auto-trigger the AI to speak the first question of the new phase
                # so the user doesn't have to face awkward silence.
                if new_state not in ["close"]:
                    import asyncio
                    # Schedule it almost instantly to hide the transition gap
                    asyncio.create_task(self.turn("SYSTEM: State changed successfully. Greet/acknowledge briefly if needed, then IMMEDIATELY ask the very first question/action of this new stage.", ws))
