import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt

async def check_password_hash():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client.bus_tracking
    
    driver = await db.users.find_one({'email': 'driver2@busnotify.com'})
    
    if driver:
        stored_hash = driver.get('password', '')
        print(f"📧 Driver: {driver['email']}")
        print(f"🔑 Stored password hash: {stored_hash[:50]}...")
        print(f"📏 Hash length: {len(stored_hash)}")
        print(f"🏷️  Hash starts with: {stored_hash[:7]}")
        
        # Test password verification
        plain_password = "driver123"
        password_bytes = plain_password.encode('utf-8')[:72]
        hashed_bytes = stored_hash.encode('utf-8')
        
        try:
            result = bcrypt.checkpw(password_bytes, hashed_bytes)
            print(f"\n✅ Password 'driver123' verification: {result}")
        except Exception as e:
            print(f"\n❌ Password verification error: {e}")
            
        # Try creating a fresh hash
        fresh_hash = bcrypt.hashpw(password_bytes, bcrypt.gensalt())
        print(f"\n🆕 Fresh hash for 'driver123': {fresh_hash.decode('utf-8')[:50]}...")
        print(f"📏 Fresh hash length: {len(fresh_hash.decode('utf-8'))}")
    
    client.close()

asyncio.run(check_password_hash())
