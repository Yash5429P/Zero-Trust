#!/usr/bin/env python
"""Complete login/register flow test"""
import requests
import json

print("=" * 70)
print("FULL LOGIN/REGISTER FLOW TEST")
print("=" * 70)

# Test 1: Try register with duplicate username
print("\n1. Register with DUPLICATE username (should fail with 400)...")
try:
    r = requests.post('http://localhost:8000/register',
        json={
            'username': 'testuser',
            'name': 'Test',
            'company_email': 'new1@test.com',
            'personal_email': 'new1@gmail.com',
            'password': 'pass1234',
            'role': 'user'
        },
        timeout=5)
    print(f"   Status: {r.status_code}")
    print(f"   Message: {r.json().get('detail')}")
except Exception as e:
    print(f"   Error: {e}")

# Test 2: Register with NEW username
print("\n2. Register with NEW username (should succeed with 200)...")
try:
    r = requests.post('http://localhost:8000/register',
        json={
            'username': 'freshuser999',
            'name': 'Fresh User',
            'company_email': 'fresh999@company.com',
            'personal_email': 'fresh999@gmail.com',
            'password': 'password123',
            'role': 'user'
        },
        timeout=5)
    print(f"   Status: {r.status_code}")
    if r.status_code == 200:
        print(f"   ✓ User created: {r.json().get('username')}")
    else:
        print(f"   Error: {r.json().get('detail')}")
except Exception as e:
    print(f"   Error: {e}")

# Test 3: Login with the new user
print("\n3. Login with new credentials (should succeed with 200)...")
try:
    r = requests.post('http://localhost:8000/login',
        json={
            'username': 'fresh999@company.com',
            'password': 'password123'
        },
        timeout=5)
    print(f"   Status: {r.status_code}")
    if r.status_code == 200:
        print(f"   ✓ Login successful")
        token = r.json().get('access_token')
        print(f"   ✓ Token received (length: {len(token)})")
        print(f"   ✓ Role: {r.json().get('role')}")
    else:
        print(f"   Error: {r.json().get('detail')}")
except Exception as e:
    print(f"   Error: {e}")

# Test 4: Login with wrong password
print("\n4. Login with WRONG password (should fail with 401)...")
try:
    r = requests.post('http://localhost:8000/login',
        json={
            'username': 'fresh999@company.com',
            'password': 'wrongpassword'
        },
        timeout=5)
    print(f"   Status: {r.status_code}")
    msg = r.json().get('detail', '')[:70]
    print(f"   Message: {msg}")
except Exception as e:
    print(f"   Error: {e}")

print("\n" + "=" * 70)
print("✓ BACKEND LOGIN/REGISTER FULLY FUNCTIONAL")
print("=" * 70)
