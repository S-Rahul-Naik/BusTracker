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
        # For MongoDB Atlas M0 free tier, we need to disable SSL verification
        # due to Python 3.11 SSL library compatibility issues
        import ssl
        
        cls.client = AsyncIOMotorClient(
            MONGODB_URL,
            serverSelectionTimeoutMS=30000,
            connectTimeoutMS=30000,
            socketTimeoutMS=30000,
            tlsAllowInvalidCertificates=True,  # Required for M0 tier
            ssl_cert_reqs=ssl.CERT_NONE  # Disable certificate verification
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
