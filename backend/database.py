"""
MongoDB Database Connection and Models
"""
from motor.motor_asyncio import AsyncIOMotorClient
from typing import ClassVar, Optional
import os
import ssl

# MongoDB Configuration
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = "busnotify"

class MongoDB:
    client: ClassVar[Optional[AsyncIOMotorClient]] = None
    
    @classmethod
    async def connect_db(cls):
        """Connect to MongoDB"""
        # Aggressive SSL bypass for MongoDB Atlas M0 free tier compatibility
        # Create an SSL context that doesn't verify certificates
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
        
        # Add SSL bypass parameters to connection string
        connection_string = MONGODB_URL
        if "?" not in connection_string:
            connection_string = f"{connection_string}?"
        
        cls.client = AsyncIOMotorClient(
            connection_string,
            serverSelectionTimeoutMS=30000,
            connectTimeoutMS=30000,
            socketTimeoutMS=30000,
            tls=True,
            tlsAllowInvalidCertificates=True,
            tlsAllowInvalidHostnames=True,
            ssl_context=ssl_context
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
