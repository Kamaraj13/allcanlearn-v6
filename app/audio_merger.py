# audio_merger.py — merge all turn audio files into one continuous episode file
# Uses ffmpeg (pre-installed on Ubuntu). Falls back gracefully if not available.

from __future__ import annotations
import os
import shutil
import subprocess
import tempfile
import logging

logger = logging.getLogger(__name__)

# Common install locations, checked when PATH doesn't have ffmpeg.
# The systemd unit used to set PATH to the venv only, which made a perfectly
# well-installed /usr/bin/ffmpeg invisible and silently broke every merge.
# Resolving the binary ourselves means the app no longer depends on the
# service file being right.
_FFMPEG_FALLBACKS = (
    "/usr/bin/ffmpeg",
    "/usr/local/bin/ffmpeg",
    "/opt/homebrew/bin/ffmpeg",
    "/snap/bin/ffmpeg",
)


def find_ffmpeg() -> str | None:
    """Absolute path to ffmpeg, or None if it genuinely isn't installed."""
    found = shutil.which("ffmpeg")
    if found:
        return found
    for path in _FFMPEG_FALLBACKS:
        if os.path.exists(path) and os.access(path, os.X_OK):
            return path
    return None


def merge_turn_files(turn_files: list[str], output_path: str) -> bool:
    """
    Concatenate a list of audio file paths into one file using ffmpeg.

    Args:
        turn_files:  Absolute paths to each turn's audio file (WAV or MP3), in order.
        output_path: Where to write the merged file (e.g. tts_output/episode_123.wav)

    Returns:
        True on success, False on failure.
    """
    # Filter to files that actually exist
    existing = [f for f in turn_files if os.path.exists(f)]
    if not existing:
        logger.warning("merge_turn_files: no valid audio files to merge")
        return False

    # If only one file, just copy it
    if len(existing) == 1:
        import shutil
        shutil.copy2(existing[0], output_path)
        return True

    ffmpeg = find_ffmpeg()
    if not ffmpeg:
        logger.error(
            "ffmpeg not found — episode audio cannot be merged, so playback "
            "falls back to one file per turn. Install with: sudo apt install ffmpeg"
        )
        return False

    # Write an ffmpeg concat list
    try:
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            for path in existing:
                # ffmpeg requires forward slashes and escaped paths
                safe = path.replace("'", r"'\''")
                f.write(f"file '{safe}'\n")
            list_path = f.name

        result = subprocess.run(
            [
                ffmpeg, '-y',
                '-f', 'concat',
                '-safe', '0',
                '-i', list_path,
                # Re-encode to a single uniform PCM stream. `-c copy` produced a
                # file whose header described only the first segment, so players
                # showed the wrong duration and often stopped after one turn.
                '-c:a', 'pcm_s16le',
                '-ar', '24000',
                '-ac', '1',
                output_path,
            ],
            capture_output=True,
            text=True,
            timeout=120,
        )

        if result.returncode != 0:
            logger.error(f"ffmpeg merge failed:\n{result.stderr}")
            return False

        logger.info(f"Merged {len(existing)} files → {output_path}")
        return True

    except FileNotFoundError:
        logger.error("ffmpeg not found — install with: sudo apt install ffmpeg")
        return False
    except Exception as e:
        logger.error(f"merge_turn_files error: {e}", exc_info=True)
        return False
    finally:
        try:
            os.unlink(list_path)
        except Exception:
            pass


def merge_episode(episode_id: str, turns: list, tts_dir: str = "tts_output") -> str | None:
    """
    Build the merged audio file for a complete episode.

    Args:
        episode_id: Used to name the output file.
        turns:      List of turn dicts — each must have a 'tts' key (filename).
        tts_dir:    Directory where individual turn files are stored.

    Returns:
        The filename of the merged file (e.g. "episode_123456.wav"),
        or None if merge failed.
    """
    # Collect audio file paths in turn order
    turn_files = []
    for turn in turns:
        fname = turn.get("tts")
        if fname:
            full_path = os.path.join(tts_dir, fname)
            turn_files.append(full_path)

    if not turn_files:
        logger.warning(f"Episode {episode_id}: no audio files to merge")
        return None

    output_filename = f"episode_{episode_id}.wav"
    output_path = os.path.join(tts_dir, output_filename)

    success = merge_turn_files(turn_files, output_path)
    return output_filename if success else None
