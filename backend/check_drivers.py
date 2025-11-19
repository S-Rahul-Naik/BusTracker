import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_drivers():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client.bus_tracking
    
    users = await db.users.find({'role': 'driver'}).to_list(10)
    print(f'✅ Found {len(users)} driver accounts:')
    for user in users:
        print(f'  📧 Email: {user["email"]}')
        print(f'  👤 Name: {user["name"]}')
        print(f'  🔑 Has password: {"Yes" if user.get("password") else "No"}')
        print()
    
    buses = await db.buses.find().to_list(10)
    print(f'✅ Found {len(buses)} buses:')
    for bus in buses:
        print(f'  🚌 Bus {bus["bus_number"]} - Route: {bus.get("route_id")} - Driver: {bus.get("driver_email")}')
    
    client.close()

asyncio.run(check_drivers())
