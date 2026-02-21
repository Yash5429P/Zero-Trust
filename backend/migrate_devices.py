"""
Migration script to add the devices table to existing database.
Run this after updating models.py with the Device model.
"""

from sqlalchemy import create_engine, inspect
from database import DATABASE_URL, Base
from models import User, Session, Log, LockUnlockRequest, Device
import os

def migrate_devices_table():
    """Add devices table to the database"""
    
    print("=" * 60)
    print("DEVICE TABLE MIGRATION")
    print("=" * 60)
    
    # Create engine
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
    )
    
    # Check if database exists
    if "sqlite" in DATABASE_URL:
        db_path = DATABASE_URL.replace("sqlite:///", "").replace("sqlite:///.", ".")
        if not os.path.exists(db_path):
            print(f"❌ Database file not found: {db_path}")
            print("Run create_db.py first to initialize the database.")
            return False
    
    # Get inspector
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    
    print(f"\n📊 Existing tables: {', '.join(existing_tables)}")
    
    # Check if devices table already exists
    if "devices" in existing_tables:
        print("\n⚠️  'devices' table already exists!")
        print("Migration not needed.")
        return True
    
    # Create only the devices table
    print("\n🔄 Creating 'devices' table...")
    try:
        Device.__table__.create(engine)
        print("✅ 'devices' table created successfully!")
        
        # Verify creation
        inspector = inspect(engine)
        if "devices" in inspector.get_table_names():
            print("\n✅ Migration completed successfully!")
            
            # Show table schema
            print("\n📋 Device table schema:")
            columns = inspector.get_columns("devices")
            for col in columns:
                nullable = "NULL" if col["nullable"] else "NOT NULL"
                default = f", default={col.get('default')}" if col.get("default") else ""
                print(f"  - {col['name']}: {col['type']} {nullable}{default}")
            
            # Show indexes
            indexes = inspector.get_indexes("devices")
            if indexes:
                print("\n🔍 Indexes:")
                for idx in indexes:
                    cols = ", ".join(idx["column_names"])
                    unique = "UNIQUE " if idx["unique"] else ""
                    print(f"  - {unique}index on ({cols})")
            
            return True
        else:
            print("❌ Table creation verification failed!")
            return False
            
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        return False

if __name__ == "__main__":
    success = migrate_devices_table()
    
    if success:
        print("\n" + "=" * 60)
        print("🎉 MIGRATION SUCCESSFUL")
        print("=" * 60)
        print("\nNext steps:")
        print("1. Verify the table: python check_db.py")
        print("2. Create device registration endpoint in app.py")
        print("3. Implement device trust scoring logic")
        print("4. Add device management to admin dashboard")
    else:
        print("\n" + "=" * 60)
        print("❌ MIGRATION FAILED")
        print("=" * 60)
        print("\nPlease check the error message above and try again.")
