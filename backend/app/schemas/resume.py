from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator
from datetime import datetime


# =====================================================================
# Profile Schemas
# =====================================================================

class UserProfileResponse(BaseModel):
    firebase_uid: str
    display_name: Optional[str] = None
    email: Optional[str] = None
    created_at: str
    updated_at: str


class UserProfileUpdate(BaseModel):
    display_name: Optional[str] = Field(None, max_length=150)
    email: Optional[str] = Field(None, max_length=150)


# =====================================================================
# Career Target Schemas
# =====================================================================

class CareerTargetCreate(BaseModel):
    target_role: str = Field(..., min_length=2, max_length=150)
    target_company: Optional[str] = Field(None, max_length=150)
    target_type: str = Field("job", max_length=50)

    @field_validator("target_role")
    def validate_role(cls, v):
        if not v or not v.strip():
            raise ValueError("Target role cannot be blank.")
        return v.strip()


class CareerTargetUpdate(BaseModel):
    target_role: Optional[str] = Field(None, min_length=2, max_length=150)
    target_company: Optional[str] = Field(None, max_length=150)
    target_type: Optional[str] = Field(None, max_length=50)


class CareerTargetResponse(BaseModel):
    id: str
    firebase_uid: str
    target_role: str
    target_company: Optional[str] = None
    target_type: str
    created_at: str
    updated_at: str


# =====================================================================
# Resume Analysis & Evaluation Schemas
# =====================================================================

class CategoryScores(BaseModel):
    skills_score: int = Field(..., ge=0, le=100)
    experience_score: int = Field(..., ge=0, le=100)
    content_score: int = Field(..., ge=0, le=100)
    structure_score: int = Field(..., ge=0, le=100)
    completeness_score: int = Field(..., ge=0, le=100)


class JobMatchDetail(BaseModel):
    percentage: int = Field(..., ge=0, le=100)
    title: str
    description: str


class AnalysisResponse(BaseModel):
    analysis_id: str
    target_role: str
    target_company: Optional[str] = None
    analysis_type: str
    overall_score: int = Field(..., ge=0, le=100)
    skills_score: int = Field(..., ge=0, le=100)
    experience_score: int = Field(..., ge=0, le=100)
    content_score: int = Field(..., ge=0, le=100)
    structure_score: int = Field(..., ge=0, le=100)
    completeness_score: int = Field(..., ge=0, le=100)
    category_scores: Dict[str, int]
    status_label: str
    strengths: List[str]
    areas_to_improve: List[str]
    missing_skills: List[str]
    recommendations: List[str]
    evidence_excerpts: List[str]
    job_match: Optional[JobMatchDetail] = None
    analyzed_at: str


# =====================================================================
# History & Dashboard Schemas
# =====================================================================

class ScoreHistoryItem(BaseModel):
    id: str
    firebase_uid: str
    career_target_id: Optional[str] = None
    analysis_type: str
    overall_score: int
    skills_score: int
    experience_score: int
    content_score: int
    structure_score: int
    completeness_score: int
    analyzed_at: str
    date_formatted: str
    target_role: Optional[str] = None


class DashboardResponse(BaseModel):
    latest_score: Optional[int] = None
    previous_score: Optional[int] = None
    score_delta: Optional[str] = None
    total_analyses: int = 0
    current_target: Optional[CareerTargetResponse] = None
    score_history: List[Dict[str, Any]] = Field(default_factory=list)
    recent_analyses: List[Dict[str, Any]] = Field(default_factory=list)
    score_breakdown: Optional[Dict[str, int]] = None
