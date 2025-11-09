"""
Check what stops are actually in MongoDB from admin-created routes
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "busnotify"

async def check_data():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("=" * 60)
    print("📊 Checking MongoDB Data")
    print("=" * 60)
    
    # Check routes
    print("\n🚍 ROUTES:")
    routes = await db.routes.find({}).to_list(100)
    for route in routes:
        print(f"\nRoute ID: {route.get('id')}")
        print(f"  Name: {route.get('name')}")
        print(f"  Description: {route.get('description')}")
        print(f"  Stops: {route.get('stops', [])}")
        print(f"  Distance: {route.get('distance')}")
        print(f"  Duration: {route.get('duration')}")
    
    # Check stops
    print("\n\n📍 STOPS:")
    stops = await db.stops.find({}).to_list(100)
    print(f"Total stops in database: {len(stops)}")
    for stop in stops:
        print(f"\nStop ID: {stop.get('id')}")
        print(f"  Name: {stop.get('name')}")
        print(f"  Code: {stop.get('code')}")
        print(f"  Location: {stop.get('location')}")
    
    # Check buses
    print("\n\n🚌 BUSES:")
    buses = await db.buses.find({}).to_list(100)
    print(f"Total buses in database: {len(buses)}")
    for bus in buses:
        print(f"\nBus: {bus.get('bus_number')}")
        print(f"  Route: {bus.get('route_id')}")
        print(f"  Status: {bus.get('status')}")
    
    print("\n" + "=" * 60)
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_data())
