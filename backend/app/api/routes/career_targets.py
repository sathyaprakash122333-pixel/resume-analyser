import logging
import uuid
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db, CareerTarget, UserProfile
from app.core.auth import get_current_user, AuthenticatedUser
from app.schemas.resume import (
    CareerTargetCreate, 
    CareerTargetUpdate, 
    CareerTargetResponse
)

logger = logging.getLogger("career_targets_route")
router = APIRouter(prefix="/career-targets", tags=["Career Targets"])


def ensure_user_profile_exists(db: Session, current_user: AuthenticatedUser):
    profile = db.query(UserProfile).filter(UserProfile.firebase_uid == current_user.uid).first()
    if not profile:
        now = datetime.now(timezone.utc)
        profile = UserProfile(
            firebase_uid=current_user.uid,
            display_name=current_user.name or "User",
            email=current_user.email,
            created_at=now,
            updated_at=now
        )
        db.add(profile)
        db.commit()


@router.get("", response_model=List[CareerTargetResponse], summary="List authenticated user's career targets")
def list_career_targets(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns all career targets belonging to the verified Firebase user in reverse chronological order.
    """
    targets = (
        db.query(CareerTarget)
        .filter(CareerTarget.firebase_uid == current_user.uid)
        .order_by(CareerTarget.created_at.desc())
        .all()
    )

    return [
        CareerTargetResponse(
            id=str(t.id),
            firebase_uid=t.firebase_uid,
            target_role=t.target_role,
            target_company=t.target_company,
            target_type=t.target_type,
            created_at=t.created_at.isoformat() if t.created_at else "",
            updated_at=t.updated_at.isoformat() if t.updated_at else ""
        )
        for t in targets
    ]


@router.post("", response_model=CareerTargetResponse, status_code=status.HTTP_201_CREATED, summary="Create a career target")
def create_career_target(
    payload: CareerTargetCreate,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Creates a new career target owned by the authenticated user.
    """
    ensure_user_profile_exists(db, current_user)

    now = datetime.now(timezone.utc)
    new_target = CareerTarget(
        id=uuid.uuid4(),
        firebase_uid=current_user.uid,
        target_role=payload.target_role,
        target_company=payload.target_company,
        target_type=payload.target_type or "job",
        created_at=now,
        updated_at=now
    )
    db.add(new_target)
    db.commit()
    db.refresh(new_target)

    return CareerTargetResponse(
        id=str(new_target.id),
        firebase_uid=new_target.firebase_uid,
        target_role=new_target.target_role,
        target_company=new_target.target_company,
        target_type=new_target.target_type,
        created_at=new_target.created_at.isoformat() if new_target.created_at else "",
        updated_at=new_target.updated_at.isoformat() if new_target.updated_at else ""
    )


@router.patch("/{target_id}", response_model=CareerTargetResponse, summary="Update an owned career target")
def update_career_target(
    target_id: str,
    payload: CareerTargetUpdate,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Updates an existing career target, ensuring strict ownership validation.
    """
    try:
        target_uuid = uuid.UUID(target_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid UUID format for career target ID."
        )

    target = (
        db.query(CareerTarget)
        .filter(CareerTarget.id == target_uuid, CareerTarget.firebase_uid == current_user.uid)
        .first()
    )

    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Career target not found or access denied."
        )

    if payload.target_role is not None:
        target.target_role = payload.target_role
    if payload.target_company is not None:
        target.target_company = payload.target_company
    if payload.target_type is not None:
        target.target_type = payload.target_type

    target.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(target)

    return CareerTargetResponse(
        id=str(target.id),
        firebase_uid=target.firebase_uid,
        target_role=target.target_role,
        target_company=target.target_company,
        target_type=target.target_type,
        created_at=target.created_at.isoformat() if target.created_at else "",
        updated_at=target.updated_at.isoformat() if target.updated_at else ""
    )


@router.delete("/{target_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete an owned career target")
def delete_career_target(
    target_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Deletes an existing career target owned by the authenticated user.
    """
    try:
        target_uuid = uuid.UUID(target_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid UUID format for career target ID."
        )

    target = (
        db.query(CareerTarget)
        .filter(CareerTarget.id == target_uuid, CareerTarget.firebase_uid == current_user.uid)
        .first()
    )

    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Career target not found or access denied."
        )

    db.delete(target)
    db.commit()
    return None
