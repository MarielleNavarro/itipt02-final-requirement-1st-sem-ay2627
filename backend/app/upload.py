
from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile, HTTPException

from app.config import UPLOAD_DIR


ALLOWED_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp"
}

MAX_FILE_SIZE = 5 * 1024 * 1024


async def save_medicine_image(file: UploadFile) -> str:
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Only JPG, JPEG, PNG, and WEBP images are allowed."
        )

    file_content = await file.read()

    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="Image size must not exceed 5 MB."
        )

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    extension = ALLOWED_TYPES[file.content_type]
    filename = f"medicine-{uuid4().hex}{extension}"

    file_path = UPLOAD_DIR / filename
    file_path.write_bytes(file_content)

    return f"/uploads/{filename}"


def delete_medicine_image(image_path: str | None):
    if not image_path:
        return

    filename = Path(image_path).name
    file_path = UPLOAD_DIR / filename

    if file_path.exists() and file_path.is_file():
        file_path.unlink()
