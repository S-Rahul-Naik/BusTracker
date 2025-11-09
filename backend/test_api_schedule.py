#!/usr/bin/env python3
"""
Test the API endpoint directly
"""
import requests

BASE_URL = "http://localhost:8000"
ADMIN_EMAIL = "admin@busnotify.com"
ADMIN_PASSWORD = "admin123"

def test_api():
    print("🔐 Logging in...")
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
    )
    
    if response.status_code != 200:
        print(f"❌ Login failed: {response.text}")
        return
    
    token = response.json()["access_token"]
    print("✅ Login successful!")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get current schedule
    print("\n📥 Getting global schedule from API...")
    response = requests.get(f"{BASE_URL}/api/admin/global-schedule", headers=headers)
    
    if response.status_code == 200:
        schedule = response.json()
        print("✅ Current schedule from API:")
        print(f"   Morning: {schedule.get('morningTripTime')}")
        print(f"   Half Day: {schedule.get('halfDayTripTime')}")
        print(f"   Evening: {schedule.get('eveningTripTime')}")
        print(f"   Exam: {schedule.get('examEveningTime')}")
    else:
        print(f"❌ Failed to get schedule: {response.text}")

if __name__ == "__main__":
    test_api()
