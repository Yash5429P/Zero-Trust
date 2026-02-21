import requests
import json

# Login first
r = requests.post('http://127.0.0.1:8000/login', json={'username': 'superadmin@company.com', 'password': 'super@1234'})
token = r.json()['access_token']

# Try accessing protected endpoint
headers = {'Authorization': f'Bearer {token}'}
r2 = requests.get('http://127.0.0.1:8000/admin/users', headers=headers)

print('Protected endpoint status:', r2.status_code)
if r2.status_code == 200:
    print('SUCCESS! Session stays active after login')
    data = r2.json()
    print(f'Users count: {len(data.get("data", []))}')
else:
    print('ERROR:', r2.json())
