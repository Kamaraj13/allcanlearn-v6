# tts_client.py — macOS TTS using Groq PlayAI voices
# High-quality multi-voice TTS for the 4 roundtable characters.

import os
import time
import logging
from groq import Groq
from app.config import settings

logger = logging.getLogger(__name__)

# Orpheus voice tags — distinct voices for each character
# canopylabs/orpheus-v1-english supports these tags in the text
VOICE_MAP = {
    "en-us":   "tara",      # The Expert — clear American female
    "en-gb":   "leo",       # The Skeptic — British male
    "en-au":   "stella",    # The Optimist — warm female
    "default": "dan",       # The Pragmatist — casual male
    "en-in":   "mia",
    "en-ca":   "jess",
}

TTS_MODEL = "canopylabs/orpheus-v1-english"

def _get_voice(accent: str) -> str:
    """Return the best Orpheus voice for the given accent string."""
    if not accent:
        return VOICE_MAP["default"]
    key = accent.lower().strip()
    return VOICE_MAP.get(key, VOICE_MAP["default"])


async def speak_text(text: str, accent: str, folder: str = "tts_output") -> str | None:
    """
    Generate speech audio using Groq PlayAI TTS.
    Returns the filename (e.g. '1716123456789.wav') or None on failure.
    """
    if not settings.GROQ_API_KEY:
        logger.warning("GROQ_API_KEY not set — skipping TTS")
        return None

    os.makedirs(folder, exist_ok=True)

    voice     = _get_voice(accent)
    timestamp = int(time.time() * 1000)
    filename  = f"{timestamp}.wav"
    filepath  = os.path.join(folder, filename)

    try:
        client   = Groq(api_key=settings.GROQ_API_KEY)
        response = client.audio.speech.create(
            model=TTS_MODEL,
            voice=voice,
            input=text,
            response_format="wav",
        )
        response.write_to_file(filepath)
        logger.info(f"TTS generated: {filename} (voice={voice}, accent={accent})")
        return filename

    except Exception as e:
        logger.error(f"Groq TTS failed (voice={voice}): {e}")

        # Fallback: macOS built-in `say` command (browser-compatible LEI16 WAV)
        try:
            import subprocess
            say_voices = {
                "en-us": "Samantha",
                "en-gb": "Daniel",
                "en-au": "Karen",
                "default": "Alex",
            }
            say_voice = say_voices.get(accent.lower().strip() if accent else "default", "Alex")
            # LEI16 = 16-bit PCM, universally supported by browsers
            cmd = ["say", "-v", say_voice, "-o", filepath,
                   "--data-format=LEI16@22050", text]
            result = subprocess.run(cmd, capture_output=True, timeout=30)
            if result.returncode == 0 and os.path.exists(filepath):
                logger.info(f"TTS fallback (say): {filename}")
                return filename
        except Exception as fallback_err:
            logger.error(f"macOS say fallback also failed: {fallback_err}")

        return None
