"""
MongoDB Database Connection and Models
"""
from motor.motor_asyncio import AsyncIOMotorClient
from typing import ClassVar, Optional
import os

# MongoDB Configuration
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = "busnotify"

class MongoDB:
    client: ClassVar[Optional[AsyncIOMotorClient]] = None
    
    @classmethod
    async def connect_db(cls):
        """Connect to MongoDB"""
        # For MongoDB Atlas M0 free tier with Python 3.11
        # Add SSL parameters to connection string if not present
        connection_string = MONGODB_URL
        if "tlsAllowInvalidCertificates" not in connection_string:
            # Add SSL bypass parameters to connection string
            separator = "&" if "?" in connection_string else "?"
            connection_string = f"{connection_string}{separator}tls=true&tlsAllowInvalidCertificates=true"
        
        cls.client = AsyncIOMotorClient(
            connection_string,
            serverSelectionTimeoutMS=30000,
            connectTimeoutMS=30000,
            socketTimeoutMS=30000
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
