"""
Test registration - JSON version
"""
import requests
import json
import time

BASE_URL = "http://localhost:8000"

print("="*70)
print("TESTING REGISTRATION WITH AVATAR")
print("="*70)

# Test with JSON
print("\n1. Testing registration with JSON payload...")
timestamp = int(time.time())
payload = {
    "username": f"testuser_{timestamp}",
    "name": "Test User",
    "company_email": f"test_{timestamp}@company.com",
    "personal_email": f"test_{timestamp}@gmail.com",
    "password": "Password@123"
}

print(f"   Sending payload: {json.dumps(payload, indent=2)}")

try:
    r = requests.post(f"{BASE_URL}/register", json=payload, timeout=5)
    print(f"\n   Status: {r.status_code}")
    if r.status_code == 200:
        user = r.json()
        print(f"   ✓ User created: {user.get('username')}")
        print(f"   ✓ Email: {user.get('company_email')}")
        avatar = user.get('profile_photo')
        print(f"   ✓ Avatar: {avatar}")
        if avatar:
            print(f"   ✓ Avatar generated successfully!")
    else:
        print(f"   Error: {r.json()}")
except Exception as e:
    print(f"   ERROR: {e}")

# Check if avatar was created
print("\n2. Checking avatars directory...")
from pathlib import Path
avatars_dir = Path("avatars")
if avatars_dir.exists():
    files = list(avatars_dir.glob("*"))
    print(f"   ✓ Directory exists with {len(files)} file(s)")
    if files:
        for f in sorted(files)[-1:]:
            print(f"     Latest: {f.name}")
else:
    print(f"   ✗ Directory not found!")

print("\n" + "="*70)
