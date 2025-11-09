with open('main.py', 'w', encoding='utf-8') as f:
    content = '''"""
BusNotify Backend - MongoDB Version
"""
from fastapi import FastAPI, HTTPException, status, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime
from contextlib import asynccontextmanager
import uvicorn

from database import MongoDB, db
from auth import hash_password, verify_password, create_access_token, verify_token

# Models
class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    role: str = "student"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# App setup
@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.connect_db()
    await initialize_database()
    yield
    await db.close_db()

app = FastAPI(title="BusNotify API", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database
async def initialize_database():
    database = db.get_db()
    admin = await database.users.find_one({"email": "admin@busnotify.com"})
    if not admin:
        admin_data = {
            "name": "Administrator",
            "email": "admin@busnotify.com",
            "password": hash_password("admin123"),
            "phone": "+1234567890",
            "role": "administrator",
            "created_at": datetime.utcnow()
        }
        await database.users.insert_one(admin_data)
        print("✅ Admin created: admin@busnotify.com / admin123")

# Auth dependency
async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid auth scheme")
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid header")
    
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    email = payload.get("sub")
    database = db.get_db()
    user = await database.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

async def get_admin_user(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "administrator":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# Routes
@app.get("/")
async def root():
    return {
        "message": "🚌 BusNotify API v2.0",
        "status": "online",
        "features": ["MongoDB", "JWT", "Password Hashing", "Admin Roles"]
    }

@app.post("/api/auth/register")
async def register(user: UserRegister):
    database = db.get_db()
    existing = await database.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_data = {
        "name": user.name,
        "email": user.email,
        "password": hash_password(user.password),
        "phone": user.phone,
        "role": user.role if user.role in ["student", "administrator"] else "student",
        "created_at": datetime.utcnow()
    }
    await database.users.insert_one(user_data)
    token = create_access_token(data={"sub": user.email, "role": user_data["role"]})
    
    return {
        "message": "Registered successfully",
        "user": {"name": user.name, "email": user.email, "role": user_data["role"]},
        "access_token": token,
        "token_type": "bearer"
    }

@app.post("/api/auth/login")
async def login(credentials: UserLogin):
    database = db.get_db()
    user = await database.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token(data={"sub": user["email"], "role": user["role"]})
    return {
        "message": "Login successful",
        "user": {"name": user["name"], "email": user["email"], "role": user["role"]},
        "access_token": token,
        "token_type": "bearer"
    }

@app.get("/api/users/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "name": current_user["name"],
        "email": current_user["email"],
        "role": current_user["role"]
    }

@app.get("/api/routes")
async def get_routes():
    database = db.get_db()
    routes = await database.routes.find({}).to_list(100)
    for route in routes:
        route.pop("_id", None)
    return routes

@app.get("/api/buses")
async def get_buses():
    database = db.get_db()
    buses = await database.buses.find({}).to_list(100)
    for bus in buses:
        bus.pop("_id", None)
    return buses

@app.get("/api/admin/analytics")
async def get_analytics(current_user: dict = Depends(get_admin_user)):
    database = db.get_db()
    total_buses = await database.buses.count_documents({})
    on_time_buses = await database.buses.count_documents({"status": "on_time"})
    buses = await database.buses.find({}).to_list(100)
    
    on_time_pct = (on_time_buses / total_buses * 100) if total_buses > 0 else 0
    total_delay = sum(bus.get("delay", 0) for bus in buses)
    avg_delay = (total_delay / len(buses)) if buses else 0
    total_passengers = sum(bus.get("occupancy", 0) for bus in buses)
    
    return {
        "total_buses": total_buses,
        "active_now": total_buses,
        "on_time_percentage": round(on_time_pct, 1),
        "avg_delay_minutes": round(avg_delay, 1),
        "total_passengers": total_passengers,
        "peak_hour": "8:00 AM"
    }

if __name__ == "__main__":
    print("=" * 70)
    print("🚌 BusNotify Backend v2.0 - MongoDB Edition")
    print("=" * 70)
    print("📍 API: http://localhost:8000")
    print("📖 Docs: http://localhost:8000/docs")
    print("👤 Admin: admin@busnotify.com / admin123")
    print("=" * 70)
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
'''
    f.write(content)
    
print("✅ main.py created successfully!")
