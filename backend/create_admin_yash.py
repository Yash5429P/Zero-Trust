from database import SessionLocal
from models import User
from auth import hash_password

db = SessionLocal()

admin = User(
    username="Yash_Verma",
    name="Yash Verma",
    company_email="yashverma@company.com",
    personal_email="yashverma@gmail.com",
    password_hash=hash_password("yash@1234"),
    role="admin",
    status="active"
)

db.add(admin)
db.commit()
print(f"✅ Admin user '{admin.username}' created successfully!")
db.close()
exit()
