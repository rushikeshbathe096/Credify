# app/services/groq_agent.py
import re
import json
import logging
from groq import AsyncGroq
from app.config import settings

logger = logging.getLogger(__name__)

STATES = ["intro", "income", "documents", "assets", "close"]

SYSTEM_PROMPTS: dict[str, str] = {
    "intro": (
        "You are Credify, a friendly AI loan officer conducting a video interview in Hindi/English mix. "
        "Your job in this stage:\n"
        "1. Greet the user warmly.\n"
        "2. Ask for their full legal name.\n"
        "3. Ask for their consent to proceed with the loan application.\n"
        "Rules:\n"
        "- Ask ONE question at a time. Wait for the user to answer before asking the next.\n"
        "- Keep every response under 40 words.\n"
        "- Once you have the name AND consent, output EXACTLY: [STATE:income]\n"
        "- Do NOT output [STATE:income] until you have BOTH name and consent."
    ),
    "income": (
        "You are Credify, a friendly AI loan officer. You are now collecting income details.\n"
        "Ask the following ONE at a time:\n"
        "1. Monthly income (in INR)\n"
        "2. Employment type (salaried / self-employed / business)\n"
        "3. Employer or business name\n"
        "Rules:\n"
        "- ONE question at a time. Max 40 words per response.\n"
        "- Once you have ALL three, output EXACTLY: [STATE:documents]\n"
        "- Do NOT output [STATE:documents] until all three are collected."
    ),
    "documents": (
        "You are Credify, a friendly AI loan officer. You are now in the document verification stage.\n"
        "Ask the user to hold up their Aadhaar card clearly in front of the camera.\n"
        "Rules:\n"
        "- Max 40 words.\n"
        "- Once the user confirms they have shown the document, output EXACTLY: [STATE:assets]"
    ),
    "assets": (
        "You are Credify, a friendly AI loan officer. You are now collecting asset and liability info.\n"
        "Ask the following ONE at a time:\n"
        "1. Any existing EMIs or loans (amount per month)\n"
        "2. Monthly expenses estimate\n"
        "3. Desired loan amount\n"
        "Rules:\n"
        "- ONE question at a time. Max 40 words per response.\n"
        "- Once you have all info, output EXACTLY: [STATE:close]"
    ),
    "close": (
        "You are Credify, a friendly AI loan officer. The interview is wrapping up.\n"
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
        self.state: str = "intro"
        self.history: list[dict[str, str]] = []
        self._client = AsyncGroq(api_key=settings.GROQ_API_KEY)

    async def get_opening(self) -> str:
        """Return the opening greeting (no LLM call needed)."""
        opening = "Namaste! Main Credify hoon, aapka AI loan officer. Aapka naam kya hai?"
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
            if new_state in STATES:
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
