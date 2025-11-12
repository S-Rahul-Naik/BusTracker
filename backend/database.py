"""
MongoDB Database Connection and Models
"""
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional
import os

# MongoDB Configuration
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = "busnotify"

class MongoDB:
    client: Optional[AsyncIOMotorClient] = None
    
    @classmethod
    async def connect_db(cls):
        """Connect to MongoDB"""
        cls.client = AsyncIOMotorClient(MONGODB_URL)
        print(f"✅ Connected to MongoDB at {MONGODB_URL}")
    
    @classmethod
    async def close_db(cls):
        """Close MongoDB connection"""
        if cls.client:
            cls.client.close()
            print("✅ MongoDB connection closed")
    
    @classmethod
    def get_db(cls):
        """Get database instance"""
        return cls.client[DATABASE_NAME]

# Database instance
db = MongoDB()
