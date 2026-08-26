# Coverage for the per-client-IP rate limit added to /predict,
# /fill-up-history, and /ml-preview (see app/main.py) - this service
# used to have none at all, notable because its Cloud Run ingress is
# "all" (open to the public internet), so require_internal_token was
# the only thing standing between it and unlimited request volume.

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

AUTH_HEADERS = {"X-Internal-Token": "test-only-internal-token"}


def test_predict_allows_requests_within_the_limit():
    for _ in range(5):
        response = client.post(
            "/predict",
            json={"entries": [{"date": "2026-08-01", "fuelCost": 50}]},
            headers=AUTH_HEADERS,
        )
        assert response.status_code == 200


def test_predict_returns_429_once_the_limit_is_exceeded():
    for _ in range(30):
        response = client.post(
            "/predict",
            json={"entries": [{"date": "2026-08-01", "fuelCost": 50}]},
            headers=AUTH_HEADERS,
        )
        assert response.status_code == 200

    response = client.post(
        "/predict",
        json={"entries": [{"date": "2026-08-01", "fuelCost": 50}]},
        headers=AUTH_HEADERS,
    )

    assert response.status_code == 429
    body = response.json()
    assert "error" in body


def test_health_is_not_rate_limited():
    # /health has no @limiter.limit decorator - a monitoring/uptime
    # check hitting it frequently shouldn't ever get throttled.
    for _ in range(40):
        response = client.get("/health")
        assert response.status_code == 200
