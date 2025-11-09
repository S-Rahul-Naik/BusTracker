#!/usr/bin/env python3
"""
Test Global Schedule System
Tests the new global schedule endpoints and route management
"""

import requests
import json

BASE_URL = "http://localhost:8000"

# Admin credentials
ADMIN_EMAIL = "admin@busnotify.com"
ADMIN_PASSWORD = "admin123"

def login():
    """Login as admin and get token"""
    print("🔐 Logging in as admin...")
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
    )
    if response.status_code == 200:
        token = response.json()["access_token"]
        print("✅ Login successful!")
        return token
    else:
        print(f"❌ Login failed: {response.text}")
        return None

def test_global_schedule(token):
    """Test global schedule endpoints"""
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n📅 Testing Global Schedule Endpoints")
    print("=" * 50)
    
    # Test GET global schedule
    print("\n1️⃣ Getting current global schedule...")
    response = requests.get(f"{BASE_URL}/api/admin/global-schedule", headers=headers)
    if response.status_code == 200:
        schedule = response.json()
        print("✅ Current Global Schedule:")
        print(json.dumps(schedule, indent=2))
    else:
        print(f"❌ Failed to get global schedule: {response.text}")
        return
    
    # Test POST global schedule (update)
    print("\n2️⃣ Updating global schedule...")
    new_schedule = {
        "morningTripTime": "7:00 AM",
        "halfDayTripTime": "12:30 PM",  # Changed from 1:00 PM
        "eveningTripTime": "4:30 PM",   # Changed from 4:45 PM
        "examEveningTime": "5:15 PM"    # Changed from 5:20 PM
    }
    response = requests.post(
        f"{BASE_URL}/api/admin/global-schedule",
        headers=headers,
        json=new_schedule
    )
    if response.status_code == 200:
        print("✅ Global schedule updated successfully!")
        print(json.dumps(response.json(), indent=2))
    else:
        print(f"❌ Failed to update global schedule: {response.text}")
        return
    
    # Verify the update
    print("\n3️⃣ Verifying updated schedule...")
    response = requests.get(f"{BASE_URL}/api/admin/global-schedule", headers=headers)
    if response.status_code == 200:
        schedule = response.json()
        print("✅ Updated Global Schedule:")
        print(json.dumps(schedule, indent=2))
        
        # Verify values
        assert schedule["halfDayTripTime"] == "12:30 PM", "Half day time not updated"
        assert schedule["eveningTripTime"] == "4:30 PM", "Evening time not updated"
        print("✅ All values verified!")
    else:
        print(f"❌ Failed to verify: {response.text}")

def test_create_route_with_global(token):
    """Test creating a route with global schedule"""
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n🚌 Testing Route Creation with Global Schedule")
    print("=" * 50)
    
    route_data = {
        "name": "Test Route - Global",
        "description": "Test route using global schedule",
        "frequency": "30 min",
        "operatingHours": "N/A",
        "direction": "bidirectional",
        "color": "blue",
        "stops": [
            {
                "id": "stop1",
                "name": "Test Stop 1",
                "lat": 15.16700535,
                "lng": 76.85043438637047,
                "order": 1
            },
            {
                "id": "stop2",
                "name": "Test Stop 2",
                "lat": 15.1644126,
                "lng": 76.8590197,
                "order": 2
            }
        ],
        "useGlobalSchedule": True,
        "morningTripTime": "7:00 AM",
        "halfDayTripTime": "12:30 PM",
        "eveningTripTime": "4:30 PM",
        "examEveningTime": "5:15 PM"
    }
    
    print("\n1️⃣ Creating route with global schedule...")
    response = requests.post(
        f"{BASE_URL}/api/admin/routes",
        headers=headers,
        json=route_data
    )
    
    if response.status_code == 200:
        print("✅ Route created successfully!")
        route = response.json()
        print(f"   Route ID: {route.get('id', 'N/A')}")
        print(f"   Uses Global: {route.get('useGlobalSchedule', False)}")
        print(f"   Timings:")
        print(f"      Morning: {route.get('morningTripTime')}")
        print(f"      Half Day: {route.get('halfDayTripTime')}")
        print(f"      Evening: {route.get('eveningTripTime')}")
        print(f"      Exam: {route.get('examEveningTime')}")
        return route.get('id')
    else:
        print(f"❌ Failed to create route: {response.text}")
        return None

def test_create_route_custom(token):
    """Test creating a route with custom schedule"""
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n🚌 Testing Route Creation with Custom Schedule")
    print("=" * 50)
    
    route_data = {
        "name": "Test Route - Custom",
        "description": "Test route with custom timings",
        "frequency": "45 min",
        "operatingHours": "N/A",
        "direction": "bidirectional",
        "color": "red",
        "stops": [
            {
                "id": "stop3",
                "name": "Test Stop 3",
                "lat": 15.17,
                "lng": 76.86,
                "order": 1
            }
        ],
        "useGlobalSchedule": False,
        "morningTripTime": "7:00 AM",
        "halfDayTripTime": "1:15 PM",   # Custom
        "eveningTripTime": "5:00 PM",   # Custom
        "examEveningTime": "5:45 PM"    # Custom
    }
    
    print("\n1️⃣ Creating route with custom schedule...")
    response = requests.post(
        f"{BASE_URL}/api/admin/routes",
        headers=headers,
        json=route_data
    )
    
    if response.status_code == 200:
        print("✅ Route created successfully!")
        route = response.json()
        print(f"   Route ID: {route.get('id', 'N/A')}")
        print(f"   Uses Global: {route.get('useGlobalSchedule', False)}")
        print(f"   Custom Timings:")
        print(f"      Morning: {route.get('morningTripTime')}")
        print(f"      Half Day: {route.get('halfDayTripTime')} (custom)")
        print(f"      Evening: {route.get('eveningTripTime')} (custom)")
        print(f"      Exam: {route.get('examEveningTime')} (custom)")
        return route.get('id')
    else:
        print(f"❌ Failed to create route: {response.text}")
        return None

def test_apply_global_to_all(token):
    """Test applying global schedule to all routes"""
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n🔄 Testing Apply Global Schedule to All Routes")
    print("=" * 50)
    
    print("\n1️⃣ Applying global schedule to all routes...")
    response = requests.post(
        f"{BASE_URL}/api/admin/apply-global-schedule",
        headers=headers
    )
    
    if response.status_code == 200:
        result = response.json()
        print("✅ Global schedule applied successfully!")
        print(f"   Routes updated: {result.get('routes_updated', 0)}")
        
        # Verify by getting all routes
        print("\n2️⃣ Verifying all routes now use global schedule...")
        response = requests.get(f"{BASE_URL}/api/routes", headers=headers)
        if response.status_code == 200:
            routes = response.json()
            print(f"✅ Found {len(routes)} routes")
            for route in routes[:3]:  # Show first 3
                print(f"\n   Route: {route.get('name')}")
                print(f"      Uses Global: {route.get('useGlobalSchedule', False)}")
                print(f"      Half Day: {route.get('halfDayTripTime')}")
                print(f"      Evening: {route.get('eveningTripTime')}")
    else:
        print(f"❌ Failed to apply global schedule: {response.text}")

def main():
    print("=" * 70)
    print("🧪 Testing Global Schedule System")
    print("=" * 70)
    
    # Login
    token = login()
    if not token:
        print("\n❌ Cannot proceed without authentication")
        return
    
    # Test global schedule endpoints
    test_global_schedule(token)
    
    # Test route creation with global schedule
    global_route_id = test_create_route_with_global(token)
    
    # Test route creation with custom schedule
    custom_route_id = test_create_route_custom(token)
    
    # Test applying global to all routes
    if global_route_id or custom_route_id:
        test_apply_global_to_all(token)
    
    print("\n" + "=" * 70)
    print("✅ All tests completed!")
    print("=" * 70)

if __name__ == "__main__":
    main()
