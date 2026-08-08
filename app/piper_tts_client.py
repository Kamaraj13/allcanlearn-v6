# piper_tts_client.py — platform router for TTS.
#
# Groq Orpheus is the primary engine on BOTH macOS and Linux: it is the only
# path that gives each panellist a distinct, natural voice. Local Piper is used
# only when Groq is unavailable (no key / offline), and it now uses a different
# voice model per speaker instead of one model for everyone.

import os
import shutil
import logging
import subprocess
import time

logger = logging.getLogger(__name__)

PIPER_BIN = os.path.expanduser("~/piper/piper")
PIPER_DIR = os.path.expanduser("~/piper")

# One model per recurring speaker so the panel is distinguishable.
# Missing models fall back to DEFAULT_MODEL (logged once per speaker).
PIPER_SPEAKER_MODELS = {
    "The Expert":     "en_US-lessac-medium.onnx",
    "The Skeptic":    "en_GB-alan-medium.onnx",
    "The Optimist":   "en_US-amy-medium.onnx",
    "The Pragmatist": "en_US-ryan-high.onnx",
    "Moderator":      "en_US-lessac-medium.onnx",
}
DEFAULT_MODEL = "en_US-lessac-medium.onnx"

_warned_models: set[str] = set()


def _piper_model_for(speaker: str | None) -> str | None:
    """Absolute path to the best available Piper model for this speaker."""
    wanted = PIPER_SPEAKER_MODELS.get(speaker or "", DEFAULT_MODEL)
    path = os.path.join(PIPER_DIR, wanted)
    if os.path.exists(path):
        return path

    if wanted not in _warned_models:
        _warned_models.add(wanted)
        logger.warning(
            f"Piper model {wanted} not found in {PIPER_DIR} — using {DEFAULT_MODEL}. "
            f"All speakers will sound alike until it is downloaded."
        )
    fallback = os.path.join(PIPER_DIR, DEFAULT_MODEL)
    return fallback if os.path.exists(fallback) else None


async def speak_text(text, accent, folder="tts_output", speaker=None):
    """Generate one audio file for a turn. Returns filename or None."""
    os.makedirs(folder, exist_ok=True)

    # 1. Preferred: Groq Orpheus (distinct natural voices, both platforms).
    from app.tts_client import speak_text as groq_speak
    filename = await groq_speak(text, accent, folder, speaker=speaker)
    if filename:
        return filename

    # 2. Local Piper, if installed.
    if not os.path.exists(PIPER_BIN):
        logger.error("Groq TTS unavailable and Piper is not installed — no audio for this turn")
        return None

    model = _piper_model_for(speaker)
    if not model:
        logger.error(f"No Piper voice models found in {PIPER_DIR} — no audio for this turn")
        return None

    wav_filename = f"{int(time.time() * 1000)}.wav"
    wav_filepath = os.path.join(folder, wav_filename)

    try:
        # Text goes in via stdin, NOT `echo "..." | piper`. The old shell form
        # broke on any apostrophe or quote in the dialogue and was injectable.
        result = subprocess.run(
            [PIPER_BIN, "--model", model, "--output_file", wav_filepath],
            input=text,
            capture_output=True,
            text=True,
            timeout=30,
        )
        if result.returncode == 0 and os.path.exists(wav_filepath):
            logger.info(f"Piper TTS ok: {wav_filename} (model={os.path.basename(model)})")
            return wav_filename

        logger.error(f"Piper TTS failed (rc={result.returncode}): {result.stderr.strip()[:300]}")
        return None

    except Exception as e:
        logger.error(f"Piper TTS error: {e}")
        return None


def diagnose() -> dict:
    """Report what the TTS stack can actually do here. Used by /api/tts/health."""
    from app.config import settings
    models = {}
    for spk, m in PIPER_SPEAKER_MODELS.items():
        models[spk] = os.path.exists(os.path.join(PIPER_DIR, m))
    from app.audio_merger import find_ffmpeg
    ffmpeg = find_ffmpeg()
    return {
        "groq_key_set":  bool(settings.GROQ_API_KEY),
        "piper_installed": os.path.exists(PIPER_BIN),
        "piper_models":  models,
        "ffmpeg":        ffmpeg or False,
        "ffmpeg_on_path": shutil.which("ffmpeg") is not None,
    }
