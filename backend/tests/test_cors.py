from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_cors_preflight_on_various_dev_ports():
    test_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
    ]

    for origin in test_origins:
        response = client.options(
            "/api/v1/dashboard",
            headers={
                "Origin": origin,
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "authorization,content-type",
            },
        )
        assert response.status_code == 200, f"Failed for origin: {origin}"
        assert response.headers.get("access-control-allow-origin") == origin
        assert response.headers.get("access-control-allow-credentials") == "true"


def test_cors_rejects_malicious_external_origin():
    malicious_origins = [
        "https://malicious.example.com",
        "http://attacker.com",
        "http://localhost.evil.com",
    ]

    for origin in malicious_origins:
        response = client.options(
            "/api/v1/dashboard",
            headers={
                "Origin": origin,
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "authorization,content-type",
            },
        )
        assert response.status_code == 400
        assert "Disallowed CORS origin" in response.text
