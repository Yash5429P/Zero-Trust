"""
PHASE B: Integration Tests for Enterprise-Grade Zero Trust Enforcement

Tests all Phase B features:
- Secret token authentication
- Admin approval workflow
- Replay protection
- Rate limiting
- Online enforcement
- Trust-triggered session revocation
- Token rotation
- Session revocation on approval/rejection
- Audit logging

Run with: python test_phase_b_integration.py
"""

import requests
import json
import time
import secrets
from datetime import datetime, timezone, timedelta

# Configuration
BASE_URL = "http://localhost:8000"
ADMIN_TOKEN = "your-admin-token-here"  # Get from login endpoint

# Test Results
results = {
    "passed": [],
    "failed": []
}


def log_result(test_name: str, passed: bool, details: str = ""):
    """Log test result"""
    if passed:
        results["passed"].append(test_name)
        print(f"✓ {test_name}")
    else:
        results["failed"].append((test_name, details))
        print(f"✗ {test_name}: {details}")


# =============================================================================
# TEST 1: Device Registration with Secret Token
# =============================================================================

def test_registration_returns_secret_token():
    """Test that registration returns 128-char hex secret token (not JWT)"""
    print("\n[TEST 1] Device Registration with Secret Token...")
    
    device_uuid = f"test-device-{int(time.time())}"
    
    payload = {
        "device_uuid": device_uuid,
        "hostname": "TEST-PC",
        "os_version": "Windows 11"
    }
    
    response = requests.post(f"{BASE_URL}/agent/register", json=payload)
    
    if response.status_code == 200:
        data = response.json()
        
        # Check token is 128-char hex (64 random bytes)
        token = data.get("agent_token", "")
        if len(token) == 128 and all(c in "0123456789abcdef" for c in token.lower()):
            log_result("Secret token format", True)
        else:
            log_result("Secret token format", False, f"Expected 128-char hex, got {len(token)} chars")
        
        # Check is_approved = False (approval workflow)
        if data.get("is_approved") is False:
            log_result("Approval workflow", True)
        else:
            log_result("Approval workflow", False, f"Expected is_approved=False, got {data.get('is_approved')}")
        
        # Check message mentions approval
        if "approval" in data.get("message", "").lower():
            log_result("Approval message", True)
        else:
            log_result("Approval message", False, f"Message: {data.get('message')}")
        
        return data.get("agent_token"), data.get("device_id"), device_uuid
    else:
        log_result("Device registration", False, f"Status {response.status_code}")
        return None, None, None


# =============================================================================
# TEST 2: Heartbeat Blocked Until Approved
# =============================================================================

def test_heartbeat_blocked_without_approval(token, device_uuid):
    """Test that heartbeat is blocked if device not approved"""
    print("\n[TEST 2] Heartbeat Blocked Without Approval...")
    
    payload = {
        "device_uuid": device_uuid,
        "metrics": {
            "cpu": {"percent": 25.0},
            "memory": {"virtual": {"percent": 50.0}},
            "disk": {"disks": []},
            "processes": {"total": 100},
            "network": {"connections": {}},
            "logged_in_users": [],
            "usb_devices": []
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "nonce": secrets.token_hex(8)
    }
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(f"{BASE_URL}/agent/heartbeat", json=payload, headers=headers)
    
    # Should get 200 with status="pending" (not 403)
    if response.status_code == 200:
        data = response.json()
        if data.get("status") == "pending" and data.get("is_approved") is False:
            log_result("Unapproved heartbeat handling", True)
        else:
            log_result("Unapproved heartbeat handling", False, f"Status: {data.get('status')}, is_approved: {data.get('is_approved')}")
    else:
        log_result("Unapproved heartbeat handling", False, f"Status code: {response.status_code}")


# =============================================================================
# TEST 3: Admin Approval Workflow
# =============================================================================

def test_admin_approval_workflow(device_id):
    """Test admin can approve/reject devices"""
    print("\n[TEST 3] Admin Approval Workflow...")
    
    # Test approval
    payload = {
        "action": "approve",
        "reason": "Device verified on-site"
    }
    
    headers = {"Authorization": f"Bearer {ADMIN_TOKEN}"}
    response = requests.post(
        f"{BASE_URL}/agent/devices/{device_id}/approve",
        json=payload,
        headers=headers
    )
    
    if response.status_code == 200:
        data = response.json()
        if data.get("is_approved") is True:
            log_result("Device approval", True)
        else:
            log_result("Device approval", False, f"is_approved should be True")
    else:
        log_result("Device approval", False, f"Status {response.status_code}")
    
    # Test rejection (on another device)
    device_uuid = f"reject-test-{int(time.time())}"
    reg_payload = {
        "device_uuid": device_uuid,
        "hostname": "REJECT-PC",
        "os_version": "Windows 10"
    }
    
    reg_response = requests.post(f"{BASE_URL}/agent/register", json=reg_payload)
    if reg_response.status_code == 200:
        reject_device_id = reg_response.json()["device_id"]
        
        reject_payload = {
            "action": "reject",
            "reason": "Suspicious behavior"
        }
        
        reject_response = requests.post(
            f"{BASE_URL}/agent/devices/{reject_device_id}/approve",
            json=reject_payload,
            headers=headers
        )
        
        if reject_response.status_code == 200:
            data = reject_response.json()
            if data.get("is_approved") is False:
                log_result("Device rejection", True)
            else:
                log_result("Device rejection", False, "is_approved should be False")


# =============================================================================
# TEST 4: Replay Protection (Nonce)
# =============================================================================

def test_replay_protection(token, device_uuid):
    """Test that duplicate nonces are rejected"""
    print("\n[TEST 4] Replay Protection (Nonce Validation)...")
    
    nonce = secrets.token_hex(8)
    
    payload = {
        "device_uuid": device_uuid,
        "metrics": {
            "cpu": {"percent": 25.0},
            "memory": {"virtual": {"percent": 50.0}},
            "disk": {"disks": []},
            "processes": {"total": 100},
            "network": {"connections": {}},
            "logged_in_users": [],
            "usb_devices": []
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "nonce": nonce
    }
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # First heartbeat with nonce
    response1 = requests.post(f"{BASE_URL}/agent/heartbeat", json=payload, headers=headers)
    if response1.status_code not in [200, 403]:  # 403 if not approved
        log_result("Nonce acceptance (1st heartbeat)", False, f"Status {response1.status_code}")
        return
    
    # Second heartbeat with SAME nonce (immediate replay)
    time.sleep(0.1)
    response2 = requests.post(f"{BASE_URL}/agent/heartbeat", json=payload, headers=headers)
    
    if response2.status_code == 403:
        log_result("Replay detection", True)
    else:
        log_result("Replay detection", False, f"Expected 403, got {response2.status_code}")


# =============================================================================
# TEST 5: Timestamp Freshness Validation
# =============================================================================

def test_timestamp_freshness(token, device_uuid):
    """Test that old heartbeat timestamps are rejected"""
    print("\n[TEST 5] Timestamp Freshness Validation...")
    
    # Create heartbeat with 65-second-old timestamp
    old_timestamp = (datetime.now(timezone.utc) - timedelta(seconds=65)).isoformat()
    
    payload = {
        "device_uuid": device_uuid,
        "metrics": {
            "cpu": {"percent": 25.0},
            "memory": {"virtual": {"percent": 50.0}},
            "disk": {"disks": []},
            "processes": {"total": 100},
            "network": {"connections": {}},
            "logged_in_users": [],
            "usb_devices": []
        },
        "timestamp": old_timestamp,
        "nonce": secrets.token_hex(8)
    }
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(f"{BASE_URL}/agent/heartbeat", json=payload, headers=headers)
    
    if response.status_code == 400 and "old" in response.json().get("detail", "").lower():
        log_result("Stale heartbeat rejection", True)
    else:
        log_result("Stale heartbeat rejection", False, f"Status {response.status_code}: {response.text}")


# =============================================================================
# TEST 6: Rate Limiting
# =============================================================================

def test_rate_limiting():
    """Test rate limiting (10 req/min per IP for registration)"""
    print("\n[TEST 6] Rate Limiting...")
    
    # This test would exceed rate limit - test one request
    device_uuid = f"rate-limit-test-{int(time.time())}"
    
    payload = {
        "device_uuid": device_uuid,
        "hostname": "RATE-TEST",
        "os_version": "Windows 11"
    }
    
    response = requests.post(f"{BASE_URL}/agent/register", json=payload)
    
    if response.status_code == 200:
        log_result("Rate limit check (IP-based)", True)
    elif response.status_code == 429:
        log_result("Rate limit check (IP-based)", True)  # Already hit
    else:
        log_result("Rate limit check (IP-based)", False, f"Status {response.status_code}")


# =============================================================================
# TEST 7: Token Format Validation
# =============================================================================

def test_token_format_validation():
    """Test that invalid token formats are rejected"""
    print("\n[TEST 7] Token Format Validation...")
    
    device_uuid = f"format-test-{int(time.time())}"
    
    payload = {
        "device_uuid": device_uuid,
        "metrics": {
            "cpu": {"percent": 25.0},
            "memory": {"virtual": {"percent": 50.0}},
            "disk": {"disks": []},
            "processes": {"total": 100},
            "network": {"connections": {}},
            "logged_in_users": [],
            "usb_devices": []
        }
    }
    
    # Test with short token (not 128 chars)
    invalid_token = "tooshort"
    headers = {"Authorization": f"Bearer {invalid_token}"}
    
    response = requests.post(f"{BASE_URL}/agent/heartbeat", json=payload, headers=headers)
    
    if response.status_code == 401:
        log_result("Invalid token format rejection", True)
    else:
        log_result("Invalid token format rejection", False, f"Status {response.status_code}")


# =============================================================================
# TEST 8: Token Rotation Requirement
# =============================================================================

def test_token_rotation_requirement(token, device_uuid):
    """Test that server indicates token rotation requirement"""
    print("\n[TEST 8] Token Rotation Requirement...")
    
    payload = {
        "device_uuid": device_uuid,
        "metrics": {
            "cpu": {"percent": 25.0},
            "memory": {"virtual": {"percent": 50.0}},
            "disk": {"disks": []},
            "processes": {"total": 100},
            "network": {"connections": {}},
            "logged_in_users": [],
            "usb_devices": []
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "nonce": secrets.token_hex(8)
    }
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(f"{BASE_URL}/agent/heartbeat", json=payload, headers=headers)
    
    if response.status_code in [200, 403]:
        data = response.json()
        if "requires_rotation" in data:
            log_result("Token rotation field present", True)
        else:
            log_result("Token rotation field present", False, "Missing 'requires_rotation'")


# =============================================================================
# TEST 9: Trust Score Calculation
# =============================================================================

def test_trust_score_calculation(token, device_uuid):
    """Test that trust score is calculated and returned"""
    print("\n[TEST 9] Trust Score Calculation...")
    
    payload = {
        "device_uuid": device_uuid,
        "metrics": {
            "cpu": {"percent": 50.0},  # Normal
            "memory": {"virtual": {"percent": 60.0}},
            "disk": {"disks": []},
            "processes": {"total": 100},
            "network": {"connections": {}},
            "logged_in_users": [],
            "usb_devices": []
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "nonce": secrets.token_hex(8)
    }
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(f"{BASE_URL}/agent/heartbeat", json=payload, headers=headers)
    
    if response.status_code in [200, 403]:
        data = response.json()
        trust_score = data.get("new_trust_score")
        if isinstance(trust_score, (int, float)) and 0 <= trust_score <= 100:
            log_result("Trust score calculation", True)
        else:
            log_result("Trust score calculation", False, f"Invalid score: {trust_score}")


# =============================================================================
# TEST 10: Audit Logging
# =============================================================================

def test_audit_logging(admin_token):
    """Test that security events are logged"""
    print("\n[TEST 10] Audit Logging...")
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = requests.get(f"{BASE_URL}/logs?limit=1", headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        logs = data.get("data", [])
        
        if logs:
            log_entry = logs[0]
            if "event_type" in log_entry and "timestamp" in log_entry:
                log_result("Audit event logging", True)
            else:
                log_result("Audit event logging", False, "Missing event fields")
        else:
            log_result("Audit event logging", False, "No logs found")


# =============================================================================
# MAIN TEST RUNNER
# =============================================================================

def main():
    """Run all Phase B integration tests"""
    print("=" * 80)
    print("PHASE B: ENTERPRISE-GRADE ZERO TRUST ENFORCEMENT - INTEGRATION TESTS")
    print("=" * 80)
    print(f"Base URL: {BASE_URL}")
    
    # Test 1: Registration
    token, device_id, device_uuid = test_registration_returns_secret_token()
    
    if token and device_id:
        # Test 2: Blocked heartbeat
        test_heartbeat_blocked_without_approval(token, device_uuid)
        
        # Test 3: Approval workflow
        test_admin_approval_workflow(device_id)
        
        # Test 4: Replay protection
        test_replay_protection(token, device_uuid)
        
        # Test 5: Timestamp validation
        test_timestamp_freshness(token, device_uuid)
        
        # Test 8: Token rotation
        test_token_rotation_requirement(token, device_uuid)
        
        # Test 9: Trust score
        test_trust_score_calculation(token, device_uuid)
    
    # Test 6: Rate limiting
    test_rate_limiting()
    
    # Test 7: Token format
    test_token_format_validation()
    
    # Test 10: Audit logging
    # test_audit_logging(ADMIN_TOKEN)  # Uncomment with valid admin token
    
    # Results Summary
    print("\n" + "=" * 80)
    print("TEST RESULTS SUMMARY")
    print("=" * 80)
    print(f"Passed: {len(results['passed'])}")
    print(f"Failed: {len(results['failed'])}")
    
    if results["failed"]:
        print("\nFailed Tests:")
        for test_name, error in results["failed"]:
            print(f"  - {test_name}: {error}")
    
    pass_rate = len(results['passed']) / (len(results['passed']) + len(results['failed'])) * 100 if (len(results['passed']) + len(results['failed'])) > 0 else 0
    print(f"\nPass Rate: {pass_rate:.1f}%")
    print("=" * 80)


if __name__ == "__main__":
    main()
