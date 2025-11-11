"""
Create sample driver account for testing GPS tracking
"""
import asyncio
from database import MongoDB, db
from auth import hash_password
from datetime import datetime

async def create_driver():
    await db.connect_db()
    database = db.get_db()
    
    # Check if driver already exists
    existing_driver = await database.users.find_one({"email": "driver@busnotify.com"})
    
    if existing_driver:
        print("✅ Driver already exists: driver@busnotify.com")
    else:
        # Create driver account
        driver_data = {
            "name": "John Driver",
            "email": "driver@busnotify.com",
            "password": hash_password("driver123"),
            "phone": "+1234567890",
            "role": "driver",
            "created_at": datetime.utcnow()
        }
        await database.users.insert_one(driver_data)
        print("✅ Driver created: driver@busnotify.com / driver123")
    
    # Update Bus #2 to assign this driver
    bus_result = await database.buses.update_one(
        {"bus_number": "2"},
        {
            "$set": {
                "driver_name": "John Driver",
                "driver_email": "driver@busnotify.com",
                "driver_phone": "+1234567890"
            }
        }
    )
    
    if bus_result.matched_count > 0:
        print("✅ Bus #2 assigned to driver")
    else:
        print("⚠️  Bus #2 not found")
    
    await db.close_db()
    print("\n" + "="*50)
    print("Driver Login Credentials:")
    print("Email: driver@busnotify.com")
    print("Password: driver123")
    print("Bus: #2")
    print("Route: Route-2")
    print("="*50)

if __name__ == "__main__":
    asyncio.run(create_driver())
