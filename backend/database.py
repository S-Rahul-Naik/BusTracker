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
        # For MongoDB Atlas, use the connection string with SSL parameters
        # Add retryWrites and w parameters for better Atlas compatibility
        connection_url = MONGODB_URL
        if "mongodb+srv://" in MONGODB_URL and "?" in MONGODB_URL:
            # Already has parameters, add more
            connection_url = f"{MONGODB_URL}&retryWrites=true&w=majority&tls=true"
        elif "mongodb+srv://" in MONGODB_URL:
            # No parameters yet
            connection_url = f"{MONGODB_URL}?retryWrites=true&w=majority&tls=true"
        
        cls.client = AsyncIOMotorClient(
            connection_url,
            serverSelectionTimeoutMS=10000,
            connectTimeoutMS=10000,
            socketTimeoutMS=10000
        )
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
