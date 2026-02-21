import sqlite3
import os
from datetime import datetime

def check_database():
    """Check database status and contents"""
    db_file = 'insider.db'
    
    if not os.path.exists(db_file):
        print(f"✗ Database file not found: {db_file}")
        print("  Please run: python create_db.py")
        return False
    
    print(f"✓ Database file found: {db_file}")
    print(f"  Size: {os.path.getsize(db_file)} bytes")
    print(f"  Modified: {datetime.fromtimestamp(os.path.getmtime(db_file))}\n")
    
    try:
        conn = sqlite3.connect(db_file)
        c = conn.cursor()
        
        # Check tables
        c.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        tables = c.fetchall()
        
        if tables:
            print("✓ Tables found:")
            for table in tables:
                table_name = table[0]
                c.execute(f"SELECT COUNT(*) FROM {table_name}")
                count = c.fetchone()[0]
                print(f"  • {table_name}: {count} records")
                
                # Show schema
                c.execute(f"PRAGMA table_info({table_name})")
                columns = c.fetchall()
                for col in columns:
                    col_id, col_name, col_type, notnull, default, pk = col
                    pk_marker = " (PRIMARY KEY)" if pk else ""
                    print(f"      - {col_name}: {col_type}{pk_marker}")
        else:
            print("✗ No tables found in database")
            return False
        
        conn.close()
        return True
        
    except sqlite3.Error as e:
        print(f"✗ Database error: {e}")
        return False

if __name__ == "__main__":
    print("="*60)
    print("DATABASE STATUS CHECK")
    print("="*60 + "\n")
    
    success = check_database()
    
    print("\n" + "="*60)
    if success:
        print("Database is properly configured ✓")
    else:
        print("Database setup is incomplete ✗")
    print("="*60)
