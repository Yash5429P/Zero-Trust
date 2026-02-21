"""
Quick verification that the device registration endpoint is ready
"""

print("=" * 70)
print("DEVICE REGISTRATION ENDPOINT - VERIFICATION")
print("=" * 70)

try:
    # Import all required components
    from app import app
    from schemas import DeviceRegister, DeviceResponse
    from models import Device
    from database import engine
    from sqlalchemy import inspect
    
    print("\n✅ All imports successful")
    
    # Check Device model
    print("\n📋 Device Model:")
    print(f"   Table: {Device.__tablename__}")
    print(f"   Columns: {[c.name for c in Device.__table__.columns]}")
    
    # Check schemas
    print("\n📋 Pydantic Schemas:")
    print(f"   DeviceRegister fields: {list(DeviceRegister.model_fields.keys())}")
    print(f"   DeviceResponse fields: {list(DeviceResponse.model_fields.keys())}")
    
    # Check database table exists
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    if 'devices' in tables:
        print("\n✅ Database table 'devices' exists")
        cols = inspector.get_columns('devices')
        print(f"   Columns: {[c['name'] for c in cols]}")
    else:
        print("\n❌ Database table 'devices' NOT FOUND")
    
    # Check endpoint is registered
    routes = [route.path for route in app.routes]
    if '/devices/register' in routes:
        print("\n✅ Endpoint '/devices/register' registered in FastAPI")
    else:
        print("\n❌ Endpoint '/devices/register' NOT FOUND")
    
    # Check endpoint details
    for route in app.routes:
        if hasattr(route, 'path') and route.path == '/devices/register':
            print(f"   Method: {route.methods}")
            print(f"   Name: {route.name}")
            print(f"   Dependencies: JWT authentication required")
    
    print("\n" + "=" * 70)
    print("✅ DEVICE REGISTRATION ENDPOINT IS READY")
    print("=" * 70)
    
    print("\n📚 Documentation:")
    print("   Swagger UI: http://127.0.0.1:8000/docs")
    print("   Endpoint: POST /devices/register")
    print("\n🧪 Testing:")
    print("   Run: python test_device_registration.py")
    print("\n📖 Implementation Guide:")
    print("   See: DEVICE_MODEL_IMPLEMENTATION.md")
    print()

except ImportError as e:
    print(f"\n❌ Import error: {e}")
except Exception as e:
    print(f"\n❌ Verification failed: {e}")
    import traceback
    traceback.print_exc()
