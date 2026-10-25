import logging
from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db, CareerTarget, ResumeScoreHistory
from app.core.auth import get_current_user, AuthenticatedUser
from app.schemas.resume import DashboardResponse, CareerTargetResponse

logger = logging.getLogger("dashboard_route")
router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("", response_model=DashboardResponse, summary="Get real dashboard statistics and history")
def get_dashboard_data(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Computes real longitudinal metrics from Supabase PostgreSQL:
    - Total analyses count
    - Latest score and delta vs previous analysis
    - Current career target
    - Chronological score progression for chart
    - Recent analyses table items
    - Category score breakdown from latest analysis
    """
    # 1. Total Analyses Count
    total_count = (
        db.query(ResumeScoreHistory)
        .filter(ResumeScoreHistory.firebase_uid == current_user.uid)
        .count()
    )

    # 2. Score History (sorted chronologically ascending for the line chart)
    all_scores_asc = (
        db.query(ResumeScoreHistory)
        .filter(ResumeScoreHistory.firebase_uid == current_user.uid)
        .order_by(ResumeScoreHistory.analyzed_at.asc())
        .all()
    )

    score_history_list = []
    for row in all_scores_asc:
        dt = row.analyzed_at
        short_date = dt.strftime("%b %d") if dt else ""
        score_history_list.append({
            "id": str(row.id),
            "date": short_date,
            "score": row.overall_score,
            "analyzed_at": row.analyzed_at.isoformat() if row.analyzed_at else ""
        })

    # 3. Latest score & delta
    latest_score = None
    previous_score = None
    score_delta = None
    score_breakdown = None

    if len(all_scores_asc) > 0:
        latest_row = all_scores_asc[-1]
        latest_score = latest_row.overall_score
        score_breakdown = {
            "skillsMatch": latest_row.skills_score,
            "experienceProjects": latest_row.experience_score,
            "contentQuality": latest_row.content_score,
            "structureReadability": latest_row.structure_score,
            "completeness": latest_row.completeness_score,
        }

        if len(all_scores_asc) > 1:
            prev_row = all_scores_asc[-2]
            previous_score = prev_row.overall_score
            diff = latest_score - previous_score
            score_delta = f"+{diff} from previous" if diff >= 0 else f"{diff} from previous"

    # 4. Recent analyses table (most recent 5 analyses descending)
    recent_records = (
        db.query(ResumeScoreHistory, CareerTarget.target_role)
        .outerjoin(CareerTarget, ResumeScoreHistory.career_target_id == CareerTarget.id)
        .filter(ResumeScoreHistory.firebase_uid == current_user.uid)
        .order_by(ResumeScoreHistory.analyzed_at.desc())
        .limit(5)
        .all()
    )

    recent_analyses_list = []
    for hist, target_role in recent_records:
        dt = hist.analyzed_at
        type_label = "Job Match" if hist.analysis_type == "job_match" else "General"
        recent_analyses_list.append({
            "id": str(hist.id),
            "date": dt.strftime("%b %d, %Y") if dt else "N/A",
            "targetRole": target_role or "Resume Analysis",
            "type": type_label,
            "score": hist.overall_score
        })

    # 5. Current Career Target (latest configured target)
    latest_target = (
        db.query(CareerTarget)
        .filter(CareerTarget.firebase_uid == current_user.uid)
        .order_by(CareerTarget.updated_at.desc())
        .first()
    )

    current_target_data = None
    if latest_target:
        current_target_data = CareerTargetResponse(
            id=str(latest_target.id),
            firebase_uid=latest_target.firebase_uid,
            target_role=latest_target.target_role,
            target_company=latest_target.target_company,
            target_type=latest_target.target_type,
            created_at=latest_target.created_at.isoformat() if latest_target.created_at else "",
            updated_at=latest_target.updated_at.isoformat() if latest_target.updated_at else ""
        )

    return DashboardResponse(
        latest_score=latest_score,
        previous_score=previous_score,
        score_delta=score_delta,
        total_analyses=total_count,
        current_target=current_target_data,
        score_history=score_history_list,
        recent_analyses=recent_analyses_list,
        score_breakdown=score_breakdown
    )
