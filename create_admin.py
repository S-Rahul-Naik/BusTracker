from pymongo import MongoClient
from datetime import datetime
import bcrypt

# Connect to MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client["busnotify"]
users_collection = db["users"]

# Admin account details
admin_email = "admin@bustrack.com"
admin_password = "admin123"  # Change this to a secure password
admin_name = "System Administrator"
admin_phone = "+1234567890"

# Hash the password
hashed_password = bcrypt.hashpw(admin_password.encode('utf-8'), bcrypt.gensalt())

# Create admin user document
admin_user = {
    "name": admin_name,
    "email": admin_email,
    "password": hashed_password.decode('utf-8'),
    "phone": admin_phone,
    "role": "administrator",  # Using 'administrator' to match your existing admin
    "created_at": datetime.utcnow()
}

# Check if admin already exists
existing_admin = users_collection.find_one({"email": admin_email})

if existing_admin:
    print(f"❌ Admin account with email '{admin_email}' already exists!")
    print(f"   Name: {existing_admin.get('name')}")
    print(f"   Role: {existing_admin.get('role')}")
else:
    # Insert admin user
    result = users_collection.insert_one(admin_user)
    print("✅ Admin account created successfully!")
    print(f"   ID: {result.inserted_id}")
    print(f"   Email: {admin_email}")
    print(f"   Password: {admin_password}")
    print(f"   Name: {admin_name}")
    print(f"   Role: administrator")
    print(f"\n🔐 Login at: http://localhost:3000/login/admin")

# Close connection
client.close()
