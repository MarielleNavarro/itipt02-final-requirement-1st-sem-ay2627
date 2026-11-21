
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import UPLOAD_DIR
from app.routes import auth, medicines, history


app = FastAPI(
    title="Medicine Intake Monitoring API",
    description="Backend API for the Medicine Intake Monitoring Application",
    version="1.0.0"
)


# Allow Ionic frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8100",
        "http://localhost:4200",
        "http://127.0.0.1:8100",
        "http://127.0.0.1:4200"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# Create uploads folder if it does not exist
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


# Serve uploaded medicine images
app.mount(
    "/uploads",
    StaticFiles(directory=str(UPLOAD_DIR)),
    name="uploads"
)


# API Routes
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(medicines.router, prefix="/api/medicines", tags=["Medicines"])
app.include_router(history.router, prefix="/api/history", tags=["Medicine History"])


@app.get("/")
def root():
    return {
        "message": "Medicine Intake Monitoring API is running!"
    }
