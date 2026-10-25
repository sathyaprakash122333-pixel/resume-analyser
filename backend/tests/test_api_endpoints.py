import io
import pytest
from unittest.mock import MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.core.auth import get_current_user, AuthenticatedUser
from app.core.database import get_db, CareerTarget, UserProfile, ResumeScoreHistory

# Test user
mock_user = AuthenticatedUser(uid="test_user_123", email="test@example.com", name="Test User")

# Override dependencies
def override_get_current_user():
    return mock_user


def create_mock_db():
    db = MagicMock()
    return db


client = TestClient(app)


def test_career_target_creation_validation():
    app.dependency_overrides[get_current_user] = override_get_current_user
    mock_db = create_mock_db()
    app.dependency_overrides[get_db] = lambda: mock_db

    # Missing target_role
    response = client.post("/api/v1/career-targets", json={"target_role": ""})
    assert response.status_code == 422

    # Valid target_role
    response2 = client.post("/api/v1/career-targets", json={"target_role": "Backend Engineer", "target_company": "Acme"})
    assert response2.status_code == 201
    data = response2.json()
    assert data["target_role"] == "Backend Engineer"
    assert data["target_company"] == "Acme"

    app.dependency_overrides.clear()


def test_analyses_requires_job_description_for_job_match():
    app.dependency_overrides[get_current_user] = override_get_current_user
    mock_db = create_mock_db()
    app.dependency_overrides[get_db] = lambda: mock_db

    # Valid dummy PDF
    pdf_bytes = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"
    files = {"file": ("resume.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    data = {
        "target_role": "Backend Engineer",
        "analysis_mode": "job_match",
        "job_description": ""  # Empty job description in job_match mode
    }

    response = client.post("/api/v1/analyses", files=files, data=data)
    assert response.status_code == 400
    assert "job description is required" in response.json()["detail"].lower()

    app.dependency_overrides.clear()
