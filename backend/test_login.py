import urllib.request
import json
import sys

BASE_URL = "http://127.0.0.1:8000"

def test_home():
    """Test home endpoint"""
    print("\n" + "="*60)
    print("TEST 1: Home Endpoint")
    print("="*60)
    try:
        url = f"{BASE_URL}/"
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            print(f"✓ Status: {response.getcode()}")
            print(f"✓ Response: {data}")
            return True
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

def test_register():
    """Test user registration"""
    print("\n" + "="*60)
    print("TEST 2: User Registration")
    print("="*60)
    try:
        url = f"{BASE_URL}/register"
        user_data = {
            "username": "testyash",
            "name": "Test Yash",
            "company_email": "yash@company.com",
            "personal_email": "yash@personal.com",
            "password": "SecurePass123!",
            "role": "user"
        }
        
        data = json.dumps(user_data).encode('utf-8')
        req = urllib.request.Request(
            url,
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode())
            print(f"✓ Status: {response.getcode()}")
            print(f"✓ User registered: {result.get('username')}")
            return True
    except urllib.error.HTTPError as e:
        error_data = json.loads(e.read().decode())
        print(f"✗ Error ({e.code}): {error_data.get('detail')}")
        return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

def test_login():
    """Test user login"""
    print("\n" + "="*60)
    print("TEST 3: User Login")
    print("="*60)
    try:
        url = f"{BASE_URL}/login"
        credentials = {
            "username": "testyash",
            "password": "SecurePass123!"
        }
        
        data = json.dumps(credentials).encode('utf-8')
        req = urllib.request.Request(
            url,
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode())
            print(f"✓ Status: {response.getcode()}")
            print(f"✓ Login successful for: {result.get('username')}")
            print(f"✓ Role: {result.get('role')}")
            print(f"✓ Token: {result.get('access_token')[:20]}...")
            return result.get('access_token')
    except urllib.error.HTTPError as e:
        error_data = json.loads(e.read().decode())
        print(f"✗ Error ({e.code}): {error_data.get('detail')}")
        return None
    except Exception as e:
        print(f"✗ Error: {e}")
        return None

def test_profile(token):
    """Test protected profile endpoint"""
    print("\n" + "="*60)
    print("TEST 4: Protected Profile Endpoint")
    print("="*60)
    if not token:
        print("✗ No token available. Skipping test.")
        return False
    
    try:
        url = f"{BASE_URL}/profile"
        req = urllib.request.Request(
            url,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
        )
        
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode())
            print(f"✓ Status: {response.getcode()}")
            print(f"✓ User: {result.get('username')}")
            print(f"✓ Role: {result.get('role')}")
            print(f"✓ Email: {result.get('company_email')}")
            return True
    except urllib.error.HTTPError as e:
        error_data = json.loads(e.read().decode())
        print(f"✗ Error ({e.code}): {error_data.get('detail')}")
        return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

def test_invalid_token():
    """Test with invalid token"""
    print("\n" + "="*60)
    print("TEST 5: Invalid Token Test")
    print("="*60)
    try:
        url = f"{BASE_URL}/profile"
        req = urllib.request.Request(
            url,
            headers={
                "Authorization": "Bearer invalid_token_here",
                "Content-Type": "application/json"
            }
        )
        
        with urllib.request.urlopen(req) as response:
            print(f"✗ Should have failed with invalid token")
            return False
    except urllib.error.HTTPError as e:
        if e.code == 401:
            print(f"✓ Correctly rejected invalid token (Status: {e.code})")
            return True
        else:
            print(f"✗ Wrong error code: {e.code}")
            return False
    except Exception as e:
        print(f"✓ Correctly rejected (Error: {e})")
        return True

def main():
    """Run all tests"""
    print("\n" + "🔐 ZERO TRUST MONITORING SYSTEM - API TEST SUITE 🔐")
    
    results = {
        "home": test_home(),
        "register": test_register(),
        "login": None,
        "profile": None,
        "invalid_token": test_invalid_token()
    }
    
    token = test_login()
    results["login"] = token is not None
    
    if token:
        results["profile"] = test_profile(token)
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    print(f"✓ Passed: {passed}/{total}")
    
    for test_name, result in results.items():
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"  {test_name.ljust(20)}: {status}")
    
    print("\nNote: Make sure the backend server is running:")
    print("  python -m uvicorn app:app --reload")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nTests interrupted by user")
        sys.exit(0)
    except Exception as e:
        print(f"\nFatal error: {e}")
        sys.exit(1)
