import requests
import json

BASE_URL = "http://10.158.230.65:8000"

print("🧪 Testing Driver Login API")
print("=" * 50)

# Test 1: Login with driver2 (Bus 2)
print("\n📝 Test 1: Login with driver2@busnotify.com")
payload = {
    "email": "driver2@busnotify.com",
    "password": "driver123",
    "bus_number": "2"
}

try:
    response = requests.post(
        f"{BASE_URL}/api/driver/login",
        json=payload,
        headers={"Content-Type": "application/json"},
        timeout=10
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 200:
        print("✅ Login successful!")
    else:
        print("❌ Login failed!")
        
except requests.exceptions.ConnectionError:
    print("❌ Connection Error - Cannot connect to backend")
except requests.exceptions.Timeout:
    print("❌ Timeout - Backend not responding")
except Exception as e:
    print(f"❌ Error: {e}")

# Test 2: Try from localhost
print("\n\n📝 Test 2: Same request from localhost")
try:
    response = requests.post(
        "http://localhost:8000/api/driver/login",
        json=payload,
        headers={"Content-Type": "application/json"},
        timeout=10
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
except Exception as e:
    print(f"❌ Error: {e}")
