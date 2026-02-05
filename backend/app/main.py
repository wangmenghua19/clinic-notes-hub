from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import init_db
from app.api.resources import router as resources_router
from app.api.shares import router as shares_router
from app.api.categories import router as categories_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(
    title="MedStudy-Archive API",
    description="医疗学习资料管理系统后端API",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure uploads directory exists to prevent StaticFiles error
import os
# Use absolute path to ensure we create/mount the correct directory regardless of CWD
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
try:
    os.makedirs(UPLOADS_DIR, exist_ok=True)
except Exception as e:
    print(f"Warning: Could not create uploads directory: {e}")

if os.path.exists(UPLOADS_DIR):
    print(f"Mounting uploads directory at: {UPLOADS_DIR}")
    app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")
else:
    print(f"Warning: Uploads directory {UPLOADS_DIR} does not exist, skipping mount.")

app.include_router(resources_router)
app.include_router(shares_router)
app.include_router(categories_router)

# Production: Serve React App
import os
from fastapi.responses import FileResponse

# Check if running in production (or if build directory exists)
# In Render, we will move the 'dist' folder to 'app/static' or similar, 
# or just serve from the root/dist if we structure it that way.
# Let's assume the build output is in "../dist" relative to this file (if local) 
# or "./dist" if we move it during build.
dist_path = os.path.join(os.path.dirname(__file__), "../dist")
if not os.path.exists(dist_path):
    dist_path = os.path.join(os.path.dirname(__file__), "static/dist")

if os.path.exists(dist_path):
    app.mount("/assets", StaticFiles(directory=os.path.join(dist_path, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        # Allow API calls to pass through
        if full_path.startswith("api") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
            return {"status": "404", "message": "Not Found"}
        
        # Serve index.html for all other routes (SPA)
        file_path = os.path.join(dist_path, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        
        return FileResponse(os.path.join(dist_path, "index.html"))

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}
