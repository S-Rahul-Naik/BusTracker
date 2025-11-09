#!/usr/bin/env python3
"""
Manually set and verify global schedule in MongoDB
"""
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
from datetime import datetime

async def update_and_check():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.busnotify
    
    print("📝 Updating global schedule...")
    
    # Update the schedule
    result = await db.global_schedule.update_one(
        {},
        {
            "$set": {
                "morningTripTime": "7:00 AM",
                "halfDayTripTime": "2:00 PM",  # Changed to 2:00 PM for testing
                "eveningTripTime": "5:00 PM",   # Changed to 5:00 PM for testing
                "examEveningTime": "6:00 PM",   # Changed to 6:00 PM for testing
                "updated_at": datetime.utcnow()
            }
        },
        upsert=True
    )
    
    print(f"✅ Update result: Modified={result.modified_count}, Matched={result.matched_count}")
    
    print("\n🔍 Reading back from database...")
    schedule = await db.global_schedule.find_one({})
    
    if schedule:
        print("\n✅ Global schedule in database:")
        print(f"   Morning Trip: {schedule.get('morningTripTime')}")
        print(f"   Half Day Trip: {schedule.get('halfDayTripTime')}")
        print(f"   Evening Trip: {schedule.get('eveningTripTime')}")
        print(f"   Exam Evening: {schedule.get('examEveningTime')}")
        print(f"   Last Updated: {schedule.get('updated_at')}")
        print(f"\n   Full document: {schedule}")
    else:
        print("\n❌ No global schedule found in database")
    
    # Check if there are multiple documents
    count = await db.global_schedule.count_documents({})
    print(f"\n📊 Total documents in global_schedule: {count}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(update_and_check())
