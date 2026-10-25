import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db, UserProfile
from app.core.auth import get_current_user, AuthenticatedUser
from app.schemas.resume import UserProfileResponse, UserProfileUpdate

logger = logging.getLogger("profile_route")
router = APIRouter(prefix="/profile", tags=["Profile"])


@router.get("", response_model=UserProfileResponse, summary="Get or initialize user profile")
def get_user_profile_endpoint(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves the authenticated user's profile from Supabase user_profiles.
    If the user row does not exist yet, creates it using the verified Firebase identity.
    """
    profile = db.query(UserProfile).filter(UserProfile.firebase_uid == current_user.uid).first()

    if not profile:
        # Create profile row with verified Firebase credentials
        now = datetime.now(timezone.utc)
        profile = UserProfile(
            firebase_uid=current_user.uid,
            display_name=current_user.name or (current_user.email.split("@")[0] if current_user.email else "User"),
            email=current_user.email,
            created_at=now,
            updated_at=now
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
        logger.info("Initialized new profile record for UID: %s", current_user.uid)

    return UserProfileResponse(
        firebase_uid=profile.firebase_uid,
        display_name=profile.display_name,
        email=profile.email,
        created_at=profile.created_at.isoformat() if profile.created_at else "",
        updated_at=profile.updated_at.isoformat() if profile.updated_at else ""
    )


@router.patch("", response_model=UserProfileResponse, summary="Update user profile")
def update_user_profile_endpoint(
    payload: UserProfileUpdate,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Updates the authenticated user's own profile fields in user_profiles.
    """
    profile = db.query(UserProfile).filter(UserProfile.firebase_uid == current_user.uid).first()

    if not profile:
        now = datetime.now(timezone.utc)
        profile = UserProfile(
            firebase_uid=current_user.uid,
            display_name=payload.display_name or current_user.name,
            email=payload.email or current_user.email,
            created_at=now,
            updated_at=now
        )
        db.add(profile)
    else:
        if payload.display_name is not None:
            profile.display_name = payload.display_name
        if payload.email is not None:
            profile.email = payload.email
        profile.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(profile)

    return UserProfileResponse(
        firebase_uid=profile.firebase_uid,
        display_name=profile.display_name,
        email=profile.email,
        created_at=profile.created_at.isoformat() if profile.created_at else "",
        updated_at=profile.updated_at.isoformat() if profile.updated_at else ""
    )
