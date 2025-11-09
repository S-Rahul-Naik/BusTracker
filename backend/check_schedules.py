import asyncio
from database import db
import json

async def check_schedules():
    database = db.get_db()
    
    print("=" * 60)
    print("CHECKING BUS SCHEDULES AND ROUTES")
    print("=" * 60)
    
    # Get routes
    routes = await database.routes.find({}).to_list(10)
    print(f"\n📍 ROUTES FOUND: {len(routes)}")
    
    for route in routes:
        print(f"\n🚌 Route: {route.get('name')} (ID: {route.get('id')})")
        print(f"   Morning Trip: {route.get('morningTripTime', 'Not set')}")
        print(f"   Half Day Trip: {route.get('halfDayTripTime', 'Not set')}")
        print(f"   Evening Trip: {route.get('eveningTripTime', 'Not set')}")
        print(f"   Exam Evening: {route.get('examEveningTime', 'Not set')}")
        print(f"   Stops: {len(route.get('stops', []))}")
        if route.get('stops'):
            for i, stop in enumerate(route['stops'][:3], 1):
                print(f"      {i}. {stop.get('name')}")
    
    # Get buses
    buses = await database.buses.find({}).to_list(10)
    print(f"\n\n🚍 BUSES FOUND: {len(buses)}")
    
    for bus in buses:
        print(f"\n   Bus {bus.get('id')}: {bus.get('bus_number', 'No number')}")
        print(f"      Route: {bus.get('route_id')}")
        print(f"      Status: {bus.get('status', 'unknown')}")
        print(f"      Driver: {bus.get('driver_name', 'Not assigned')}")
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    asyncio.run(check_schedules())
