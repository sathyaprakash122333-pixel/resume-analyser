import logging
import json
import os
from typing import Optional
from dataclasses import dataclass
from fastapi import Header, HTTPException, status
import firebase_admin
from firebase_admin import auth as firebase_auth, credentials
from google.auth.exceptions import DefaultCredentialsError
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests
from app.core.config import settings

logger = logging.getLogger("auth")

_firebase_initialized = False
_http_request = google_requests.Request()


def init_firebase_admin():
    global _firebase_initialized
    if _firebase_initialized or len(firebase_admin._apps) > 0:
        _firebase_initialized = True
        return

    try:
        if settings.firebase_credentials_json:
            cred_dict = json.loads(settings.firebase_credentials_json)
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred)
            _firebase_initialized = True
            logger.info("Firebase Admin initialized via credentials JSON.")
        elif settings.resolved_firebase_credentials_path:
            cred = credentials.Certificate(settings.resolved_firebase_credentials_path)
            firebase_admin.initialize_app(cred)
            _firebase_initialized = True
            logger.info("Firebase Admin initialized via certificate file: %s", settings.resolved_firebase_credentials_path)
        elif settings.firebase_project_id:
            # Initialize with project ID; verifies Google-issued ID tokens
            firebase_admin.initialize_app(options={"projectId": settings.firebase_project_id})
            _firebase_initialized = True
            logger.info("Firebase Admin initialized with projectId: %s", settings.firebase_project_id)
        else:
            logger.warning("No explicit Firebase credentials configured.")
    except Exception as e:
        logger.error("Failed to initialize Firebase Admin SDK: %s", e)


# Attempt non-blocking initialization on module load
init_firebase_admin()


@dataclass
class AuthenticatedUser:
    uid: str
    email: Optional[str] = None
    name: Optional[str] = None


async def get_current_user(authorization: Optional[str] = Header(None)) -> AuthenticatedUser:
    """
    FastAPI dependency that extracts and verifies the Firebase ID token from the Bearer header.
    Supports both full service account credentials and public key JWKS verification.
    Returns AuthenticatedUser with cryptographically verified Firebase UID.
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing. Please provide a Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization format. Must be 'Bearer <token>'.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    id_token = parts[1]

    # Initialize if not yet initialized
    if not _firebase_initialized and len(firebase_admin._apps) == 0:
        init_firebase_admin()

    decoded_token = None

    # 1. Attempt verification using Firebase Admin SDK
    try:
        decoded_token = firebase_auth.verify_id_token(id_token)
    except firebase_auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Firebase ID token has expired. Please refresh your session."
        )
    except firebase_auth.RevokedIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Firebase ID token has been revoked."
        )
    except (DefaultCredentialsError, Exception) as e:
        # 2. Fall back to Google public key verification (JWKS / x509 certs)
        try:
            decoded_token = google_id_token.verify_firebase_token(
                id_token,
                _http_request,
                audience=settings.firebase_project_id
            )
        except Exception as inner_e:
            logger.warning("Firebase token verification failure: %s (fallback: %s)", e, inner_e)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or unauthorized authentication token."
            )

    uid = decoded_token.get("uid") or decoded_token.get("sub") or decoded_token.get("user_id")
    if not uid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token verified but missing UID claim."
        )

    return AuthenticatedUser(
        uid=uid,
        email=decoded_token.get("email"),
        name=decoded_token.get("name")
    )
