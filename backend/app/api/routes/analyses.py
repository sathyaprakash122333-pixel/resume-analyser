import logging
import time
import uuid
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Response
from sqlalchemy.orm import Session
from app.core.database import get_db, UserProfile, CareerTarget, ResumeScoreHistory
from app.core.auth import get_current_user, AuthenticatedUser
from app.services.extractor import extract_and_validate_pdf
from app.services.gemini_service import evaluate_resume_with_gemini
from app.schemas.resume import AnalysisResponse, ScoreHistoryItem

logger = logging.getLogger("analyses_route")
router = APIRouter(prefix="/analyses", tags=["Resume Analysis"])


def ensure_profile_and_target(
    db: Session, 
    current_user: AuthenticatedUser, 
    target_role: str, 
    target_company: Optional[str]
) -> CareerTarget:
    # 1. Ensure profile exists
    profile = db.query(UserProfile).filter(UserProfile.firebase_uid == current_user.uid).first()
    now = datetime.now(timezone.utc)
    if not profile:
        profile = UserProfile(
            firebase_uid=current_user.uid,
            display_name=current_user.name or "User",
            email=current_user.email,
            created_at=now,
            updated_at=now
        )
        db.add(profile)
        db.flush()

    # 2. Find or create career target
    query = db.query(CareerTarget).filter(
        CareerTarget.firebase_uid == current_user.uid,
        CareerTarget.target_role == target_role.strip()
    )
    if target_company and target_company.strip():
        query = query.filter(CareerTarget.target_company == target_company.strip())
    
    target = query.first()
    if not target:
        target = CareerTarget(
            id=uuid.uuid4(),
            firebase_uid=current_user.uid,
            target_role=target_role.strip(),
            target_company=target_company.strip() if target_company else None,
            target_type="job",
            created_at=now,
            updated_at=now
        )
        db.add(target)
        db.flush()
    return target


@router.post("", response_model=AnalysisResponse, status_code=status.HTTP_201_CREATED, summary="Analyze uploaded resume PDF")
async def analyze_resume_endpoint(
    response: Response,
    file: UploadFile = File(...),
    target_role: str = Form(...),
    target_company: Optional[str] = Form(None),
    analysis_type: Optional[str] = Form(None),
    analysis_mode: Optional[str] = Form(None),
    job_description: Optional[str] = Form(None),
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    1. Validates and extracts text from resume PDF.
    2. Runs Gemini AI evaluation with structured constraints.
    3. Persists compact score history into Supabase resume_score_history.
    4. Measures and logs time spent across all stages.
    5. Returns comprehensive analysis response without storing raw resume text.
    """
    t_pipeline_start = time.perf_counter()

    clean_role = target_role.strip() if target_role else ""
    if not clean_role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Target job role is required."
        )

    raw_mode = analysis_type or analysis_mode or "general"
    mode = raw_mode.strip().lower()
    if mode not in ("general", "job_match"):
        mode = "general"

    if mode == "job_match" and (not job_description or not job_description.strip()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A job description is required when 'Match a specific job description' is selected."
        )

    # Stage 1: Validate and extract readable text from PDF
    t_extract_start = time.perf_counter()
    extracted_text, filename = await extract_and_validate_pdf(file)
    t_extract_end = time.perf_counter()
    extract_ms = (t_extract_end - t_extract_start) * 1000
    logger.info("Stage 1 [PDF Extraction]: %d characters from '%s' in %.2f ms for user %s", len(extracted_text), filename, extract_ms, current_user.uid)

    # Stage 2 & 3: Evaluate using Gemini AI (API call + JSON parsing/scoring)
    t_ai_start = time.perf_counter()
    eval_result = await evaluate_resume_with_gemini(
        resume_text=extracted_text,
        target_role=clean_role,
        target_company=target_company.strip() if target_company else None,
        analysis_type=mode,
        job_description=job_description.strip() if job_description else None
    )
    t_ai_end = time.perf_counter()
    ai_total_ms = (t_ai_end - t_ai_start) * 1000

    timings = eval_result.get("_timings", {})
    gemini_api_ms = timings.get("gemini_api_ms", ai_total_ms)
    json_proc_ms = timings.get("json_proc_ms", 0.0)

    # Stage 4: Supabase Database Writes (Profile, Career Target, Score History)
    t_db_start = time.perf_counter()
    target = ensure_profile_and_target(
        db, current_user, clean_role, target_company
    )

    now = datetime.now(timezone.utc)
    history_id = uuid.uuid4()
    score_record = ResumeScoreHistory(
        id=history_id,
        firebase_uid=current_user.uid,
        career_target_id=target.id,
        analysis_type=mode,
        overall_score=eval_result["overall_score"],
        skills_score=eval_result["skills_score"],
        experience_score=eval_result["experience_score"],
        content_score=eval_result["content_score"],
        structure_score=eval_result["structure_score"],
        completeness_score=eval_result["completeness_score"],
        analyzed_at=now
    )
    db.add(score_record)
    db.commit()
    t_db_end = time.perf_counter()
    db_ms = (t_db_end - t_db_start) * 1000

    total_backend_ms = (time.perf_counter() - t_pipeline_start) * 1000

    # Log comprehensive stage timings
    logger.info(
        "[PIPELINE TIMINGS] User=%s | PDF Extraction: %.2f ms | Gemini API: %.2f ms | JSON Parsing: %.2f ms | Supabase DB: %.2f ms | Total Backend: %.2f ms",
        current_user.uid,
        extract_ms,
        gemini_api_ms,
        json_proc_ms,
        db_ms,
        total_backend_ms
    )

    # Supply Server-Timing headers for standard browser observability
    response.headers["Server-Timing"] = (
        f"pdf;dur={extract_ms:.1f}, "
        f"gemini;dur={gemini_api_ms:.1f}, "
        f"json;dur={json_proc_ms:.1f}, "
        f"db;dur={db_ms:.1f}, "
        f"total;dur={total_backend_ms:.1f}"
    )

    return AnalysisResponse(
        analysis_id=str(score_record.id),
        target_role=clean_role,
        target_company=target_company.strip() if target_company else None,
        analysis_type=mode,
        overall_score=eval_result["overall_score"],
        skills_score=eval_result["skills_score"],
        experience_score=eval_result["experience_score"],
        content_score=eval_result["content_score"],
        structure_score=eval_result["structure_score"],
        completeness_score=eval_result["completeness_score"],
        category_scores=eval_result["category_scores"],
        status_label=eval_result["status_label"],
        strengths=eval_result["strengths"],
        areas_to_improve=eval_result["areas_to_improve"],
        missing_skills=eval_result["missing_skills"],
        recommendations=eval_result["recommendations"],
        evidence_excerpts=eval_result["evidence_excerpts"],
        job_match=eval_result["job_match"],
        analyzed_at=now.isoformat()
    )


@router.get("/history", response_model=List[ScoreHistoryItem], summary="Get authenticated user's resume score history")
def get_score_history_endpoint(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns the authenticated user's score history from Supabase resume_score_history.
    """
    records = (
        db.query(ResumeScoreHistory, CareerTarget.target_role)
        .outerjoin(CareerTarget, ResumeScoreHistory.career_target_id == CareerTarget.id)
        .filter(ResumeScoreHistory.firebase_uid == current_user.uid)
        .order_by(ResumeScoreHistory.analyzed_at.desc())
        .all()
    )

    result = []
    for hist, target_role in records:
        dt = hist.analyzed_at
        date_formatted = dt.strftime("%b %d, %Y") if dt else "N/A"
        result.append(
            ScoreHistoryItem(
                id=str(hist.id),
                firebase_uid=hist.firebase_uid,
                career_target_id=str(hist.career_target_id) if hist.career_target_id else None,
                analysis_type=hist.analysis_type,
                overall_score=hist.overall_score,
                skills_score=hist.skills_score,
                experience_score=hist.experience_score,
                content_score=hist.content_score,
                structure_score=hist.structure_score,
                completeness_score=hist.completeness_score,
                analyzed_at=hist.analyzed_at.isoformat() if hist.analyzed_at else "",
                date_formatted=date_formatted,
                target_role=target_role or "Resume Analysis"
            )
        )
    return result
