# Coverage for the require_internal_token dependency guarding
# GET /ml-preview, POST /fill-up-history, and POST /predict (see
# app/main.py). /ml-preview and /fill-up-history used to be reachable
# with no auth at all, letting anyone pass an arbitrary ?user_id= and
# read that user's fill-up history; /predict was missing the same guard
# separately (it has no user_id to leak, but was an unauthenticated,
# unthrottled compute endpoint reachable by anyone who could reach this
# service). This checks the fix actually rejects unauthenticated/
# incorrectly-authenticated requests and still serves correctly-
# authenticated ones, for all three.

from fastapi.testclient import TestClient

from app import history as ml_history
from app.main import app

client = TestClient(app)

# Matches the default set by tests/conftest.py before app.main is imported.
CORRECT_TOKEN = "test-only-internal-token"
WRONG_TOKEN = "definitely-not-the-right-token"


def test_ml_preview_rejects_request_with_no_token_header():
    response = client.get("/ml-preview")

    assert response.status_code == 401


def test_ml_preview_rejects_request_with_wrong_token():
    response = client.get("/ml-preview", headers={"X-Internal-Token": WRONG_TOKEN})

    assert response.status_code == 401


def test_ml_preview_succeeds_with_correct_token(tmp_path, monkeypatch):
    monkeypatch.setattr(ml_history, "HISTORY_PATH", tmp_path / "user_history.json")

    response = client.get(
        "/ml-preview",
        params={"miles_driven": 120, "user_id": "auth-test-user"},
        headers={"X-Internal-Token": CORRECT_TOKEN},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["fuel_prediction"] > 0


def test_fill_up_history_rejects_request_with_no_token_header():
    response = client.post("/fill-up-history", json={"user_id": "auth-test-user"})

    assert response.status_code == 401


def test_fill_up_history_rejects_request_with_wrong_token():
    response = client.post(
        "/fill-up-history",
        json={"user_id": "auth-test-user"},
        headers={"X-Internal-Token": WRONG_TOKEN},
    )

    assert response.status_code == 401


def test_fill_up_history_succeeds_with_correct_token(tmp_path, monkeypatch):
    monkeypatch.setattr(ml_history, "HISTORY_PATH", tmp_path / "user_history.json")

    response = client.post(
        "/fill-up-history",
        json={"user_id": "auth-test-user", "miles_driven": 100},
        headers={"X-Internal-Token": CORRECT_TOKEN},
    )

    assert response.status_code == 200
    body = response.json()
    assert body == {"ok": True, "saved": 1}


def test_predict_rejects_request_with_no_token_header():
    response = client.post("/predict", json={"entries": [{"date": "2026-08-01", "fuelCost": 50}]})

    assert response.status_code == 401


def test_predict_rejects_request_with_wrong_token():
    response = client.post(
        "/predict",
        json={"entries": [{"date": "2026-08-01", "fuelCost": 50}]},
        headers={"X-Internal-Token": WRONG_TOKEN},
    )

    assert response.status_code == 401


def test_predict_succeeds_with_correct_token():
    response = client.post(
        "/predict",
        json={"entries": [{"date": "2026-08-01", "fuelCost": 50}]},
        headers={"X-Internal-Token": CORRECT_TOKEN},
    )

    assert response.status_code == 200
