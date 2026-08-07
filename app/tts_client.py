# tts_client.py — Groq Orpheus TTS
# One distinct voice per speaker so listeners can tell the panel apart.

import os
import re
import time
import logging
import platform
from groq import Groq
from app.config import settings

logger = logging.getLogger(__name__)

TTS_MODEL = "canopylabs/orpheus-v1-english"

# The ONLY voices this model accepts. Verified against the live API —
# sending anything else returns HTTP 400 and the turn ends up silent.
# (The old map used tara/leo/stella/dan/mia/jess: every one was rejected,
#  so 100% of episodes fell through to the robotic `say` fallback.)
VALID_VOICES = ["autumn", "diana", "hannah", "austin", "daniel", "troy"]

# Fixed casting for the recurring panel — keeps a character's voice stable
# across every episode.
SPEAKER_VOICES = {
    "The Expert":     "diana",
    "The Skeptic":    "daniel",
    "The Optimist":   "hannah",
    "The Pragmatist": "troy",
    "Moderator":      "austin",
}

# Rough accent hints for the older topic-specific character sets.
ACCENT_VOICES = {
    "en-us":   "autumn",
    "en-gb":   "daniel",
    "en-au":   "hannah",
    "en-in":   "diana",
    "en-ca":   "austin",
    "default": "troy",
}


def _voice_for(speaker: str | None, accent: str | None) -> str:
    """Pick a stable, distinct voice for a speaker."""
    if speaker and speaker in SPEAKER_VOICES:
        return SPEAKER_VOICES[speaker]

    # Unknown speaker (legacy character sets): hash the name so the same
    # character always gets the same voice, and different ones differ.
    if speaker:
        idx = sum(ord(c) for c in speaker) % len(VALID_VOICES)
        return VALID_VOICES[idx]

    if accent:
        return ACCENT_VOICES.get(accent.lower().strip(), ACCENT_VOICES["default"])
    return ACCENT_VOICES["default"]


def _clean_for_speech(text: str) -> str:
    """Strip markdown and stage directions the model sometimes emits.

    Orpheus reads '**' and '*sighs*' out loud, which is a big part of why
    generated turns sounded garbled.
    """
    text = re.sub(r"\*\*(.+?)\*\*", r"\1", text)      # bold
    text = re.sub(r"\*(.+?)\*", r"\1", text)          # italics / *actions*
    text = re.sub(r"`+", "", text)                     # code ticks
    text = re.sub(r"^\s*[-*]\s+", "", text, flags=re.M)  # bullets
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def _repair_wav_header(filepath: str) -> None:
    """Write real chunk sizes into a streamed WAV.

    Groq streams the response with placeholder sizes (0xFFFFFFFF) in both the
    RIFF and data chunk headers. Browsers then can't report duration or seek,
    and ffmpeg refuses to concat the files cleanly.
    """
    try:
        with open(filepath, "r+b") as f:
            data = f.read()
            if len(data) < 44 or data[:4] != b"RIFF":
                return
            idx = data.find(b"data")
            if idx == -1:
                return
            payload = len(data) - idx - 8
            f.seek(4)
            f.write((len(data) - 8).to_bytes(4, "little"))
            f.seek(idx + 4)
            f.write(payload.to_bytes(4, "little"))
    except Exception as e:
        logger.warning(f"WAV header repair failed for {filepath}: {e}")


async def speak_text(text: str, accent: str, folder: str = "tts_output",
                     speaker: str | None = None) -> str | None:
    """
    Generate speech with Groq Orpheus.
    Returns the filename (e.g. '1716123456789.wav') or None on failure.
    """
    if not settings.GROQ_API_KEY:
        logger.error("GROQ_API_KEY not set — no audio will be generated")
        return None

    os.makedirs(folder, exist_ok=True)

    spoken = _clean_for_speech(text)
    if not spoken:
        return None

    voice     = _voice_for(speaker, accent)
    timestamp = int(time.time() * 1000)
    filename  = f"{timestamp}.wav"
    filepath  = os.path.join(folder, filename)

    try:
        client   = Groq(api_key=settings.GROQ_API_KEY)
        response = client.audio.speech.create(
            model=TTS_MODEL,
            voice=voice,
            input=spoken,
            response_format="wav",
        )
        response.write_to_file(filepath)
        _repair_wav_header(filepath)
        logger.info(f"TTS ok: {filename} (voice={voice}, speaker={speaker})")
        return filename

    except Exception as e:
        # Loud on purpose — this used to fail silently for every single turn.
        logger.error(
            f"Groq TTS FAILED (voice={voice}, speaker={speaker}): {e} — "
            f"falling back to low-quality system voice"
        )
        return _system_voice_fallback(spoken, accent, filepath, filename)


def _system_voice_fallback(text: str, accent: str, filepath: str, filename: str) -> str | None:
    """Last resort: macOS `say`. Robotic — only used if Groq is unreachable."""
    if platform.system() != "Darwin":
        logger.error("No fallback TTS on this platform — turn will have no audio")
        return None

    try:
        import subprocess
        say_voices = {"en-us": "Samantha", "en-gb": "Daniel",
                      "en-au": "Karen", "default": "Alex"}
        say_voice = say_voices.get((accent or "").lower().strip(), "Alex")
        result = subprocess.run(
            ["say", "-v", say_voice, "-o", filepath,
             "--data-format=LEI16@22050", text],
            capture_output=True, timeout=30,
        )
        if result.returncode == 0 and os.path.exists(filepath):
            logger.warning(f"TTS fallback used (robotic `say` voice): {filename}")
            return filename
    except Exception as fallback_err:
        logger.error(f"macOS say fallback also failed: {fallback_err}")

    return None
