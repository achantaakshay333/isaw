from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings

# Configuration for production connection pooling
if settings.SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        settings.SQLALCHEMY_DATABASE_URL, 
        connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(
        settings.SQLALCHEMY_DATABASE_URL,
        pool_pre_ping=True,      # Verify connection health before use
        pool_size=10,            # Maintain 10 connections
        max_overflow=20,         # Allow up to 20 additional surge connections
        pool_recycle=3600,       # Recycle connections every hour
    )
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
