"""
Database Migration: Add Lock/Unlock Request Approval System
This creates the lock_unlock_requests table for admin request approval workflow
"""

from sqlalchemy import create_engine, text
from database import DATABASE_URL, engine
import os

def migrate():
    print("=" * 70)
    print("MIGRATION: Adding Lock/Unlock Request Approval System")
    print("=" * 70)
    
    conn = engine.connect()
    
    try:
        # Create lock_unlock_requests table
        print("\n1. Creating lock_unlock_requests table...")
        
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS lock_unlock_requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                requested_by_id INTEGER NOT NULL,
                action VARCHAR NOT NULL,
                reason TEXT,
                risk_score FLOAT,
                user_details TEXT,
                status VARCHAR DEFAULT 'pending' NOT NULL,
                reviewed_by_id INTEGER,
                reviewed_at TIMESTAMP,
                review_comment TEXT,
                created_at TIMESTAMP NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (requested_by_id) REFERENCES users(id),
                FOREIGN KEY (reviewed_by_id) REFERENCES users(id)
            )
        """))
        conn.commit()
        print("   ✓ lock_unlock_requests table created")
        
        # Create indexes for better performance
        print("\n2. Creating indexes...")
        
        indexes = [
            ("idx_lock_requests_user", "lock_unlock_requests", "user_id"),
            ("idx_lock_requests_requester", "lock_unlock_requests", "requested_by_id"),
            ("idx_lock_requests_status", "lock_unlock_requests", "status"),
            ("idx_lock_requests_created", "lock_unlock_requests", "created_at"),
        ]
        
        for idx_name, table, column in indexes:
            try:
                conn.execute(text(f"CREATE INDEX IF NOT EXISTS {idx_name} ON {table}({column})"))
                print(f"   ✓ Created index: {idx_name}")
            except Exception as e:
                print(f"   ⚠ Index {idx_name} may already exist: {str(e)}")
        
        conn.commit()
        
        print("\n" + "=" * 70)
        print("✓ Migration completed successfully!")
        print("=" * 70)
        print("\nNew features:")
        print("  • Admins can request to lock/unlock users")
        print("  • Requests are sent to superadmin for approval")
        print("  • Risk scores and user details included in requests")
        print("  • Superadmin can approve/reject with comments")
        print("\nNext steps:")
        print("  1. Restart the backend server")
        print("  2. Login as admin to access 'User Management'")
        print("  3. Login as superadmin to access 'Pending Requests'")
        print("=" * 70)
        
    except Exception as e:
        conn.rollback()
        print(f"\n❌ Migration failed: {str(e)}")
        print("\nTroubleshooting:")
        print("  • Check if the database is locked (close all connections)")
        print("  • Ensure you have write permissions")
        print("  • Verify the database file exists")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
