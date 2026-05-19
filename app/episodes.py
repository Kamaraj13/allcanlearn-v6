# episodes.py — DB-backed episode storage (SQLite via SQLAlchemy)
# All public function signatures are IDENTICAL to the old flat-file version
# so nothing else in the codebase needs to change.

import os
import json
import logging
from datetime import datetime
from typing import List, Optional
from pathlib import Path

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.db_models import Episode, Turn
from app.config import settings

logger = logging.getLogger(__name__)

TTS_OUTPUT_DIR = settings.TTS_OUTPUT_DIR


# ─────────────────────────────────────────────
# Internal helper — gives a short-lived session
# ─────────────────────────────────────────────

def _session() -> Session:
    return SessionLocal()


# ─────────────────────────────────────────────
# Public API  (same signatures as before)
# ─────────────────────────────────────────────

def add_episode(topic: str, turns: list) -> str:
    """
    Save a new episode (topic + turns) to the database.
    Returns the episode_id string.
    """
    episode_id = str(int(datetime.now().timestamp() * 1000))

    db = _session()
    try:
        episode = Episode(
            id          = episode_id,
            topic       = topic,
            created_at  = datetime.utcnow(),
            status      = "ready",
            turns_count = len(turns),
        )
        db.add(episode)

        for idx, turn in enumerate(turns):
            audio_file = turn.get("tts")  # just the filename (or None)
            db_turn = Turn(
                episode_id = episode_id,
                turn_index = idx,
                speaker    = turn.get("speaker", "Unknown"),
                message    = turn.get("message", ""),
                audio_file = audio_file,
            )
            db.add(db_turn)

        db.commit()
        logger.info(f"Episode saved to DB: {episode_id} — {topic}")
        return episode_id

    except Exception as e:
        db.rollback()
        logger.error(f"Failed to save episode: {e}", exc_info=True)
        raise
    finally:
        db.close()


def get_episode(episode_id: str) -> Optional[dict]:
    """
    Get full episode data (including all turns) by ID.
    Returns a dict the frontend can consume directly, or None if not found.
    """
    db = _session()
    try:
        episode = db.query(Episode).filter(Episode.id == episode_id).first()
        if not episode:
            return None
        return episode.to_full_dict()
    finally:
        db.close()


def get_all_episodes() -> List[dict]:
    """
    Get all episodes sorted newest-first, deduplicated by topic.
    Returns lightweight summary dicts (no turn text).
    """
    db = _session()
    try:
        episodes = (
            db.query(Episode)
            .order_by(Episode.created_at.desc())
            .all()
        )

        # Deduplicate by topic — keep the newest per topic that has audio
        best_by_topic: dict[str, Episode] = {}
        for ep in episodes:
            topic = ep.topic or "Unknown"
            current = best_by_topic.get(topic)
            if not current:
                best_by_topic[topic] = ep
                continue
            # Prefer the one that has audio files
            ep_audio = sum(1 for t in ep.turns if t.audio_file)
            cur_audio = sum(1 for t in current.turns if t.audio_file)
            if ep_audio > 0 and cur_audio == 0:
                best_by_topic[topic] = ep

        # Re-sort and return
        deduped = []
        seen = set()
        for ep in episodes:
            topic = ep.topic or "Unknown"
            if topic in seen:
                continue
            if best_by_topic.get(topic) is ep:
                deduped.append(ep.to_summary_dict())
                seen.add(topic)

        return deduped
    finally:
        db.close()


def get_audio_files() -> List[dict]:
    """List all audio files currently on disk in tts_output/."""
    files = []
    if os.path.exists(TTS_OUTPUT_DIR):
        for f in os.listdir(TTS_OUTPUT_DIR):
            filepath = os.path.join(TTS_OUTPUT_DIR, f)
            if os.path.isfile(filepath):
                files.append({
                    "name":    f,
                    "path":    filepath,
                    "size":    os.path.getsize(filepath),
                    "created": datetime.fromtimestamp(os.path.getctime(filepath)).isoformat()
                })
    return sorted(files, key=lambda x: x["created"], reverse=True)


# ─────────────────────────────────────────────
# One-time migration from old flat files → DB
# ─────────────────────────────────────────────

def migrate_from_json():
    """
    Import any episodes from the old episodes.json + episodes_data/*.json
    into the new SQLite database.  Safe to run multiple times — skips IDs
    that already exist.
    """
    db = _session()
    migrated = 0

    try:
        # --- 1. Load full episode data from episodes_data/ first ---
        episodes_data_dir = Path("episodes_data")
        full_episodes: dict[str, dict] = {}

        if episodes_data_dir.exists():
            for json_file in episodes_data_dir.glob("*.json"):
                try:
                    data = json.loads(json_file.read_text())
                    ep_id = data.get("id") or json_file.stem
                    full_episodes[ep_id] = data
                except Exception as e:
                    logger.warning(f"Skipping {json_file}: {e}")

        # --- 2. Load metadata index ---
        meta_episodes: dict[str, dict] = {}
        meta_file = Path("episodes.json")
        if meta_file.exists():
            try:
                meta_episodes = json.loads(meta_file.read_text())
            except Exception as e:
                logger.warning(f"Could not read episodes.json: {e}")

        # Merge: full data takes priority over metadata-only
        all_ids = set(full_episodes) | set(meta_episodes)

        for ep_id in all_ids:
            # Skip if already in DB
            if db.query(Episode).filter(Episode.id == ep_id).first():
                continue

            data = full_episodes.get(ep_id) or meta_episodes.get(ep_id, {})
            topic = data.get("topic", "Unknown Topic")
            turns_raw = data.get("turns", [])

            # Parse created_at
            created_at = datetime.utcnow()
            ca_str = data.get("created_at")
            if ca_str:
                try:
                    created_at = datetime.fromisoformat(ca_str)
                except Exception:
                    pass

            episode = Episode(
                id          = ep_id,
                topic       = topic,
                created_at  = created_at,
                status      = "ready",
                turns_count = len(turns_raw),
            )
            db.add(episode)

            for idx, turn in enumerate(turns_raw):
                db.add(Turn(
                    episode_id = ep_id,
                    turn_index = idx,
                    speaker    = turn.get("speaker", "Unknown"),
                    message    = turn.get("message", ""),
                    audio_file = turn.get("tts"),
                ))

            migrated += 1

        db.commit()
        if migrated:
            logger.info(f"Migrated {migrated} episode(s) from flat files → SQLite")
        return migrated

    except Exception as e:
        db.rollback()
        logger.error(f"Migration error: {e}", exc_info=True)
        return 0
    finally:
        db.close()
