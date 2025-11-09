"""
Check what data admin has added to MongoDB
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "busnotify"

async def check_admin_data():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("📊 Current Database Contents:\n")
    
    # Check routes
    print("🛣️  ROUTES:")
    routes = await db.routes.find({}).to_list(100)
    for route in routes:
        print(f"   - {route.get('name')} (ID: {route.get('id')})")
        if route.get('stops'):
            print(f"     Stops: {len(route.get('stops'))} stops")
            for stop in route.get('stops')[:3]:
                print(f"       • {stop}")
        print()
    
    # Check stops
    print("🚏 STOPS:")
    stops = await db.stops.find({}).to_list(100)
    for stop in stops:
        print(f"   - {stop.get('name')} ({stop.get('code')})")
    
    # Check buses
    print("\n🚌 BUSES:")
    buses = await db.buses.find({}).to_list(100)
    for bus in buses:
        print(f"   - {bus.get('bus_number')} on route {bus.get('route_id')}")
    
    print(f"\n📈 Total: {len(routes)} routes, {len(stops)} stops, {len(buses)} buses")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_admin_data())
