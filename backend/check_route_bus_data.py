from pymongo import MongoClient

client = MongoClient('mongodb://localhost:27017/')
db = client['busnotify']

print("=== ROUTES IN DATABASE ===")
routes = list(db.routes.find({}))
for route in routes:
    print(f"\nRoute Name: {route.get('name')}")
    print(f"Route ID: {route.get('_id')}")
    print(f"Description: {route.get('description', 'N/A')}")
    print(f"Number of stops: {len(route.get('stops', []))}")

print("\n\n=== BUSES IN DATABASE ===")
buses = list(db.buses.find({}))
for bus in buses:
    print(f"\nBus Number: {bus.get('bus_number')}")
    print(f"Route ID (route_id field): {bus.get('route_id')}")
    print(f"Route (route field): {bus.get('route')}")
    print(f"Driver: {bus.get('driver')}")
    print(f"All fields: {bus}")

print(f"\n\nTotal Routes: {len(routes)}")
print(f"Total Buses: {len(buses)}")
