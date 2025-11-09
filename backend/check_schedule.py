#!/usr/bin/env python3
"""
Quick check of global schedule in MongoDB
"""
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

async def check_global_schedule():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.busnotify
    
    print("🔍 Checking global_schedule collection...")
    schedule = await db.global_schedule.find_one({})
    
    if schedule:
        print("\n✅ Global schedule found:")
        print(f"   Morning Trip: {schedule.get('morningTripTime')}")
        print(f"   Half Day Trip: {schedule.get('halfDayTripTime')}")
        print(f"   Evening Trip: {schedule.get('eveningTripTime')}")
        print(f"   Exam Evening: {schedule.get('examEveningTime')}")
        print(f"   Last Updated: {schedule.get('updated_at')}")
    else:
        print("\n❌ No global schedule found in database")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_global_schedule())
