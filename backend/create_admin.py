"""
Create an admin user for the Zero Trust Monitoring System
Run this script after creating the database with create_db.py
"""

from database import SessionLocal
from models import User
from auth import hash_password

def create_admin():
    db = SessionLocal()
    
    try:
        # Check if admin already exists
        existing_admin = db.query(User).filter(User.username == "admin").first()
        
        if existing_admin:
            print("⚠️  Admin user already exists!")
            print(f"Username: {existing_admin.username}")
            print(f"Role: {existing_admin.role}")
            
            update = input("\nWould you like to update the password? (yes/no): ").lower()
            if update == "yes":
                new_password = input("Enter new password: ")
                existing_admin.password_hash = hash_password(new_password)
                db.commit()
                print("✅ Admin password updated successfully!")
            return
        
        # Create new admin user
        print("Creating new admin user...")
        
        admin = User(
            username="admin",
            name="Admin User",
            company_email="admin@company.com",
            personal_email="admin@personal.com",
            password_hash=hash_password("admin123"),
            role="admin"
        )
        
        db.add(admin)
        db.commit()
        db.refresh(admin)
        
        print("\n✅ Admin user created successfully!")
        print("=" * 50)
        print(f"Username: admin")
        print(f"Password: admin123")
        print(f"Role: admin")
        print(f"User ID: {admin.id}")
        print("=" * 50)
        print("\n⚠️  IMPORTANT: Change the password after first login!")
        
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 50)
    print("Zero Trust Monitoring System - Admin User Creator")
    print("=" * 50)
    create_admin()
