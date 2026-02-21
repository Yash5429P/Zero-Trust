from database import Base, engine
from models import User, Session, Log, Device, LockUnlockRequest, Telemetry
import sqlalchemy as sa

print('='*70)
print('DATABASE SCHEMA ANALYSIS')
print('='*70)

inspector = sa.inspect(engine)
tables = inspector.get_table_names()
print(f'\nTables in database: {tables}\n')

for table_name in tables:
    print(f'TABLE: {table_name}')
    columns = inspector.get_columns(table_name)
    for col in columns:
        nullable = 'NULL' if col['nullable'] else 'NOT NULL'
        print(f'  - {col["name"]}: {col["type"]} ({nullable})')
    print()

# Check for data
print('='*70)
print('DATA VERIFICATION')
print('='*70)

from database import SessionLocal

db = SessionLocal()

user_count = db.query(User).count()
session_count = db.query(Session).count()
log_count = db.query(Log).count()
device_count = db.query(Device).count()
request_count = db.query(LockUnlockRequest).count()
telemetry_count = db.query(Telemetry).count()

print(f'\nUsers: {user_count}')
print(f'Sessions: {session_count}')
print(f'Logs: {log_count}')
print(f'Devices: {device_count}')
print(f'Lock/Unlock Requests: {request_count}')
print(f'Telemetry: {telemetry_count}')

# Show superadmin if exists
superadmin = db.query(User).filter(User.role == 'superadmin').first()
if superadmin:
    print(f'\nSuperAdmin found: {superadmin.username} ({superadmin.company_email})')
else:
    print('\n⚠️  No superadmin found in database!')

db.close()
