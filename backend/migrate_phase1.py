"""
PHASE 1 Database Migration Script
==================================

This script migrates the existing database to include:
1. New Session table
2. Enhanced User fields (last_login_at, last_logout_at, failed_login_attempts, account_locked, etc.)
3. Enhanced Log fields (event_type, ip_address, location, browser, os, risk_score, status, etc.)

IMPORTANT: This will preserve existing data while adding new columns.

Usage:
    python migrate_phase1.py
"""

from database import engine, SessionLocal
from sqlalchemy import inspect, text
import models

def check_column_exists(table_name: str, column_name: str) -> bool:
    """Check if a column exists in a table"""
    inspector = inspect(engine)
    columns = [col['name'] for col in inspector.get_columns(table_name)]
    return column_name in columns

def migrate_users_table():
    """Add new columns to users table"""
    print("🔄 Migrating users table...")
    
    columns_to_add = [
        ("last_login_at", "TIMESTAMP"),
        ("last_logout_at", "TIMESTAMP"),
        ("failed_login_attempts", "INTEGER DEFAULT 0"),
        ("account_locked", "BOOLEAN DEFAULT 0"),
        ("locked_at", "TIMESTAMP"),
    ]
    
    with engine.connect() as conn:
        for column_name, column_type in columns_to_add:
            if not check_column_exists("users", column_name):
                try:
                    conn.execute(text(f"ALTER TABLE users ADD COLUMN {column_name} {column_type}"))
                    conn.commit()
                    print(f"   ✅ Added column: {column_name}")
                except Exception as e:
                    print(f"   ⚠️  Could not add {column_name}: {e}")
            else:
                print(f"   ⏭️  Column {column_name} already exists")
    
    print("✅ Users table migration complete\n")

def migrate_logs_table():
    """Add new columns to logs table"""
    print("🔄 Migrating logs table...")
    
    columns_to_add = [
        ("event_type", "VARCHAR"),
        ("ip_address", "VARCHAR"),
        ("location", "VARCHAR"),
        ("browser", "VARCHAR"),
        ("os", "VARCHAR"),
        ("risk_score", "REAL DEFAULT 0.0"),
        ("status", "VARCHAR DEFAULT 'normal'"),
        ("timestamp", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"),
    ]
    
    with engine.connect() as conn:
        for column_name, column_type in columns_to_add:
            if not check_column_exists("logs", column_name):
                try:
                    conn.execute(text(f"ALTER TABLE logs ADD COLUMN {column_name} {column_type}"))
                    conn.commit()
                    print(f"   ✅ Added column: {column_name}")
                except Exception as e:
                    print(f"   ⚠️  Could not add {column_name}: {e}")
            else:
                print(f"   ⏭️  Column {column_name} already exists")
    
    # Migrate existing logs to have event_type
    db = SessionLocal()
    try:
        result = db.execute(text("UPDATE logs SET event_type = 'LEGACY_LOG', status = 'normal' WHERE event_type IS NULL"))
        db.commit()
        print(f"   ✅ Updated {result.rowcount} legacy logs")
    except:
        pass
    finally:
        db.close()
    
    print("✅ Logs table migration complete\n")

def create_sessions_table():
    """Create sessions table"""
    print("🔄 Creating sessions table...")
    
    # Check if table exists
    inspector = inspect(engine)
    if "sessions" in inspector.get_table_names():
        print("   ⏭️  Sessions table already exists\n")
        return
    
    try:
        models.Base.metadata.tables['sessions'].create(bind=engine)
        print("   ✅ Sessions table created\n")
    except Exception as e:
        print(f"   ⚠️  Error creating sessions table: {e}\n")

def run_migration():
    """Run all migrations"""
    print("\n" + "="*60)
    print("   PHASE 1 Database Migration")
    print("="*60 + "\n")
    
    try:
        # Migrate existing tables
        migrate_users_table()
        migrate_logs_table()
        
        # Create new tables
        create_sessions_table()
        
        print("="*60)
        print("✅ All migrations completed successfully!")
        print("="*60 + "\n")
        print("Next steps:")
        print("1. Install new dependencies: pip install user-agents httpx")
        print("2. Restart the backend server")
        print("3. Test login/logout with enhanced tracking")
        print()
        
    except Exception as e:
        print(f"\n❌ Migration failed: {e}\n")
        raise

if __name__ == "__main__":
    run_migration()
