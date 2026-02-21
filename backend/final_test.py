"""
Comprehensive system test after database recreation
"""
import requests
import json
from database import SessionLocal
from models import User

print('\n' + '='*80)
print('ZERO TRUST SYSTEM - FINAL COMPREHENSIVE TEST')
print('='*80)

# ============================================================================
# PART 1: DATABASE VERIFICATION
# ============================================================================
print('\n[1/4] DATABASE VERIFICATION')
print('-' * 80)

db = SessionLocal()

# Check all users
users = db.query(User).all()
print(f'\n✓ Total users in database: {len(users)}')
print('\nUser Details:')
print(f'  {"Username":<20} {"Email":<35} {"Role":<12}')
print('  ' + '-' * 67)
for user in users:
    print(f'  {user.username:<20} {user.company_email:<35} {user.role:<12}')

db.close()

# ============================================================================
# PART 2: AUTHENTICATION TESTS
# ============================================================================
print('\n[2/4] AUTHENTICATION TESTS')
print('-' * 80)

auth_tests = [
    ('superadmin@company.com', 'super@1234', 'SuperAdmin User'),
    ('admin@company.com', 'admin@1234', 'Admin User'),
    ('john.doe@company.com', 'test@1234', 'Regular User'),
    ('invalid@company.com', 'invalid', 'Invalid Credentials'),
]

successful_logins = 0
for email, password, description in auth_tests:
    try:
        response = requests.post('http://127.0.0.1:8000/login',
            json={'username': email, 'password': password},
            timeout=5
        )
        
        if 'invalid' not in description.lower():
            if response.status_code == 200:
                token = response.json().get('access_token')
                print(f'\n✓ {description:<20} Login SUCCESS')
                print(f'  Email: {email}')
                print(f'  Token: {token[:20]}...')
                successful_logins += 1
            else:
                print(f'\n✗ {description:<20} FAILED (Status: {response.status_code})')
                print(f'  Error: {response.json().get("detail", "Unknown error")}')
        else:
            if response.status_code != 200:
                print(f'\n✓ {description:<20} Correctly REJECTED')
                print(f'  Status: {response.status_code}')
            else:
                print(f'\n✗ {description:<20} Should have been rejected')
    except Exception as e:
        print(f'\n✗ {description:<20} Connection Error')
        print(f'  Error: {str(e)[:60]}')

# ============================================================================
# PART 3: SESSION PERSISTENCE
# ============================================================================
print('\n[3/4] SESSION PERSISTENCE TEST')
print('-' * 80)

try:
    # Login
    login_response = requests.post('http://127.0.0.1:8000/login',
        json={'username': 'superadmin@company.com', 'password': 'super@1234'},
        timeout=5
    )
    
    if login_response.status_code == 200:
        token = login_response.json()['access_token']
        headers = {'Authorization': f'Bearer {token}'}
        
        # Test multiple requests with same token
        test_endpoints = [
            ('/admin/users', 'Get Users'),
            ('/admin/logs', 'Get Logs'),
            ('/profile', 'Get Profile'),
        ]
        
        print('\nMaking consecutive requests with same session token...')
        all_passed = True
        for endpoint, description in test_endpoints:
            try:
                resp = requests.get(f'http://127.0.0.1:8000{endpoint}',
                    headers=headers,
                    timeout=5
                )
                if resp.status_code == 200:
                    print(f'  ✓ {description:<30} Status: {resp.status_code}')
                else:
                    print(f'  ✗ {description:<30} Status: {resp.status_code}')
                    all_passed = False
            except Exception as e:
                print(f'  ✗ {description:<30} Error: {str(e)[:30]}')
                all_passed = False
        
        if all_passed:
            print('\n✓ Session persists across consecutive requests')
        else:
            print('\n⚠  Some requests failed')
    else:
        print('✗ Could not log in for session test')
except Exception as e:
    print(f'✗ Session persistence test error: {str(e)[:60]}')

# ============================================================================
# PART 4: SYSTEM STATUS
# ============================================================================
print('\n[4/4] SYSTEM STATUS')
print('-' * 80)

services_status = []

# Check backend
try:
    resp = requests.get('http://127.0.0.1:8000/docs', timeout=3)
    services_status.append(('Backend API', '127.0.0.1:8000', resp.status_code == 200))
except:
    services_status.append(('Backend API', '127.0.0.1:8000', False))

# Check frontend
try:
    resp = requests.get('http://localhost:5173', timeout=3)
    services_status.append(('Frontend', 'localhost:5173', resp.status_code == 200))
except:
    services_status.append(('Frontend', 'localhost:5173', False))

print('\nService Status:')
for service, address, running in services_status:
    status = '✓ Running' if running else '✗ Not Running'
    print(f'  {service:<20} {address:<20} {status}')

print('\n' + '='*80)
print('TEST SUMMARY')
print('='*80)
print(f'✓ Successful logins: {successful_logins}/3')
print(f'✓ Database users: {len(users)}/5')
print(f'✓ Services running: {sum(1 for _, _, s in services_status if s)}/2')

if successful_logins == 3 and len(users) == 5 and all(s for _, _, s in services_status):
    print('\n✅ ALL TESTS PASSED - SYSTEM READY FOR PRODUCTION')
else:
    print('\n⚠  Some tests failed - review output above')

print('='*80 + '\n')
