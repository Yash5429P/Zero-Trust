"""Quick script to verify the devices table structure"""
from sqlalchemy import create_engine, inspect
from database import DATABASE_URL

engine = create_engine(DATABASE_URL)
inspector = inspect(engine)

print("=" * 60)
print("DEVICES TABLE VERIFICATION")
print("=" * 60)

tables = inspector.get_table_names()
print(f"\nAll tables: {', '.join(tables)}")

if 'devices' not in tables:
    print("\n❌ devices table NOT FOUND!")
else:
    print("\n✅ devices table EXISTS")
    
    print("\n📋 Column schema:")
    cols = inspector.get_columns('devices')
    for col in cols:
        nullable = "NULL" if col["nullable"] else "NOT NULL"
        print(f"  {col['name']:20} {str(col['type']):15} {nullable}")
    
    print("\n🔍 Indexes:")
    idxs = inspector.get_indexes('devices')
    for idx in idxs:
        cols_str = ", ".join(idx["column_names"])
        unique = "UNIQUE " if idx["unique"] else ""
        print(f"  {unique}({cols_str})")
    
    print("\n🔗 Foreign keys:")
    fks = inspector.get_foreign_keys('devices')
    for fk in fks:
        print(f"  {fk['constrained_columns']} -> {fk['referred_table']}.{fk['referred_columns']}")
    
    # Count records
    from sqlalchemy import text
    with engine.connect() as conn:
        result = conn.execute(text("SELECT COUNT(*) FROM devices"))
        count = result.scalar()
        print(f"\n📊 Total devices: {count}")

print("\n" + "=" * 60)
