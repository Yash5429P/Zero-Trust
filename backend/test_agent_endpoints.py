#!/usr/bin/env python3
"""
Integration tests for agent endpoints.
Tests the full registration → heartbeat → monitoring flow.
"""

import requests
import json
import time
from datetime import datetime, timezone

# Configuration
BACKEND_URL = "http://localhost:8000"

# Test data
TEST_DEVICE_UUID = "test-integration-device-001"
TEST_HOSTNAME = "TEST-INTEGRATION-PC"
TEST_OS_VERSION = "Windows 10 (Build 19045)"

# Global state
AGENT_TOKEN = None
DEVICE_ID = None


def test_agent_registration():
    """Test 1: Agent registration endpoint"""
    global AGENT_TOKEN, DEVICE_ID
    
    print("\n" + "="*70)
    print("TEST 1: Agent Registration")
    print("="*70)
    
    payload = {
        "device_uuid": TEST_DEVICE_UUID,
        "hostname": TEST_HOSTNAME,
        "os_version": TEST_OS_VERSION,
        "system_info": {
            "mac_address": "00:11:22:33:44:55",
            "cpu_model": "Intel Core i7-10700K",
            "total_memory_gb": 16.0
        }
    }
    
    print(f"\nPOST /agent/register")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/agent/register",
            json=payload,
            timeout=10
        )
        
        print(f"\nStatus Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2, default=str)}")
        
        if response.status_code == 200:
            data = response.json()
            AGENT_TOKEN = data["agent_token"]
            DEVICE_ID = data["device_id"]
            print(f"\n✓ PASS: Agent registered successfully")
            print(f"  - Device ID: {DEVICE_ID}")
            print(f"  - Token: {AGENT_TOKEN[:50]}...")
            print(f"  - Heartbeat interval: {data['heartbeat_interval']}s")
            return True
        else:
            print(f"\n✗ FAIL: Expected 200, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"\n✗ FAIL: {str(e)}")
        return False


def test_agent_heartbeat():
    """Test 2: Agent heartbeat endpoint"""
    global AGENT_TOKEN
    
    print("\n" + "="*70)
    print("TEST 2: Agent Heartbeat")
    print("="*70)
    
    if not AGENT_TOKEN:
        print("✗ SKIP: No agent token (registration failed)")
        return False
    
    payload = {
        "device_uuid": TEST_DEVICE_UUID,
        "metrics": {
            "cpu": {
                "percent": 25.5,
                "per_cpu": [20.0, 30.5, 25.0, 26.0],
                "load_average": [1.2, 1.5, 1.3]
            },
            "memory": {
                "virtual": {
                    "used_mb": 8192,
                    "available_mb": 8192,
                    "percent": 50.0
                },
                "swap": {
                    "used_mb": 0,
                    "available_mb": 2048,
                    "percent": 0.0
                }
            },
            "disk": {
                "disks": [
                    {
                        "device": "C:",
                        "mountpoint": "C:\\",
                        "total_gb": 500,
                        "used_gb": 250,
                        "available_gb": 250,
                        "percent": 50.0
                    }
                ]
            },
            "processes": {
                "total": 150,
                "running": 145,
                "sleeping": 5,
                "zombie": 0
            },
            "network": {
                "connections": {
                    "ESTABLISHED": 25,
                    "TIME_WAIT": 3,
                    "LISTEN": 12
                }
            },
            "logged_in_users": [
                {
                    "name": "john.doe",
                    "terminal": "pts/0",
                    "started_at": "2024-01-15T09:30:00"
                }
            ],
            "usb_devices": [
                {
                    "name": "Kingston DataTraveler",
                    "vendor_id": "0951",
                    "product_id": "1666"
                }
            ]
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    print(f"\nPOST /agent/heartbeat")
    print(f"Authorization: Bearer {AGENT_TOKEN[:50]}...")
    print(f"Metrics: CPU={payload['metrics']['cpu']['percent']}%, "
          f"Memory={payload['metrics']['memory']['virtual']['percent']}%, "
          f"Processes={payload['metrics']['processes']['total']}")
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/agent/heartbeat",
            json=payload,
            headers={"Authorization": f"Bearer {AGENT_TOKEN}"},
            timeout=10
        )
        
        print(f"\nStatus Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2, default=str)}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"\n✓ PASS: Heartbeat received successfully")
            print(f"  - Device ID: {data['device_id']}")
            print(f"  - New trust score: {data['new_trust_score']}")
            print(f"  - Status: {data['status']}")
            return True
        else:
            print(f"\n✗ FAIL: Expected 200, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"\n✗ FAIL: {str(e)}")
        return False


def test_suspicious_telemetry():
    """Test 3: High CPU/memory triggers suspicion flag"""
    global AGENT_TOKEN
    
    print("\n" + "="*70)
    print("TEST 3: Suspicious Telemetry Detection")
    print("="*70)
    
    if not AGENT_TOKEN:
        print("✗ SKIP: No agent token (registration failed)")
        return False
    
    payload = {
        "device_uuid": TEST_DEVICE_UUID,
        "metrics": {
            "cpu": {
                "percent": 98.5,  # High CPU - suspicious!
                "per_cpu": [99.0, 99.0, 99.0, 99.0],
                "load_average": [3.8, 3.9, 3.8]
            },
            "memory": {
                "virtual": {
                    "used_mb": 15000,
                    "available_mb": 512,
                    "percent": 96.5  # High memory - suspicious!
                },
                "swap": {
                    "used_mb": 2000,
                    "available_mb": 48,
                    "percent": 97.6
                }
            },
            "disk": {"disks": []},
            "processes": {"total": 250, "running": 240},
            "network": {"connections": {}},
            "logged_in_users": [],
            "usb_devices": []
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    print(f"\nPOST /agent/heartbeat (High CPU & Memory)")
    print(f"CPU: {payload['metrics']['cpu']['percent']}% (suspicious)")
    print(f"Memory: {payload['metrics']['memory']['virtual']['percent']}% (suspicious)")
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/agent/heartbeat",
            json=payload,
            headers={"Authorization": f"Bearer {AGENT_TOKEN}"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            trust_score = data['new_trust_score']
            print(f"\nStatus Code: {response.status_code}")
            print(f"New trust score: {trust_score}")
            
            # This should have a penalty (score should be ~70)
            if trust_score < 100:
                print(f"\n✓ PASS: Suspicious telemetry penalty applied")
                print(f"  - Score reduced from 100 to {trust_score}")
                return True
            else:
                print(f"\n⚠ WARNING: Expected penalty but score is still {trust_score}")
                return False
        else:
            print(f"\n✗ FAIL: Expected 200, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"\n✗ FAIL: {str(e)}")
        return False


def test_list_devices(admin_token):
    """Test 4: List devices endpoint (requires admin)"""
    
    print("\n" + "="*70)
    print("TEST 4: List Registered Devices (Admin)")
    print("="*70)
    
    if not admin_token:
        print("✗ SKIP: No admin token provided")
        return False
    
    print(f"\nGET /agent/devices")
    print(f"Authorization: Bearer {admin_token[:50]}...")
    
    try:
        response = requests.get(
            f"{BACKEND_URL}/agent/devices?limit=10",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=10
        )
        
        print(f"\nStatus Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"\n✓ PASS: Devices listed successfully")
            print(f"  - Total devices: {data['pagination']['total']}")
            print(f"  - Returned: {len(data['data'])} devices")
            
            for device in data['data'][:3]:  # Show first 3
                print(f"  - Device {device['id']}: {device['hostname']} "
                      f"(Trust: {device['trust_score']}, Active: {device['is_active']})")
            
            return True
        else:
            print(f"\n✗ FAIL: Expected 200, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"\n✗ FAIL: {str(e)}")
        return False


def test_get_telemetry(admin_token):
    """Test 5: Get device telemetry (requires admin)"""
    global DEVICE_ID
    
    print("\n" + "="*70)
    print("TEST 5: Get Device Telemetry (Admin)")
    print("="*70)
    
    if not DEVICE_ID:
        print("✗ SKIP: No device ID (registration failed)")
        return False
    
    if not admin_token:
        print("✗ SKIP: No admin token provided")
        return False
    
    print(f"\nGET /agent/devices/{DEVICE_ID}/telemetry")
    print(f"Authorization: Bearer {admin_token[:50]}...")
    
    try:
        response = requests.get(
            f"{BACKEND_URL}/agent/devices/{DEVICE_ID}/telemetry?limit=10",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=10
        )
        
        print(f"\nStatus Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"\n✓ PASS: Telemetry retrieved successfully")
            print(f"  - Device: {data['hostname']}")
            print(f"  - Total snapshots: {data['pagination']['total']}")
            print(f"  - Returned: {len(data['data'])} snapshots")
            
            if data['data']:
                latest = data['data'][0]
                print(f"  - Latest snapshot collected at: {latest['collected_at']}")
                if latest['metrics']:
                    cpu = latest['metrics'].get('cpu', {})
                    print(f"    CPU: {cpu.get('percent')}%")
            
            return True
        else:
            print(f"\n✗ FAIL: Expected 200, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"\n✗ FAIL: {str(e)}")
        return False


def test_invalid_token():
    """Test 6: Invalid token handling"""
    
    print("\n" + "="*70)
    print("TEST 6: Invalid Token Handling")
    print("="*70)
    
    print(f"\nPOST /agent/heartbeat with invalid token")
    
    payload = {
        "device_uuid": TEST_DEVICE_UUID,
        "metrics": {
            "cpu": {"percent": 25},
            "memory": {"virtual": {"percent": 50}},
            "disk": {"disks": []},
            "processes": {"total": 100},
            "network": {"connections": {}},
            "logged_in_users": [],
            "usb_devices": []
        }
    }
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/agent/heartbeat",
            json=payload,
            headers={"Authorization": "Bearer invalid.token.here"},
            timeout=10
        )
        
        print(f"\nStatus Code: {response.status_code}")
        print(f"Response: {response.text[:200]}")
        
        if response.status_code == 401:
            print(f"\n✓ PASS: Invalid token rejected with 401")
            return True
        else:
            print(f"\n✗ FAIL: Expected 401, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"\n✗ FAIL: {str(e)}")
        return False


def test_missing_auth():
    """Test 7: Missing Authorization header"""
    
    print("\n" + "="*70)
    print("TEST 7: Missing Authorization Header")
    print("="*70)
    
    print(f"\nPOST /agent/heartbeat without Authorization header")
    
    payload = {
        "device_uuid": TEST_DEVICE_UUID,
        "metrics": {"cpu": {"percent": 25}}
    }
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/agent/heartbeat",
            json=payload,
            timeout=10
        )
        
        print(f"\nStatus Code: {response.status_code}")
        
        if response.status_code == 401:
            print(f"\n✓ PASS: Missing auth header rejected with 401")
            return True
        else:
            print(f"\n✗ FAIL: Expected 401, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"\n✗ FAIL: {str(e)}")
        return False


def main():
    """Run all integration tests"""
    
    # Get admin token (you'll need to provide this)
    admin_token = input("\nEnter admin user token (or press Enter to skip admin tests): ").strip()
    
    print("\n" + "="*70)
    print("AGENT ENDPOINT INTEGRATION TESTS")
    print("="*70)
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Device UUID: {TEST_DEVICE_UUID}")
    print(f"Timestamp: {datetime.now(timezone.utc).isoformat()}")
    
    results = {}
    
    # Core tests
    results["Registration"] = test_agent_registration()
    time.sleep(1)  # Small delay
    results["Heartbeat"] = test_agent_heartbeat()
    time.sleep(1)
    results["Suspicious Telemetry"] = test_suspicious_telemetry()
    time.sleep(1)
    
    # Admin tests
    if admin_token:
        results["List Devices"] = test_list_devices(admin_token)
        time.sleep(1)
        results["Telemetry History"] = test_get_telemetry(admin_token)
    
    # Error handling tests
    results["Invalid Token"] = test_invalid_token()
    results["Missing Auth"] = test_missing_auth()
    
    # Summary
    print("\n" + "="*70)
    print("TEST SUMMARY")
    print("="*70)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n✓ All tests PASSED!")
        return 0
    else:
        print(f"\n✗ {total - passed} test(s) FAILED")
        return 1


if __name__ == "__main__":
    exit(main())
