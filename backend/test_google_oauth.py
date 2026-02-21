#!/usr/bin/env python
"""
Test Google OAuth endpoint configuration
"""
import requests
import json
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

def test_backend_config():
    """Test if backend is properly configured for Google OAuth"""
    print("\n" + "="*70)
    print("GOOGLE OAUTH BACKEND VERIFICATION")
    print("="*70)
    
    # Test 1: Check environment variables
    print("\n1. CHECKING ENVIRONMENT CONFIGURATION...")
    from dotenv import load_dotenv
    import os
    load_dotenv()
    
    google_client_id = os.getenv("GOOGLE_CLIENT_ID")
    google_client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    
    if google_client_id:
        print(f"   ✓ GOOGLE_CLIENT_ID: {google_client_id[:30]}...")
    else:
        print("   ✗ GOOGLE_CLIENT_ID: NOT SET")
    
    if google_client_secret:
        print(f"   ✓ GOOGLE_CLIENT_SECRET: Set (hidden)")
    else:
        print("   ✗ GOOGLE_CLIENT_SECRET: NOT SET")
    
    # Test 2: Check if backend is running
    print("\n2. CHECKING IF BACKEND IS RUNNING...")
    try:
        r = requests.get("http://127.0.0.1:8000/health", timeout=2)
        if r.status_code == 200:
            print("   ✓ Backend is running on http://127.0.0.1:8000")
        else:
            print(f"   ? Backend responded with status {r.status_code}")
    except requests.exceptions.ConnectionError:
        print("   ✗ Backend is NOT running on http://127.0.0.1:8000")
        print("      Start backend with: cd backend && python app.py")
        return False
    except Exception as e:
        print(f"   ? Error: {e}")
        return False
    
    # Test 3: Test login endpoint structure
    print("\n3. CHECKING /LOGIN/GOOGLE ENDPOINT...")
    try:
        # This should fail with "Invalid Google token" which is expected
        test_token = "invalid_token_for_testing"
        r = requests.post(
            "http://127.0.0.1:8000/login/google",
            json={"token": test_token},
            timeout=5
        )
        
        if r.status_code == 401:
            response = r.json()
            if "Invalid Google token" in response.get("detail", ""):
                print("   ✓ Endpoint is responding correctly")
                print(f"      Response: {response['detail'][:60]}...")
            else:
                print(f"   ✓ Endpoint exists, response: {response}")
        elif r.status_code == 422:
            print("   ? Endpoint validation error (check request format)")
            print(f"      Response: {r.json()}")
        else:
            print(f"   ? Endpoint returned status {r.status_code}")
            print(f"      Response: {r.text[:100]}")
    
    except requests.exceptions.ConnectionError:
        print("   ✗ Cannot reach /login/google endpoint")
    except Exception as e:
        print(f"   ✗ Error testing endpoint: {e}")
    
    # Test 4: Verify imports work
    print("\n4. CHECKING BACKEND IMPORTS...")
    try:
        from google_oauth import verify_google_token
        from auth import verify_password, create_access_token
        from models import User
        from database import SessionLocal
        print("   ✓ All imports successful")
    except Exception as e:
        print(f"   ✗ Import error: {e}")
        return False
    
    print("\n" + "="*70)
    print("VERIFICATION COMPLETE")
    print("="*70)
    print("\nNEXT STEPS:")
    print("1. Ensure backend is running: python app.py")
    print("2. Check browser console for response from /login/google endpoint")
    print("3. Look for error messages in backend console")
    print("4. Try the 'Sign in with Google' button again")
    
    return True

if __name__ == "__main__":
    test_backend_config()
