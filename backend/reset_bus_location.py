"""
Reset Bus #2 location to Bellary Engineering College (first stop of Route-2)
"""
import asyncio
from database import MongoDB, db
from datetime import datetime

async def reset_bus_location():
    await db.connect_db()
    database = db.get_db()
    
    # Get Route-2 to find first stop coordinates
    route = await database.routes.find_one({"name": "Route-2"})
    
    if route and route.get("stops") and len(route["stops"]) > 0:
        first_stop = route["stops"][0]
        
        # Extract coordinates
        lat = first_stop.get("latitude") or first_stop.get("lat")
        lng = first_stop.get("longitude") or first_stop.get("lng")
        
        print(f"First stop: {first_stop.get('name')}")
        print(f"Coordinates: {lat}, {lng}")
        
        # Update Bus #2 location to first stop
        result = await database.buses.update_one(
            {"bus_number": "2"},
            {
                "$set": {
                    "current_location": {
                        "latitude": lat,
                        "longitude": lng,
                        "updated_at": datetime.utcnow()
                    },
                    "last_updated": datetime.utcnow(),
                    "trip_active": False
                }
            }
        )
        
        if result.matched_count > 0:
            print(f"✅ Bus #2 location reset to {first_stop.get('name')}")
            print(f"   GPS: {lat}, {lng}")
        else:
            print("⚠️  Bus #2 not found")
    else:
        print("⚠️  Route-2 or stops not found")
    
    await db.close_db()

if __name__ == "__main__":
    asyncio.run(reset_bus_location())
