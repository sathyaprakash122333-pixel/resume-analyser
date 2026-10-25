import logging
import uuid
from typing import Generator
from sqlalchemy import (
    create_engine, 
    text, 
    Column, 
    Text, 
    SmallInteger, 
    DateTime, 
    ForeignKey,
    func
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.core.config import settings

logger = logging.getLogger("database")

Base = declarative_base()


# =====================================================================
# Existing Supabase Database Schema Models (public schema)
# =====================================================================

class UserProfile(Base):
    __tablename__ = "user_profiles"

    firebase_uid = Column(Text, primary_key=True, index=True)
    display_name = Column(Text, nullable=True)
    email = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class CareerTarget(Base):
    __tablename__ = "career_targets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    firebase_uid = Column(Text, ForeignKey("user_profiles.firebase_uid"), nullable=False, index=True)
    target_role = Column(Text, nullable=False)
    target_company = Column(Text, nullable=True)
    target_type = Column(Text, nullable=False, default="job")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class ResumeScoreHistory(Base):
    __tablename__ = "resume_score_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    firebase_uid = Column(Text, ForeignKey("user_profiles.firebase_uid"), nullable=False, index=True)
    career_target_id = Column(UUID(as_uuid=True), ForeignKey("career_targets.id"), nullable=True)
    analysis_type = Column(Text, nullable=False, default="general")
    overall_score = Column(SmallInteger, nullable=False)
    skills_score = Column(SmallInteger, nullable=False)
    experience_score = Column(SmallInteger, nullable=False)
    content_score = Column(SmallInteger, nullable=False)
    structure_score = Column(SmallInteger, nullable=False)
    completeness_score = Column(SmallInteger, nullable=False)
    analyzed_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


# =====================================================================
# Connection Management & Session Pool
# =====================================================================

_engine = None
_SessionFactory = None


def get_engine():
    global _engine
    if _engine is None:
        url = settings.db_connection_url
        if not url:
            logger.warning("Database connection URL is not configured. Database queries will fail until configured.")
            return None
        _engine = create_engine(
            url,
            pool_size=5,
            max_overflow=10,
            pool_pre_ping=True,
            pool_recycle=300,
            connect_args={"connect_timeout": 10}
        )
    return _engine


def get_session_factory():
    global _SessionFactory
    if _SessionFactory is None:
        eng = get_engine()
        if eng:
            _SessionFactory = sessionmaker(autocommit=False, autoflush=False, bind=eng)
    return _SessionFactory


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency yielding a SQLAlchemy session.
    """
    factory = get_session_factory()
    if not factory:
        raise RuntimeError("Database connection is not configured on the server.")
    db = factory()
    try:
        yield db
    finally:
        db.close()


def check_db_connection() -> bool:
    """
    Verifies live connectivity to Supabase PostgreSQL with a minimal SELECT 1 query.
    """
    eng = get_engine()
    if not eng:
        return False
    try:
        with eng.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception as e:
        logger.error("Database connectivity check failed: %s", e)
        return False
