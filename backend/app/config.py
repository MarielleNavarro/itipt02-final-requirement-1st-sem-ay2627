
import os
from pathlib import Path
from dotenv import load_dotenv

# Get the backend folder location
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from backend/.env
ENV_FILE = BASE_DIR / ".env"
load_dotenv(ENV_FILE)

# Database configuration
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "med_intake_db")

# JWT configuration
JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440

# Upload configuration
UPLOAD_DIR = BASE_DIR / "uploads"
