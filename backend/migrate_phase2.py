"""
PHASE 2 Database Migration Script
==================================

Adds Phase 2 fields:
- users.last_login_country
- users.login_ip_history

Usage:
    python migrate_phase2.py
"""

from sqlalchemy import inspect, text
from database import engine


def check_column_exists(table_name: str, column_name: str) -> bool:
    inspector = inspect(engine)
    columns = [col["name"] for col in inspector.get_columns(table_name)]
    return column_name in columns


def add_user_columns():
    print("\nMigrating users table for Phase 2...")
    columns_to_add = [
        ("last_login_country", "VARCHAR"),
        ("login_ip_history", "TEXT"),
    ]

    with engine.connect() as conn:
        for column_name, column_type in columns_to_add:
            if not check_column_exists("users", column_name):
                conn.execute(text(f"ALTER TABLE users ADD COLUMN {column_name} {column_type}"))
                conn.commit()
                print(f"  ✅ Added column: {column_name}")
            else:
                print(f"  ⏭️  Column already exists: {column_name}")


def run_migration():
    print("=" * 60)
    print("PHASE 2 Database Migration")
    print("=" * 60)
    add_user_columns()
    print("\n✅ Phase 2 migration complete.\n")


if __name__ == "__main__":
    run_migration()
