from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .routers import auth, habits, schedule, learning, tasks, insights, tracking, notes
from .core.database import engine, Base
from sqlalchemy import text
import logging

# Setup basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create tables (for simplicity, usually use Alembic)
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, you can restrict this to your actual domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

@app.on_event("startup")
async def startup_event():
    """Verify database connection and create tables on startup."""
    try:
        # 1. Test the connection
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        logger.info("✅ Database connection test successful on Railway!")
        
        # 2. Automatically create tables
        Base.metadata.create_all(bind=engine)
        logger.info("✅ Database tables verified/created successfully.")
        
    except Exception as e:
        logger.error(f"❌ DATABASE CONNECTION FAILED: {str(e)}")

app.include_router(auth.router)
app.include_router(habits.router)
app.include_router(schedule.router)
app.include_router(learning.router)
app.include_router(tasks.router)
app.include_router(insights.router)
app.include_router(tracking.router)
app.include_router(notes.router)

@app.get("/")
def read_root():
    return {"message": "Success! ISAW Backend is Online", "status": "online"}

@app.get("/test-db")
def test_db_connectivity():
    """Explicit endpoint to verify DB access from Railway."""
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {"status": "connected", "message": "Database is reachable from Railway"}
    except Exception as e:
        logger.error(f"Test-DB failed: {str(e)}")
        return {"status": "failed", "error": str(e)}

@app.get("/health")
def health_check():
    """Standard health check for monitoring."""
    return {"status": "alive"}

if __name__ == "__main__":
    import os
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port)
