# config.py — single source of truth for all app settings
# Every path, limit, and secret is read from .env (with sane defaults).
# Import `settings` anywhere in the app instead of scattering os.getenv() calls.

import os
from dotenv import load_dotenv

load_dotenv()


class Settings:

    # ── API Keys ──────────────────────────────────────────────
    GROQ_API_KEY: str       = os.getenv("GROQ_API_KEY", "")

    # ── Server ────────────────────────────────────────────────
    HOST: str               = os.getenv("HOST", "0.0.0.0")
    PORT: int               = int(os.getenv("PORT", "8000"))
    ENV: str                = os.getenv("ENV", "production")

    @property
    def is_dev(self) -> bool:
        return self.ENV == "development"

    # ── Database ──────────────────────────────────────────────
    DATABASE_URL: str       = os.getenv("DATABASE_URL", "sqlite:///allcanlearn.db")

    # ── Storage Paths ─────────────────────────────────────────
    TTS_OUTPUT_DIR: str     = os.getenv("TTS_OUTPUT_DIR", "tts_output")
    EPISODES_DATA_DIR: str  = os.getenv("EPISODES_DATA_DIR", "episodes_data")
    MAX_AUDIO_FILES: int    = int(os.getenv("MAX_AUDIO_FILES", "500"))

    # ── Episode Generation ────────────────────────────────────
    MAX_TURNS: int          = int(os.getenv("MAX_TURNS", "8"))
    MAX_ESSENTIAL_TURNS: int = int(os.getenv("MAX_ESSENTIAL_TURNS", "16"))
    TTS_ENABLED: bool       = os.getenv("TTS_ENABLED", "true").lower() == "true"

    # ── Cloudflare ────────────────────────────────────────────
    TUNNEL_ID: str          = os.getenv("TUNNEL_ID", "")
    DOMAIN: str             = os.getenv("DOMAIN", "allcanlearn.uk")

    # ── Future: Google OAuth ──────────────────────────────────
    GOOGLE_CLIENT_ID: str   = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    SESSION_SECRET: str     = os.getenv("SESSION_SECRET", "change-me-in-production")


# Single shared instance — import this everywhere
settings = Settings()
