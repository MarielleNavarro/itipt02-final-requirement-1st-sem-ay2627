
import secrets
import bcrypt

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.database import get_db_connection
from app.security import hash_password, verify_password, create_access_token


router = APIRouter()


class RegisterRequest(BaseModel):
    first_name: str
    last_name: str
    username: str
    password: str


class LoginRequest(BaseModel):
    username: str
    password: str


class ForgotPasswordRequest(BaseModel):
    username: str
    recoveryCode: str
    newPassword: str


@router.post("/register", status_code=201)
def register(data: RegisterRequest):
    if not all([
        data.first_name.strip(),
        data.last_name.strip(),
        data.username.strip(),
        data.password
    ]):
        raise HTTPException(
            status_code=400,
            detail="All required fields must be filled."
        )

    if len(data.password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters."
        )

    connection = get_db_connection()

    if connection is None:
        raise HTTPException(
            status_code=500,
            detail="Database connection failed."
        )

    cursor = connection.cursor(dictionary=True)

    try:
        cursor.execute(
            "SELECT id FROM users WHERE username = %s",
            (data.username.strip(),)
        )

        if cursor.fetchone():
            raise HTTPException(
                status_code=409,
                detail="Username already exists."
            )

        recovery_code = secrets.token_hex(4).upper()

        password_hash = hash_password(data.password)
        recovery_hash = hash_password(recovery_code)

        cursor.execute(
            """
            INSERT INTO users
            (first_name, last_name, username, password, recovery_code)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (
                data.first_name.strip(),
                data.last_name.strip(),
                data.username.strip(),
                password_hash,
                recovery_hash
            )
        )

        user_id = cursor.lastrowid
        connection.commit()

        return {
            "message": "Registration successful.",
            "userId": user_id,
            "recoveryCode": recovery_code
        }

    except HTTPException:
        connection.rollback()
        raise

    except Exception:
        connection.rollback()
        raise HTTPException(
            status_code=500,
            detail="Registration failed."
        )

    finally:
        cursor.close()
        connection.close()


@router.post("/login")
def login(data: LoginRequest):
    connection = get_db_connection()

    if connection is None:
        raise HTTPException(
            status_code=500,
            detail="Database connection failed."
        )

    cursor = connection.cursor(dictionary=True)

    try:
        cursor.execute(
            """
            SELECT id, first_name, last_name, username, password
            FROM users
            WHERE username = %s
            """,
            (data.username,)
        )

        user = cursor.fetchone()

        if not user or not verify_password(
            data.password,
            user["password"]
        ):
            raise HTTPException(
                status_code=401,
                detail="Invalid username or password."
            )

        token = create_access_token(
            user["id"],
            user["username"]
        )

        return {
            "message": "Login successful.",
            "token": token,
            "user": {
                "id": user["id"],
                "first_name": user["first_name"],
                "last_name": user["last_name"],
                "username": user["username"]
            }
        }

    finally:
        cursor.close()
        connection.close()


@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest):
    if len(data.newPassword) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters."
        )

    connection = get_db_connection()

    if connection is None:
        raise HTTPException(
            status_code=500,
            detail="Database connection failed."
        )

    cursor = connection.cursor(dictionary=True)

    try:
        cursor.execute(
            """
            SELECT id, recovery_code
            FROM users
            WHERE username = %s
            """,
            (data.username,)
        )

        user = cursor.fetchone()

        if not user or not verify_password(
            data.recoveryCode,
            user["recovery_code"]
        ):
            raise HTTPException(
                status_code=400,
                detail="Invalid username or recovery code."
            )

        new_recovery_code = secrets.token_hex(4).upper()

        new_password_hash = hash_password(data.newPassword)
        new_recovery_hash = hash_password(new_recovery_code)

        cursor.execute(
            """
            UPDATE users
            SET password = %s, recovery_code = %s
            WHERE id = %s
            """,
            (
                new_password_hash,
                new_recovery_hash,
                user["id"]
            )
        )

        connection.commit()

        return {
            "message": "Password reset successful.",
            "recoveryCode": new_recovery_code
        }

    except HTTPException:
        connection.rollback()
        raise

    except Exception:
        connection.rollback()
        raise HTTPException(
            status_code=500,
            detail="Password reset failed."
        )

    finally:
        cursor.close()
        connection.close()
