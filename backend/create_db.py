from database import Base, engine
import models

print("Creating tables...")
# Create all tables
Base.metadata.create_all(bind=engine)
print("Database tables created successfully.")