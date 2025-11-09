"""
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

class Stop(BaseModel):
    id: str
    name: str
    lat: float
    lng: float
    order: int

class RouteCreate(BaseModel):
    name: str
    description: str
    frequency: str
    operatingHours: str
    direction: str
    stops: List[Stop]
    color: str = "blue"
    distance: str = ""
    duration: str = ""
    # College bus specific timings
    morningTripTime: Optional[str] = "7:00 AM"
    halfDayTripTime: Optional[str] = "1:00 PM"
    eveningTripTime: Optional[str] = "4:45 PM"
    examEveningTime: Optional[str] = "5:20 PM"
    useGlobalSchedule: Optional[bool] = True

class GlobalSchedule(BaseModel):
    morningTripTime: str = "7:00 AM"
    halfDayTripTime: str = "1:00 PM"
    eveningTripTime: str = "4:45 PM"
    examEveningTime: str = "5:20 PM"

class TodaySchedule(BaseModel):
    scheduleType: str = "regular"  # regular, halfday, exam, holiday

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
    
    # Initialize admin user
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
    
    # Initialize global schedule if not exists
    global_schedule = await database.global_schedule.find_one({})
    if not global_schedule:
        default_schedule = {
            "morningTripTime": "7:00 AM",
            "halfDayTripTime": "1:00 PM",
            "eveningTripTime": "4:45 PM",
            "examEveningTime": "5:20 PM",
            "updated_at": datetime.utcnow()
        }
        await database.global_schedule.insert_one(default_schedule)
        print("✅ Global schedule initialized with defaults")

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
    buses = await database.buses.find({}).to_list(1000)
    
    # Count buses per route and calculate average delay
    route_bus_counts = {}
    route_delays = {}
    
    for bus in buses:
        route_id = bus.get('route_id')
        if route_id:
            # Count buses
            route_bus_counts[route_id] = route_bus_counts.get(route_id, 0) + 1
            # Sum delays
            delay = bus.get('delay_minutes', 0)
            if route_id not in route_delays:
                route_delays[route_id] = []
            route_delays[route_id].append(delay)
    
    # Add bus counts and average delays to routes
    for route in routes:
        route.pop("_id", None)
        route_id = route.get('id')
        route['active_buses'] = route_bus_counts.get(route_id, 0)
        
        # Calculate average delay
        if route_id in route_delays and route_delays[route_id]:
            route['average_delay'] = sum(route_delays[route_id]) / len(route_delays[route_id])
        else:
            route['average_delay'] = 0
    
    return routes

@app.get("/api/stops")
async def get_stops():
    """Get all bus stops from all routes"""
    database = db.get_db()
    
    # Get all routes
    routes = await database.routes.find({}).to_list(100)
    
    # Extract unique stops from all routes
    all_stops = []
    seen_stop_ids = set()
    
    for route in routes:
        stops = route.get("stops", [])
        for stop in stops:
            stop_id = stop.get("id")
            if stop_id and stop_id not in seen_stop_ids:
                seen_stop_ids.add(stop_id)
                all_stops.append({
                    "id": stop_id,
                    "name": stop.get("name"),
                    "code": stop.get("name", "")[:3].upper(),  # Generate code from first 3 letters
                    "location": {
                        "latitude": stop.get("lat"),
                        "longitude": stop.get("lng")
                    },
                    "is_active": True
                })
    
    return all_stops

@app.get("/api/notifications")
async def get_notifications(current_user: dict = Depends(get_current_user)):
    """Get notifications for current user"""
    database = db.get_db()
    notifications = await database.notifications.find({
        "user_id": current_user.get("email")
    }).sort("created_at", -1).to_list(50)
    
    for notif in notifications:
        notif.pop("_id", None)
    return notifications

@app.patch("/api/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    """Mark a notification as read"""
    database = db.get_db()
    result = await database.notifications.update_one(
        {"id": notification_id, "user_id": current_user.get("email")},
        {"$set": {"is_read": True}}
    )
    return {"success": result.modified_count > 0}

@app.patch("/api/notifications/read-all")
async def mark_all_notifications_read(current_user: dict = Depends(get_current_user)):
    """Mark all notifications as read"""
    database = db.get_db()
    result = await database.notifications.update_many(
        {"user_id": current_user.get("email")},
        {"$set": {"is_read": True}}
    )
    return {"success": True, "modified_count": result.modified_count}

@app.get("/api/predictions/route/{route_id}")
async def get_route_predictions(route_id: str):
    """Get predictions for all stops on a route"""
    database = db.get_db()
    
    # Get route stops
    route = await database.routes.find_one({"id": route_id})
    if not route:
        return []
    
    # Generate mock predictions for now (you can replace with ML model later)
    import random
    from datetime import timedelta
    
    predictions = []
    stops = route.get("stops", [])
    base_time = datetime.utcnow()
    
    for idx, stop in enumerate(stops):
        # Extract stop information
        stop_id = stop.get("id") if isinstance(stop, dict) else str(stop)
        stop_name = stop.get("name") if isinstance(stop, dict) else str(stop)
        
        delay = random.randint(-2, 10)
        scheduled = base_time + timedelta(minutes=idx * 8)
        predicted = scheduled + timedelta(minutes=delay)
        
        predictions.append({
            "stop_id": stop_id,
            "stop_name": stop_name,
            "scheduled_arrival": scheduled.isoformat(),
            "predicted_arrival": predicted.isoformat(),
            "delay_minutes": delay,
            "confidence": random.randint(80, 98),
            "passenger_count": random.randint(10, 70)
        })
    
    return predictions

@app.post("/api/admin/routes")
async def create_route(route: RouteCreate, current_user: dict = Depends(get_admin_user)):
    database = db.get_db()
    
    # Convert route to dict and add metadata
    route_data = route.dict()
    route_data["id"] = f"route-{datetime.utcnow().timestamp()}"
    route_data["status"] = "active"
    route_data["created_at"] = datetime.utcnow()
    route_data["created_by"] = current_user.get("email")
    
    # Insert into database
    await database.routes.insert_one(route_data)
    
    # Remove MongoDB _id and return
    route_data.pop("_id", None)
    return route_data

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

# Global Schedule Endpoints
@app.get("/api/admin/global-schedule")
async def get_global_schedule(current_user: dict = Depends(get_admin_user)):
    """Get the global schedule settings"""
    database = db.get_db()
    schedule = await database.global_schedule.find_one({})
    
    if not schedule:
        # Return defaults if not set
        return {
            "morningTripTime": "7:00 AM",
            "halfDayTripTime": "1:00 PM",
            "eveningTripTime": "4:45 PM",
            "examEveningTime": "5:20 PM"
        }
    
    schedule.pop("_id", None)
    return schedule

@app.post("/api/admin/global-schedule")
async def save_global_schedule(schedule: GlobalSchedule, current_user: dict = Depends(get_admin_user)):
    """Save global schedule settings"""
    database = db.get_db()
    
    schedule_data = schedule.dict()
    schedule_data["updated_at"] = datetime.utcnow()
    
    # Upsert (update or insert)
    await database.global_schedule.update_one(
        {},
        {"$set": schedule_data},
        upsert=True
    )
    
    return {"message": "Global schedule saved successfully", "schedule": schedule_data}

@app.post("/api/admin/apply-global-schedule")
async def apply_global_schedule(current_user: dict = Depends(get_admin_user)):
    """Apply global schedule to all routes"""
    database = db.get_db()
    
    # Get global schedule
    schedule = await database.global_schedule.find_one({})
    if not schedule:
        raise HTTPException(status_code=404, detail="Global schedule not found")
    
    # Update all routes
    result = await database.routes.update_many(
        {},
        {"$set": {
            "morningTripTime": schedule.get("morningTripTime", "7:00 AM"),
            "halfDayTripTime": schedule.get("halfDayTripTime", "1:00 PM"),
            "eveningTripTime": schedule.get("eveningTripTime", "4:45 PM"),
            "examEveningTime": schedule.get("examEveningTime", "5:20 PM"),
            "useGlobalSchedule": True,
            "updated_at": datetime.utcnow()
        }}
    )
    
    return {
        "message": "Global schedule applied to all routes",
        "routes_updated": result.modified_count
    }

# Today's Schedule Endpoints
@app.get("/api/admin/today-schedule")
async def get_today_schedule(current_user: dict = Depends(get_admin_user)):
    """Get today's schedule type"""
    database = db.get_db()
    today_schedule = await database.today_schedule.find_one({})
    
    if not today_schedule:
        return {"scheduleType": "regular"}
    
    today_schedule.pop("_id", None)
    return today_schedule

@app.post("/api/admin/today-schedule")
async def set_today_schedule(schedule: TodaySchedule, current_user: dict = Depends(get_admin_user)):
    """Set today's schedule type"""
    database = db.get_db()
    
    schedule_data = schedule.dict()
    schedule_data["updated_at"] = datetime.utcnow()
    schedule_data["date"] = datetime.utcnow().date().isoformat()
    
    # Upsert (update or insert)
    await database.today_schedule.update_one(
        {},
        {"$set": schedule_data},
        upsert=True
    )
    
    return {"message": "Today's schedule updated successfully", "schedule": schedule_data}

# Public endpoint for students to get today's schedule
@app.get("/api/today-schedule")
async def get_today_schedule_public():
    """Get today's schedule type (public endpoint)"""
    database = db.get_db()
    today_schedule = await database.today_schedule.find_one({})
    
    if not today_schedule:
        return {"scheduleType": "regular"}
    
    today_schedule.pop("_id", None)
    return today_schedule

# Bus Management Endpoints
@app.get("/api/admin/buses")
async def get_admin_buses(current_user: dict = Depends(get_admin_user)):
    """Get all buses (admin only)"""
    database = db.get_db()
    buses = await database.buses.find({}).to_list(100)
    for bus in buses:
        bus["id"] = str(bus.pop("_id"))
    return buses

@app.post("/api/admin/buses")
async def create_bus(bus_data: dict, current_user: dict = Depends(get_admin_user)):
    """Create a new bus (admin only)"""
    database = db.get_db()
    
    # Add metadata
    bus_data["created_at"] = datetime.utcnow()
    bus_data["updated_at"] = datetime.utcnow()
    
    # Set default status if not provided
    if "status" not in bus_data:
        bus_data["status"] = "active"
    
    # Insert into database
    result = await database.buses.insert_one(bus_data)
    
    # Return created bus
    bus_data["id"] = str(result.inserted_id)
    bus_data.pop("_id", None)
    
    return {"message": "Bus created successfully", "bus": bus_data}

@app.put("/api/admin/buses/{bus_id}")
async def update_bus(bus_id: str, bus_data: dict, current_user: dict = Depends(get_admin_user)):
    """Update a bus (admin only)"""
    database = db.get_db()
    
    from bson import ObjectId
    
    # Add updated timestamp
    bus_data["updated_at"] = datetime.utcnow()
    
    # Update in database
    result = await database.buses.update_one(
        {"_id": ObjectId(bus_id)},
        {"$set": bus_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Bus not found")
    
    return {"message": "Bus updated successfully"}

@app.delete("/api/admin/buses/{bus_id}")
async def delete_bus(bus_id: str, current_user: dict = Depends(get_admin_user)):
    """Delete a bus (admin only)"""
    database = db.get_db()
    
    from bson import ObjectId
    
    # Delete from database
    result = await database.buses.delete_one({"_id": ObjectId(bus_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Bus not found")
    
    return {"message": "Bus deleted successfully"}

if __name__ == "__main__":
    print("=" * 70)
    print("🚌 BusNotify Backend v2.0 - MongoDB Edition")
    print("=" * 70)
    print("📍 API: http://localhost:8000")
    print("📖 Docs: http://localhost:8000/docs")
    print("👤 Admin: admin@busnotify.com / admin123")
    print("=" * 70)
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
