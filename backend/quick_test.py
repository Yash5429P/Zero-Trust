"""Quick test of backend response"""
import subprocess
import time
import requests

# Start backend in background
print("Starting backend...")
backend_proc = subprocess.Popen(
    ["python", "app.py"],
    cwd=r"c:\Users\HP\Desktop\zero-trust-fullstack\backend",
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE
)

# Wait for startup
time.sleep(3)

# Test endpoint
print("\nTesting /login/google endpoint...")
try:
    response = requests.post(
        "http://127.0.0.1:8000/login/google",
        json={"token": "test_invalid_token"},
        timeout=3
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")

# Clean up
backend_proc.terminate()
