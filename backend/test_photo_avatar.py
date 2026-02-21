"""
Test photo/avatar registration functionality
"""
import requests
import time
from pathlib import Path

def test_photo_avatar():
    print('='*70)
    print('PHOTO/AVATAR REGISTRATION TEST')
    print('='*70)
    
    # Test 1: Register without photo (should generate default avatar)
    print('\nTest 1: Register WITHOUT photo (auto-generate avatar)')
    print('-' * 70)
    try:
        # Use multipart form data
        data = {
            'username': f'phototest_{int(time.time())}',
            'name': 'Photo Test User',
            'company_email': f'photo_{int(time.time())}@company.com',
            'personal_email': f'photo_{int(time.time())}@gmail.com',
            'password': 'TestPass@123'
        }
        
        # Create multipart request without file
        files = {'photo': None}
        
        r = requests.post('http://localhost:8000/register', data=data, files=files, timeout=5)
        print(f'   Status: {r.status_code}')
        if r.status_code == 200:
            user = r.json()
            print(f'   Username: {user.get("username")}')
            avatar_path = user.get('profile_photo', 'None')
            print(f'   Avatar Path: {avatar_path}')
            if avatar_path and avatar_path.startswith('/avatars'):
                print(f'   ✓ Default avatar generated successfully!')
            else:
                print(f'   Avatar info: {avatar_path}')
        else:
            print(f'   Error: {r.json()}')
    except Exception as e:
        print(f'   ERROR: {str(e)}')
    
    # Test 2: Check if avatars directory was created
    print('\nTest 2: Check avatars directory')
    print('-' * 70)
    avatars_dir = Path('avatars')
    if avatars_dir.exists():
        files = list(avatars_dir.glob('*'))
        print(f'   Avatars directory: EXISTS ✓')
        print(f'   Files in directory: {len(files)}')
        for f in sorted(files)[-3:]:
            print(f'     - {f.name}')
    else:
        print(f'   Avatars directory: NOT FOUND')
    
    print('\n' + '='*70)
    print('✓ Photo/Avatar test complete!')
    print('='*70)

if __name__ == '__main__':
    test_photo_avatar()
