#!/usr/bin/env python3
"""
Complete verification script for Zero Trust Monitoring System
Tests all components and backend-frontend readiness
"""

import os
import sys
import subprocess
import sqlite3
import requests
import time
from pathlib import Path
from datetime import datetime

# Color codes for terminal output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    END = '\033[0m'
    BOLD = '\033[1m'

def print_header(text):
    print(f"\n{Colors.BOLD}{Colors.CYAN}{'='*70}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.CYAN}{text.center(70)}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.CYAN}{'='*70}{Colors.END}\n")

def print_success(text):
    print(f"{Colors.GREEN}✓ {text}{Colors.END}")

def print_error(text):
    print(f"{Colors.RED}✗ {text}{Colors.END}")

def print_warning(text):
    print(f"{Colors.YELLOW}⚠ {text}{Colors.END}")

def print_info(text):
    print(f"{Colors.BLUE}ℹ {text}{Colors.END}")

def check_file_exists(filepath, display_name):
    """Check if a file exists"""
    print_header(f"Checking {display_name}")
    
    if os.path.exists(filepath):
        size = os.path.getsize(filepath)
        mod_time = datetime.fromtimestamp(os.path.getmtime(filepath))
        print_success(f"{display_name} found")
        print_info(f"  Path: {filepath}")
        print_info(f"  Size: {size} bytes")
        print_info(f"  Modified: {mod_time}")
        return True
    else:
        print_error(f"{display_name} NOT FOUND")
        print_info(f"  Expected: {filepath}")
        return False

def check_python_packages():
    """Check if required packages are installed"""
    print_header("Checking Python Packages")
    
    required_packages = {
        'fastapi': 'FastAPI',
        'uvicorn': 'Uvicorn',
        'sqlalchemy': 'SQLAlchemy',
        'pydantic': 'Pydantic',
        'passlib': 'Passlib',
        'python-jose': 'Python-JOSE',
        'bcrypt': 'Bcrypt',
        'requests': 'Requests',
        'email_validator': 'Email-Validator',
        'python-dotenv': 'Python-dotenv'
    }
    
    all_installed = True
    for package, display_name in required_packages.items():
        try:
            __import__(package.replace('-', '_'))
            print_success(f"{display_name} installed")
        except ImportError:
            print_error(f"{display_name} NOT installed")
            all_installed = False
    
    if not all_installed:
        print_warning("Some packages are missing!")
        print_info("Run: pip install -r requirements.txt")
        return False
    
    return True

def check_database():
    """Check database creation and tables"""
    print_header("Checking Database")
    
    if not os.path.exists('insider.db'):
        print_error("Database file 'insider.db' not found")
        print_info("Run: python create_db.py")
        return False
    
    print_success("Database file found")
    
    try:
        conn = sqlite3.connect('insider.db')
        c = conn.cursor()
        
        # Check tables
        c.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = c.fetchall()
        
        expected_tables = {'users', 'logs'}
        found_tables = {table[0] for table in tables}
        
        if expected_tables == found_tables:
            print_success("All required tables found")
            
            # Check table contents
            c.execute("SELECT COUNT(*) FROM users")
            user_count = c.fetchone()[0]
            c.execute("SELECT COUNT(*) FROM logs")
            log_count = c.fetchone()[0]
            
            print_info(f"  Users: {user_count} records")
            print_info(f"  Logs: {log_count} records")
            
            conn.close()
            return True
        else:
            missing = expected_tables - found_tables
            print_error(f"Missing tables: {missing}")
            conn.close()
            return False
            
    except sqlite3.Error as e:
        print_error(f"Database error: {e}")
        return False

def check_backend_server():
    """Check if backend server is running"""
    print_header("Checking Backend Server")
    
    max_retries = 30
    for attempt in range(max_retries):
        try:
            response = requests.get('http://127.0.0.1:8000/', timeout=2)
            if response.status_code == 200:
                print_success("Backend server is running!")
                print_info(f"  Response: {response.json()}")
                return True
        except requests.exceptions.ConnectionError:
            if attempt < max_retries - 1:
                print_info(f"  Waiting for server... ({attempt+1}/{max_retries})")
                time.sleep(1)
        except Exception as e:
            print_error(f"Error: {e}")
    
    print_error("Backend server is NOT running")
    print_info("Start server with: python -m uvicorn app:app --reload")
    return False

def test_api_endpoints():
    """Test all critical API endpoints"""
    print_header("Testing API Endpoints")
    
    test_results = {}
    
    # Test 1: Home endpoint
    try:
        response = requests.get('http://127.0.0.1:8000/')
        test_results['Home (/)'] = response.status_code == 200
        if response.status_code == 200:
            print_success(f"GET / → {response.status_code}")
        else:
            print_error(f"GET / → {response.status_code}")
    except Exception as e:
        print_error(f"GET / → Connection error: {e}")
        test_results['Home (/)'] = False
    
    # Test 2: Register endpoint
    try:
        user_data = {
            "username": f"testuser_{int(time.time())}",
            "name": "Test User",
            "company_email": f"test_{int(time.time())}@company.com",
            "personal_email": f"test_{int(time.time())}@personal.com",
            "password": "TestPass123!"
        }
        response = requests.post('http://127.0.0.1:8000/register', json=user_data)
        test_results['Register (POST /register)'] = response.status_code == 200
        if response.status_code == 200:
            print_success(f"POST /register → {response.status_code}")
            test_results['test_username'] = user_data['username']
            test_results['test_password'] = user_data['password']
            test_results['test_email'] = user_data['company_email']
        else:
            print_error(f"POST /register → {response.status_code}")
    except Exception as e:
        print_error(f"POST /register → {e}")
        test_results['Register (POST /register)'] = False
    
    # Test 3: Login endpoint
    if 'test_email' in test_results:
        try:
            login_data = {
                "username": test_results['test_email'],
                "password": test_results['test_password']
            }
            response = requests.post('http://127.0.0.1:8000/login', json=login_data)
            test_results['Login (POST /login)'] = response.status_code == 200
            
            if response.status_code == 200:
                token_data = response.json()
                test_results['access_token'] = token_data.get('access_token')
                print_success(f"POST /login → {response.status_code}")
                print_info(f"  Token: {token_data.get('access_token')[:30]}...")
            else:
                print_error(f"POST /login → {response.status_code}")
        except Exception as e:
            print_error(f"POST /login → {e}")
            test_results['Login (POST /login)'] = False
    
    # Test 4: Protected endpoint
    if 'access_token' in test_results:
        try:
            headers = {'Authorization': f"Bearer {test_results['access_token']}"}
            response = requests.get('http://127.0.0.1:8000/profile', headers=headers)
            test_results['Profile (GET /profile)'] = response.status_code == 200
            
            if response.status_code == 200:
                profile_data = response.json()
                print_success(f"GET /profile → {response.status_code}")
                print_info(f"  Username: {profile_data.get('username')}")
                print_info(f"  Role: {profile_data.get('role')}")
            else:
                print_error(f"GET /profile → {response.status_code}")
        except Exception as e:
            print_error(f"GET /profile → {e}")
            test_results['Profile (GET /profile)'] = False
    
    # Test 5: Collect log endpoint
    try:
        log_data = {
            "username": test_results.get('test_username', 'testuser'),
            "action": "test_action",
            "details": "Testing log collection",
            "ip": "192.168.1.100",
            "device": "TEST-DEVICE"
        }
        response = requests.post('http://127.0.0.1:8000/collect-log', json=log_data)
        test_results['Collect Log (POST /collect-log)'] = response.status_code == 200
        
        if response.status_code == 200:
            print_success(f"POST /collect-log → {response.status_code}")
        else:
            print_error(f"POST /collect-log → {response.status_code}")
    except Exception as e:
        print_error(f"POST /collect-log → {e}")
        test_results['Collect Log (POST /collect-log)'] = False
    
    return test_results

def test_frontend_compatibility():
    """Test frontend compatibility"""
    print_header("Testing Frontend Compatibility")
    
    print_info("Frontend requirements:")
    print_info("  ✓ Can make HTTP requests to http://127.0.0.1:8000")
    print_info("  ✓ Can handle Bearer token in Authorization header")
    print_info("  ✓ Can parse JSON responses")
    print_info("  ✓ Can store tokens in localStorage")
    
    print("\nFrontend should use:")
    print(f"{Colors.CYAN}  API Base URL: http://127.0.0.1:8000{Colors.END}")
    print(f"{Colors.CYAN}  Header format: Authorization: Bearer <token>{Colors.END}")
    
    print("\nSupported Login methods:")
    print(f"{Colors.CYAN}  • Email (company): company_email field{Colors.END}")
    print(f"{Colors.CYAN}  • Email (personal): personal_email field{Colors.END}")
    print(f"{Colors.CYAN}  • Username: username field{Colors.END}")

def generate_report(checks):
    """Generate final verification report"""
    print_header("VERIFICATION REPORT")
    
    results = {
        'Files': checks.get('files', {}),
        'Dependencies': checks.get('dependencies', False),
        'Database': checks.get('database', False),
        'Backend Server': checks.get('backend', False),
        'API Tests': checks.get('api_tests', {})
    }
    
    print(f"{Colors.BOLD}Component Status:{Colors.END}\n")
    
    all_pass = True
    
    # Files check
    for filename, status in results['Files'].items():
        status_icon = Colors.GREEN + "✓" + Colors.END if status else Colors.RED + "✗" + Colors.END
        print(f"  {status_icon} {filename}")
        if not status:
            all_pass = False
    
    # Dependencies
    status_icon = Colors.GREEN + "✓" + Colors.END if results['Dependencies'] else Colors.RED + "✗" + Colors.END
    print(f"  {status_icon} Python Packages")
    if not results['Dependencies']:
        all_pass = False
    
    # Database
    status_icon = Colors.GREEN + "✓" + Colors.END if results['Database'] else Colors.RED + "✗" + Colors.END
    print(f"  {status_icon} Database (insider.db)")
    if not results['Database']:
        all_pass = False
    
    # Backend
    status_icon = Colors.GREEN + "✓" + Colors.END if results['Backend Server'] else Colors.RED + "✗" + Colors.END
    print(f"  {status_icon} Backend Server")
    if not results['Backend Server']:
        all_pass = False
    
    # API Tests
    passed_tests = sum(1 for k, v in results['API Tests'].items() if v is True and not k.startswith('test_') and not k.startswith('access_'))
    total_tests = sum(1 for k, v in results['API Tests'].items() if isinstance(v, bool) and not k.startswith('test_') and not k.startswith('access_'))
    
    status_icon = Colors.GREEN + "✓" + Colors.END if passed_tests == total_tests and total_tests > 0 else Colors.RED + "✗" + Colors.END
    print(f"  {status_icon} API Endpoints ({passed_tests}/{total_tests} passed)")
    
    print(f"\n{Colors.BOLD}Overall Status:{Colors.END}\n")
    
    if all_pass and passed_tests == total_tests and total_tests > 0:
        print(f"{Colors.GREEN}{Colors.BOLD}✓ ALL CHECKS PASSED!{Colors.END}")
        print(f"\n{Colors.GREEN}Backend is ready for frontend connection!{Colors.END}\n")
        return True
    else:
        print(f"{Colors.RED}{Colors.BOLD}✗ SOME CHECKS FAILED{Colors.END}")
        print(f"\n{Colors.YELLOW}Please fix the issues above and try again.{Colors.END}\n")
        return False

def main():
    """Main verification routine"""
    print(f"\n{Colors.BOLD}{Colors.CYAN}")
    print("╔════════════════════════════════════════════════════════════════════╗")
    print("║         ZERO TRUST MONITORING SYSTEM - VERIFICATION TOOL           ║")
    print("║                    Complete System Checker                         ║")
    print("╚════════════════════════════════════════════════════════════════════╝")
    print(f"{Colors.END}\n")
    
    checks = {
        'files': {},
        'dependencies': False,
        'database': False,
        'backend': False,
        'api_tests': {}
    }
    
    # Check files
    print_info("Starting comprehensive verification...\n")
    
    required_files = {
        'app.py': 'Main Application',
        'auth.py': 'Authentication Module',
        'database.py': 'Database Setup',
        'models.py': 'Data Models',
        'schemas.py': 'Request Schemas',
        'dependencies.py': 'Dependency Injection',
        'agent.py': 'Activity Agent',
        '.env': 'Environment Configuration',
        'requirements.txt': 'Dependencies List'
    }
    
    for filename, display_name in required_files.items():
        exists = check_file_exists(filename, display_name)
        checks['files'][filename] = exists
    
    # Check packages
    checks['dependencies'] = check_python_packages()
    
    # Check database
    checks['database'] = check_database()
    
    # Check backend server
    checks['backend'] = check_backend_server()
    
    # Test API endpoints
    if checks['backend']:
        checks['api_tests'] = test_api_endpoints()
    else:
        print_warning("Skipping API tests because backend server is not running")
    
    # Test frontend compatibility
    if checks['backend']:
        test_frontend_compatibility()
    
    # Generate report
    success = generate_report(checks)
    
    print_header("Next Steps")
    
    if success:
        print(f"{Colors.GREEN}1. Frontend can connect to backend at: http://127.0.0.1:8000{Colors.END}")
        print(f"{Colors.GREEN}2. Use the API documentation: http://127.0.0.1:8000/docs{Colors.END}")
        print(f"{Colors.GREEN}3. Frontend should use Bearer token authentication{Colors.END}")
        print()
    else:
        print(f"{Colors.YELLOW}1. Install missing packages: pip install -r requirements.txt{Colors.END}")
        print(f"{Colors.YELLOW}2. Create database: python create_db.py{Colors.END}")
        print(f"{Colors.YELLOW}3. Start backend server: python -m uvicorn app:app --reload{Colors.END}")
        print()
    
    return 0 if success else 1

if __name__ == '__main__':
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Verification cancelled by user{Colors.END}")
        sys.exit(1)
    except Exception as e:
        print(f"\n{Colors.RED}Fatal error: {e}{Colors.END}")
        sys.exit(1)
