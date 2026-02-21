"""Test Google OAuth endpoint to see actual error"""
import requests
import json

# Test with a fake token to see what error we get
test_token = "eyJhbGciOiJSUzI1NiIsImtpZCI6IjEifQ.eyJhdWQiOiI3NTc5ODM3MTQ3NDItYjNmOGY2N2VmbHJ2YTY2NmhuYWtnYWdpOXNrMjRjZXMyaC5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsInN1YiI6IjEyMzQ1Njc4OTAiLCJlbWFpbCI6InRlc3RAZ21haWwuY29tIiwibmFtZSI6IlRlc3QgVXNlciIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlfQ.signature"

print("Testing /login/google endpoint...")
try:
    response = requests.post(
        "http://localhost:8000/login/google",
        json={"token": test_token},
        timeout=5
    )
    print(f"Status code: {response.status_code}")
    print(f"Response headers: {dict(response.headers)}")
    try:
        print(f"Response body: {json.dumps(response.json(), indent=2)}")
    except:
        print(f"Response body (raw): {response.text}")
except Exception as e:
    print(f"Error: {type(e).__name__}: {e}")
