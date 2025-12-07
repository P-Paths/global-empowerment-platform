from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Create async engine with proper driver handling
if settings.DATABASE_URL.startswith("sqlite"):
    # Use aiosqlite for SQLite async support
    # Ensure absolute path for SQLite
    import os
    db_path = settings.DATABASE_URL.replace("sqlite:///", "")
    # Remove ./ prefix if present
    if db_path.startswith("./"):
        db_path = db_path[2:]
    
    if not os.path.isabs(db_path):
        # Relative path - make it absolute based on backend directory
        # __file__ is backend/app/core/database.py, so go up 3 levels to get backend/
        backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        db_path = os.path.join(backend_dir, db_path)
    
    # Normalize path and ensure directory exists
    db_path = os.path.normpath(db_path)
    db_dir = os.path.dirname(db_path)
    if db_dir:
        os.makedirs(db_dir, exist_ok=True)
    
    async_database_url = f"sqlite+aiosqlite:///{db_path}"
    sync_database_url = f"sqlite:///{db_path}"
    logger.info(f"Using SQLite database at: {db_path}")
else:
    # Use asyncpg for PostgreSQL
    async_database_url = settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
    sync_database_url = settings.DATABASE_URL

# Async engine
async_engine = create_async_engine(
    async_database_url,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_recycle=300
)

# Sync engine
sync_engine = create_engine(
    sync_database_url,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_recycle=300
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Create sync session factory (with error handling)
try:
    SessionLocal = sessionmaker(
        bind=sync_engine,
        expire_on_commit=False
    )
except Exception as e:
    logger.warning(f"Failed to create database session factory: {e}. App will run without database.")
    SessionLocal = None

# Create base class for models
Base = declarative_base()


async def get_db() -> AsyncSession:
    """Dependency to get async database session"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception as e:
            logger.error(f"Database session error: {e}")
            await session.rollback()
            raise
        finally:
            await session.close()


def get_sync_db():
    """Dependency to get synchronous database session"""
    if SessionLocal is None:
        # Database not configured - yield None so endpoint can still work
        yield None
        return
    
    db = None
    try:
        db = SessionLocal()
        yield db
    except Exception as e:
        error_msg = str(e) if str(e) else f"Database error: {type(e).__name__}"
        logger.warning(f"Database session error (non-fatal): {error_msg}")
        # Don't fail if database isn't configured - allow app to run without DB
        if db:
            try:
                db.rollback()
            except:
                pass
        # Yield None instead of raising - endpoint can work without DB
        yield None
    finally:
        if db:
            try:
                db.close()
            except:
                pass


async def init_db():
    """Initialize database tables"""
    try:
        async with async_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise


async def close_db():
    """Close database connections"""
    await async_engine.dispose()
    sync_engine.dispose()
    logger.info("Database connections closed") 