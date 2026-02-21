import requests
import time
import socket
import os
from datetime import datetime

# Get API URL from environment or use default
API_URL = os.getenv("API_URL", "http://127.0.0.1:8000/collect-log")
AUTH_TOKEN = os.getenv("AUTH_TOKEN", "")  # Optional: bearer token for authentication

def get_device_info():
    """Get device hostname"""
    try:
        return socket.gethostname()
    except:
        return "UNKNOWN-DEVICE"

def get_ip_address():
    """Get local IP address"""
    try:
        hostname = socket.gethostname()
        return socket.gethostbyname(hostname)
    except:
        return "127.0.0.1"

def send_log(username, action, details="", ip=None, device=None):
    """
    Send activity log to the backend API
    
    Args:
        username (str): Username performing the action
        action (str): Type of action (login, file_access, etc.)
        details (str): Detailed description
        ip (str): IP address (auto-detected if None)
        device (str): Device name (auto-detected if None)
    """
    
    # Auto-detect if not provided
    if ip is None:
        ip = get_ip_address()
    if device is None:
        device = get_device_info()
    
    # Prepare data with correct field names
    data = {
        "username": username,
        "action": action,
        "details": details,
        "ip": ip,
        "device": device
    }
    
    # Prepare headers
    headers = {"Content-Type": "application/json"}
    if AUTH_TOKEN:
        headers["Authorization"] = f"Bearer {AUTH_TOKEN}"
    
    try:
        res = requests.post(API_URL, json=data, headers=headers, timeout=5)
        
        if res.status_code == 200:
            print(f"✓ Log sent successfully: {action}")
            return True
        elif res.status_code == 401:
            print(f"✗ Authentication failed. Please set AUTH_TOKEN environment variable.")
            return False
        else:
            print(f"✗ Error ({res.status_code}): {res.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"✗ Connection error: Cannot reach API at {API_URL}")
        return False
    except requests.exceptions.Timeout:
        print(f"✗ Timeout: API request took too long")
        return False
    except Exception as e:
        print(f"✗ Unexpected error: {str(e)}")
        return False

# Example usage / Testing
if __name__ == "__main__":
    print("=" * 50)
    print("Zero Trust Monitoring Agent - Log Sender")
    print("=" * 50)
    
    # Note: This requires the backend API to be running
    # and AUTH_TOKEN to be set if authentication is required
    
    test_user = "yash"
    test_actions = [
        ("heartbeat", "System running normally"),
        ("login", "User logged in"),
        ("file_access", "Accessed /etc/passwd"),
        ("process_execution", "Executed msiexec.exe"),
    ]
    
    print(f"\nDetected Device: {get_device_info()}")
    print(f"Detected IP: {get_ip_address()}")
    print(f"API Endpoint: {API_URL}\n")
    
    # Send test logs
    for action, detail in test_actions:
        print(f"Sending: {action}")
        send_log(test_user, action, detail)
        time.sleep(2)  # wait between each log

