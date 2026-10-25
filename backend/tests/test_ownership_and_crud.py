import uuid
from datetime import datetime, timezone
from unittest.mock import MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.core.auth import get_current_user, AuthenticatedUser
from app.core.database import get_db, CareerTarget, UserProfile

mock_user_1 = AuthenticatedUser(uid="user_alpha_111", email="alpha@example.com", name="Alpha User")
mock_user_2 = AuthenticatedUser(uid="user_beta_222", email="beta@example.com", name="Beta User")

client = TestClient(app)


def test_profile_get_and_patch_ownership():
    app.dependency_overrides[get_current_user] = lambda: mock_user_1

    mock_db = MagicMock()
    # Profile exists
    now = datetime.now(timezone.utc)
    profile_record = UserProfile(
        firebase_uid=mock_user_1.uid,
        display_name="Alpha Original",
        email="alpha@example.com",
        created_at=now,
        updated_at=now
    )
    mock_db.query.return_value.filter.return_value.first.return_value = profile_record
    app.dependency_overrides[get_db] = lambda: mock_db

    # GET profile
    get_res = client.get("/api/v1/profile")
    assert get_res.status_code == 200
    assert get_res.json()["firebase_uid"] == mock_user_1.uid
    assert get_res.json()["display_name"] == "Alpha Original"

    # PATCH profile
    patch_res = client.patch("/api/v1/profile", json={"display_name": "Alpha Updated"})
    assert patch_res.status_code == 200
    assert profile_record.display_name == "Alpha Updated"

    app.dependency_overrides.clear()


def test_career_target_crud_and_ownership_isolation():
    # Authenticate as user 1
    app.dependency_overrides[get_current_user] = lambda: mock_user_1

    target_id_1 = uuid.uuid4()
    now = datetime.now(timezone.utc)
    owned_target = CareerTarget(
        id=target_id_1,
        firebase_uid=mock_user_1.uid,
        target_role="Full Stack Dev",
        target_company="Stripe",
        target_type="job",
        created_at=now,
        updated_at=now
    )

    mock_db = MagicMock()
    # List targets
    mock_db.query.return_value.filter.return_value.order_by.return_value.all.return_value = [owned_target]
    app.dependency_overrides[get_db] = lambda: mock_db

    list_res = client.get("/api/v1/career-targets")
    assert list_res.status_code == 200
    targets = list_res.json()
    assert len(targets) == 1
    assert targets[0]["firebase_uid"] == mock_user_1.uid
    assert targets[0]["target_role"] == "Full Stack Dev"

    # Update owned target
    mock_db.query.return_value.filter.return_value.first.return_value = owned_target
    update_res = client.patch(f"/api/v1/career-targets/{target_id_1}", json={"target_role": "Lead Architect"})
    assert update_res.status_code == 200
    assert owned_target.target_role == "Lead Architect"

    # Delete owned target
    delete_res = client.delete(f"/api/v1/career-targets/{target_id_1}")
    assert delete_res.status_code == 204

    # Now verify that when target is NOT found or belongs to another user, 404 is returned
    mock_db.query.return_value.filter.return_value.first.return_value = None
    foreign_target_id = uuid.uuid4()
    foreign_patch = client.patch(f"/api/v1/career-targets/{foreign_target_id}", json={"target_role": "Hacker"})
    assert foreign_patch.status_code == 404

    foreign_del = client.delete(f"/api/v1/career-targets/{foreign_target_id}")
    assert foreign_del.status_code == 404

    app.dependency_overrides.clear()
