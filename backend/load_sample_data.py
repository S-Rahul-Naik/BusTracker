"""
Load sample data (stops, routes, buses) into MongoDB
"""
import json
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

# MongoDB connection
MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "busnotify"

async def load_sample_data():
    """Load sample stops and routes into MongoDB"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("🔄 Loading sample data into MongoDB...")
    
    # Load stops
    try:
        with open('data/sample_stops.json', 'r') as f:
            stops_data = json.load(f)
        
        # Clear existing stops
        await db.stops.delete_many({})
        
        # Insert stops
        if stops_data:
            # Transform stops to match backend schema
            for stop in stops_data:
                stop['id'] = stop.pop('_id', None) or stop.get('id')
                stop['created_at'] = datetime.utcnow()
                stop['updated_at'] = datetime.utcnow()
            
            result = await db.stops.insert_many(stops_data)
            print(f"✅ Loaded {len(result.inserted_ids)} stops")
        else:
            print("⚠️  No stops data found")
    except FileNotFoundError:
        print("❌ sample_stops.json not found")
    except Exception as e:
        print(f"❌ Error loading stops: {e}")
    
    # Load routes
    try:
        with open('data/sample_routes.json', 'r') as f:
            routes_data = json.load(f)
        
        # Clear existing routes
        await db.routes.delete_many({})
        
        # Insert routes
        if routes_data:
            # Transform routes
            for route in routes_data:
                route['id'] = route.pop('_id', None) or route.get('id')
                route['created_at'] = datetime.utcnow()
                route['updated_at'] = datetime.utcnow()
            
            result = await db.routes.insert_many(routes_data)
            print(f"✅ Loaded {len(result.inserted_ids)} routes")
        else:
            print("⚠️  No routes data found")
    except FileNotFoundError:
        print("❌ sample_routes.json not found")
    except Exception as e:
        print(f"❌ Error loading routes: {e}")
    
    # Create sample buses
    print("\n🚌 Creating sample buses...")
    await db.buses.delete_many({})
    
    sample_buses = [
        {
            "id": "bus-001",
            "bus_number": "BUS-001",
            "route_id": "route_001",
            "status": "active",
            "current_location": {
                "latitude": 40.7128,
                "longitude": -74.0060
            },
            "next_stop": "University Campus",
            "eta_minutes": 8,
            "delay_minutes": 0,
            "direction": "Northbound",
            "final_destination": "Airport Terminal",
            "completed_stops": ["Central Station"],
            "upcoming_stops": ["University Campus", "Shopping Mall", "Airport Terminal"],
            "driver_name": "John Doe",
            "capacity": 50,
            "current_occupancy": 25,
            "created_at": datetime.utcnow()
        },
        {
            "id": "bus-002",
            "bus_number": "BUS-002",
            "route_id": "route_001",
            "status": "active",
            "current_location": {
                "latitude": 40.7589,
                "longitude": -73.9851
            },
            "next_stop": "Shopping Mall",
            "eta_minutes": 5,
            "delay_minutes": 2,
            "direction": "Southbound",
            "final_destination": "Central Station",
            "completed_stops": ["Airport Terminal", "University Campus"],
            "upcoming_stops": ["Shopping Mall", "Central Station"],
            "driver_name": "Jane Smith",
            "capacity": 50,
            "current_occupancy": 35,
            "created_at": datetime.utcnow()
        },
        {
            "id": "bus-003",
            "bus_number": "BUS-003",
            "route_id": "route_002",
            "status": "active",
            "current_location": {
                "latitude": 40.7505,
                "longitude": -73.9934
            },
            "next_stop": "Hospital Complex",
            "eta_minutes": 3,
            "delay_minutes": -1,
            "direction": "Eastbound",
            "final_destination": "Tech Park",
            "completed_stops": ["Shopping Mall"],
            "upcoming_stops": ["Hospital Complex", "Tech Park"],
            "driver_name": "Mike Johnson",
            "capacity": 45,
            "current_occupancy": 20,
            "created_at": datetime.utcnow()
        }
    ]
    
    result = await db.buses.insert_many(sample_buses)
    print(f"✅ Created {len(result.inserted_ids)} buses")
    
    # Summary
    print("\n📊 Database Summary:")
    stops_count = await db.stops.count_documents({})
    routes_count = await db.routes.count_documents({})
    buses_count = await db.buses.count_documents({})
    users_count = await db.users.count_documents({})
    
    print(f"   Stops: {stops_count}")
    print(f"   Routes: {routes_count}")
    print(f"   Buses: {buses_count}")
    print(f"   Users: {users_count}")
    
    print("\n✅ Sample data loaded successfully!")
    print("🚀 Refresh your dashboard to see the data\n")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(load_sample_data())
