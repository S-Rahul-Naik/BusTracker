import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
from auth import verify_password

async def test_auth():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client.bus_tracking
    
    # Test with driver2
    email = "driver2@busnotify.com"
    password = "driver123"
    
    driver = await db.users.find_one({"email": email, "role": "driver"})
    
    if driver:
        print(f"✅ Found driver: {driver['email']}")
        print(f"📝 Password from DB: {driver['password'][:50]}...")
        
        # Test verify_password function from auth.py
        result = verify_password(password, driver["password"])
        print(f"\n🔐 verify_password('{password}', hash) = {result}")
        
        # Test bcrypt directly
        password_bytes = password.encode('utf-8')[:72]
        hashed_bytes = driver["password"].encode('utf-8')
        direct_result = bcrypt.checkpw(password_bytes, hashed_bytes)
        print(f"🔐 bcrypt.checkpw directly = {direct_result}")
    else:
        print("❌ Driver not found!")
    
    client.close()

asyncio.run(test_auth())
