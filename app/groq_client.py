# groq_client.py

import asyncio
import logging
import httpx
from app.config import settings

logger = logging.getLogger(__name__)

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"


async def call_groq(messages, temperature=0.7, max_tokens=2048, json_mode=False,
                    model=None, _attempt=1):
    """
    Call the Groq chat API.

    Args:
        messages:    List of message dicts.
        temperature: Creativity level.
        max_tokens:  Response cap. Too low truncates mid-JSON and costs a whole
                     round of dialogue, so keep headroom.
        json_mode:   Constrain the model to emit syntactically valid JSON.
                     Without this, llama emits things like
                     {"speaker": "X", "chuckling", "message": "..."} — one
                     stray token that made json.loads throw and silently
                     discarded every turn in the round.
    """
    if not settings.GROQ_API_KEY:
        raise RuntimeError("GROQ_API_KEY not set")

    headers = {
        "Authorization": f"Bearer {settings.GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": model or settings.GROQ_MODEL,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    if json_mode:
        payload["response_format"] = {"type": "json_object"}

    try:
        async with httpx.AsyncClient(timeout=90) as client:
            res = await client.post(GROQ_URL, json=payload, headers=headers)
            res.raise_for_status()
            data = res.json()

        choice = data["choices"][0]
        if choice.get("finish_reason") == "length":
            logger.warning(
                "Groq response hit the max_tokens limit — the JSON is probably "
                "truncated and some turns will be salvaged or lost."
            )
        return choice["message"]["content"]

    except httpx.HTTPStatusError as e:
        if e.response.status_code == 429 and _attempt <= 3:
            wait = 2 * _attempt
            logger.warning(f"Groq rate limited, retrying in {wait}s (attempt {_attempt})")
            await asyncio.sleep(wait)
            return await call_groq(messages, temperature, max_tokens, json_mode,
                                   model, _attempt + 1)
        # Surface the real reason instead of retrying blindly with the same model.
        body = ""
        try:
            body = e.response.text[:300]
        except Exception:
            pass
        logger.error(f"Groq HTTP {e.response.status_code}: {body}")
        raise

    except Exception as e:
        logger.error(f"Groq request failed: {type(e).__name__}: {e}")
        raise
