import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_protected_routes_reject_missing_token():
    routes = [
        "/api/v1/profile",
        "/api/v1/career-targets",
        "/api/v1/dashboard",
        "/api/v1/analyses/history",
    ]
    for route in routes:
        response = client.get(route)
        assert response.status_code == 401
        assert "Authorization header missing" in response.json()["detail"]


def test_protected_routes_reject_malformed_token():
    # Bad schema prefix
    response = client.get("/api/v1/dashboard", headers={"Authorization": "Token invalid_token"})
    assert response.status_code == 401
    assert "Invalid authorization format" in response.json()["detail"]

    # Missing token part
    response2 = client.get("/api/v1/dashboard", headers={"Authorization": "Bearer"})
    assert response2.status_code == 401


def test_protected_routes_reject_forged_token():
    response = client.get("/api/v1/dashboard", headers={"Authorization": "Bearer forged.jwt.token"})
    assert response.status_code == 401
    assert "Invalid or unauthorized authentication token" in response.json()["detail"]
