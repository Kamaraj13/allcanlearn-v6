# database.py — SQLAlchemy engine, session, and base

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

DB_PATH = settings.DATABASE_URL

engine = create_engine(
    DB_PATH,
    connect_args={"check_same_thread": False},  # needed for SQLite + FastAPI
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency that provides a DB session and closes it after use."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables if they don't exist yet."""
    from app.db_models import Episode, Turn  # noqa: F401 — registers models
    Base.metadata.create_all(bind=engine)
