
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jwt import PyJWTError

from app.security import verify_access_token


bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)
):
    if credentials is None:
        raise HTTPException(
            status_code=401,
            detail="Access token is required."
        )

    token = credentials.credentials

    try:
        payload = verify_access_token(token)

        user_id = payload.get("id")
        username = payload.get("username")

        if not user_id or not username:
            raise HTTPException(
                status_code=401,
                detail="Invalid access token."
            )

        return {
            "id": user_id,
            "username": username
        }

    except PyJWTError:
        raise HTTPException(
            status_code=403,
            detail="Invalid or expired access token."
        )
