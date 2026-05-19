# db_models.py — SQLAlchemy ORM models

from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Episode(Base):
    __tablename__ = "episodes"

    id          = Column(String, primary_key=True, index=True)
    topic       = Column(String, nullable=False)
    created_at  = Column(DateTime, default=datetime.utcnow)
    status      = Column(String, default="ready")   # generating | ready | failed
    turns_count = Column(Integer, default=0)
    is_essential = Column(Boolean, default=False)

    # Relationship — loads all turns for this episode
    turns = relationship("Turn", back_populates="episode", order_by="Turn.turn_index", cascade="all, delete-orphan")

    def to_summary_dict(self):
        """Lightweight dict for episode list views — no turn text."""
        audio_files = [
            f"/tts_output/{t.audio_file}"
            for t in self.turns
            if t.audio_file
        ]
        return {
            "id":          self.id,
            "topic":       self.topic,
            "created_at":  self.created_at.isoformat() if self.created_at else None,
            "turns_count": self.turns_count,
            "audio_files": audio_files,
            "status":      self.status,
        }

    def to_full_dict(self):
        """Full dict including all turn text and audio — for episode detail page."""
        return {
            "id":         self.id,
            "topic":      self.topic,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "turns_count": self.turns_count,
            "status":     self.status,
            "turns": [t.to_dict() for t in self.turns],
        }


class Turn(Base):
    __tablename__ = "turns"

    id          = Column(Integer, primary_key=True, autoincrement=True)
    episode_id  = Column(String, ForeignKey("episodes.id"), nullable=False, index=True)
    turn_index  = Column(Integer, nullable=False)
    speaker     = Column(String, nullable=False)
    message     = Column(Text, nullable=False)
    audio_file  = Column(String, nullable=True)   # just the filename, e.g. abc123.mp3

    episode = relationship("Episode", back_populates="turns")

    def to_dict(self):
        return {
            "speaker":    self.speaker,
            "message":    self.message,
            "tts":        self.audio_file,  # keep key as "tts" — frontend expects this
        }
