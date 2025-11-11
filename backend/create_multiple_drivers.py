"""
Script to create multiple driver accounts with different bus assignments
Run this to create drivers for Bus 1, Bus 3, Bus 4, etc.
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt

def hash_password(password: str) -> str:
    """Hash a password using bcrypt directly"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

async def create_multiple_drivers():
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.bus_tracking
    
    print("🚌 Creating multiple driver accounts...")
    
    # Define drivers and their bus assignments
    drivers_data = [
        {
            "email": "driver1@busnotify.com",
            "password": "driver123",
            "name": "Rajesh Kumar",
            "phone": "+91 9876543210",
            "role": "driver",
            "bus_number": "1",
            "route_id": "route-1"
        },
        {
            "email": "driver2@busnotify.com",
            "password": "driver123",
            "name": "John Driver",
            "phone": "+91 9876543211",
            "role": "driver",
            "bus_number": "2",
            "route_id": "route-1762589112.350423"  # Existing route
        },
        {
            "email": "driver3@busnotify.com",
            "password": "driver123",
            "name": "Suresh Patel",
            "phone": "+91 9876543212",
            "role": "driver",
            "bus_number": "3",
            "route_id": "route-1"
        },
        {
            "email": "driver4@busnotify.com",
            "password": "driver123",
            "name": "Mahesh Singh",
            "phone": "+91 9876543213",
            "role": "driver",
            "bus_number": "4",
            "route_id": "route-2"
        },
    ]
    
    for driver_data in drivers_data:
        # Create/update user
        user_data = {
            "email": driver_data["email"],
            "password": hash_password(driver_data["password"]),
            "name": driver_data["name"],
            "phone": driver_data["phone"],
            "role": "driver"
        }
        
        await db.users.update_one(
            {"email": driver_data["email"]},
            {"$set": user_data},
            upsert=True
        )
        
        # Create/update bus assignment
        bus_data = {
            "bus_number": driver_data["bus_number"],
            "route_id": driver_data["route_id"],
            "driver_name": driver_data["name"],
            "driver_email": driver_data["email"],
            "current_location": {
                "latitude": 15.167,  # Default location
                "longitude": 76.850,
                "updated_at": None
            },
            "trip_active": False,
            "status": "available",
            "capacity": 50,
            "occupancy": 0
        }
        
        await db.buses.update_one(
            {"bus_number": driver_data["bus_number"]},
            {"$set": bus_data},
            upsert=True
        )
        
        print(f"✅ Created: {driver_data['name']} - Bus {driver_data['bus_number']}")
        print(f"   Email: {driver_data['email']}")
        print(f"   Password: {driver_data['password']}")
        print(f"   Route: {driver_data['route_id']}")
        print()
    
    print("\n🎉 All drivers created successfully!")
    print("\n📱 You can now login with any of these accounts in the mobile app:")
    print("\nBus 1: driver1@busnotify.com / driver123")
    print("Bus 2: driver2@busnotify.com / driver123")
    print("Bus 3: driver3@busnotify.com / driver123")
    print("Bus 4: driver4@busnotify.com / driver123")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_multiple_drivers())
