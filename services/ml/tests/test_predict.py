from fastapi.testclient import TestClient

from app.main import app, build_prediction, recency_weighted_average

client = TestClient(app)

# Matches the default set by tests/conftest.py before app.main is
# imported. /predict now requires this like every other non-health
# route on this service (see test_auth.py for the auth-boundary tests
# themselves) - this file is about the prediction math, so every call
# here just authenticates the same way rather than re-proving the guard.
AUTH_HEADERS = {"X-Internal-Token": "test-only-internal-token"}


def test_health():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_predict_rejects_empty_entries():
    response = client.post("/predict", json={"entries": []}, headers=AUTH_HEADERS)

    assert response.status_code == 422


def test_predict_falls_back_to_average_below_the_regression_threshold():
    response = client.post(
        "/predict",
        json={
            "entries": [
                {
                    "date": "2026-08-01",
                    "fuelCost": 60,
                    "foodCost": 20,
                    "milesDriven": 150,
                    "meals": 14,
                },
                {
                    "date": "2026-08-08",
                    "fuelCost": 70,
                    "foodCost": 30,
                    "milesDriven": 160,
                    "meals": 16,
                },
            ]
        },
        headers=AUTH_HEADERS,
    )

    assert response.status_code == 200
    body = response.json()

    assert body["method"] == "average"
    assert body["sampleSize"] == 2
    assert body["predictedFuelCost"] == 65.0
    assert body["predictedFoodCost"] == 0.0
    assert body["predictedTotal"] == 65.0


def test_predict_uses_regression_at_the_threshold_and_beyond():
    entries = [
        {
            "date": f"2026-08-{day:02d}",
            "fuelCost": 10 + miles * 0.1,
            "foodCost": 5 + meals * 2,
            "milesDriven": miles,
            "meals": meals,
        }
        for day, (miles, meals) in enumerate([(100, 10), (150, 12), (200, 14), (250, 16)], start=1)
    ]

    response = client.post("/predict", json={"entries": entries}, headers=AUTH_HEADERS)

    assert response.status_code == 200
    body = response.json()

    assert body["method"] == "linear_regression"
    assert body["sampleSize"] == 4
    assert body["predictedFuelCost"] > 0
    assert body["predictedFoodCost"] == 0.0
    assert body["predictedTotal"] == round(body["predictedFuelCost"], 2)


def test_predict_ignores_food_and_meals_for_fuel_only_forecasts():
    response = client.post(
        "/predict",
        json={
            "entries": [
                {
                    "date": "2026-08-01",
                    "fuelCost": 50,
                    "foodCost": 20,
                    "milesDriven": 100,
                    "meals": 10,
                },
                {
                    "date": "2026-08-08",
                    "fuelCost": 60,
                    "foodCost": 25,
                    "milesDriven": 140,
                    "meals": 12,
                },
                {
                    "date": "2026-08-15",
                    "fuelCost": 70,
                    "foodCost": 30,
                    "milesDriven": 180,
                    "meals": 14,
                },
            ]
        },
        headers=AUTH_HEADERS,
    )

    assert response.status_code == 200
    body = response.json()
    assert body["method"] == "linear_regression"
    assert body["predictedFoodCost"] == 0.0
    assert body["predictedTotal"] == body["predictedFuelCost"]


def test_recency_weighted_average_prioritizes_the_second_most_recent_entry():
    values = [53.0, 80.0, 65.0, 60.0, 55.0]

    result = recency_weighted_average(values)

    assert result is not None
    assert 70.0 < result < 80.0
    assert result > recency_weighted_average([80.0, 53.0, 65.0, 60.0, 55.0])


def test_predict_scales_realistically_with_miles_driven():
    response = client.post(
        "/predict",
        json={
            "entries": [
                {
                    "date": "2026-08-01",
                    "fuelCost": 52.5,
                    "foodCost": 0,
                    "milesDriven": 180,
                    "meals": 0,
                },
                {
                    "date": "2026-08-08",
                    "fuelCost": 63.0,
                    "foodCost": 0,
                    "milesDriven": 210,
                    "meals": 0,
                },
                {
                    "date": "2026-08-15",
                    "fuelCost": 75.0,
                    "foodCost": 0,
                    "milesDriven": 250,
                    "meals": 0,
                },
            ]
        },
        headers=AUTH_HEADERS,
    )

    assert response.status_code == 200
    body = response.json()
    assert body["predictedFuelCost"] > 20.0
    assert body["predictedFuelCost"] < 100.0
    assert body["predictedFuelCost"] > 1.5 * 20.0


def test_build_prediction_scales_realistically_with_miles_driven():
    # No seeded history for this user, so this exercises the synthetic
    # baseline dataset's cost-per-mile scaling directly - the separate
    # history-blend path is covered by test_main.py's
    # test_build_prediction_blends_math_with_user_history.
    prediction_120 = build_prediction(miles_driven=120, user_id="realistic-user")
    prediction_200 = build_prediction(miles_driven=200, user_id="realistic-user")

    assert prediction_120["fuel_prediction"] > 10.0
    assert prediction_200["fuel_prediction"] > prediction_120["fuel_prediction"] * 1.5
    assert prediction_200["fuel_prediction"] > 20.0


def test_predict_rejects_a_negative_cost():
    response = client.post(
        "/predict",
        json={
            "entries": [
                {"date": "2026-08-01", "fuelCost": -5},
            ]
        },
        headers=AUTH_HEADERS,
    )

    assert response.status_code == 422


def test_predict_rejects_a_cost_above_the_upper_bound():
    # Mirrors the backend's own Zod upper bound for this field
    # (budget.routes.ts) - without it, an unbounded ge=0 field accepts
    # values like float("inf"), which can propagate into a non-JSON
    # -serializable Infinity in the response.
    response = client.post(
        "/predict",
        json={"entries": [{"date": "2026-08-01", "fuelCost": 100_000}]},
        headers=AUTH_HEADERS,
    )

    assert response.status_code == 422


def test_predict_rejects_more_entries_than_the_cap():
    entries = [{"date": "2026-08-01", "fuelCost": 10} for _ in range(367)]

    response = client.post("/predict", json={"entries": entries}, headers=AUTH_HEADERS)

    assert response.status_code == 422


def test_predict_rejects_a_malformed_date():
    response = client.post(
        "/predict",
        json={"entries": [{"date": "not-a-date"}]},
        headers=AUTH_HEADERS,
    )

    assert response.status_code == 422


def test_predict_validation_error_uses_the_shared_error_shape():
    # A malformed body used to come back as FastAPI/Pydantic's own
    # {"detail": [...]} shape (with internal field/type names), rather
    # than the {"error": "..."} shape every other error response on
    # this service uses - see the RequestValidationError handler in
    # app/main.py.
    response = client.post(
        "/predict",
        json={"entries": [{"date": "not-a-date"}]},
        headers=AUTH_HEADERS,
    )

    body = response.json()
    assert "error" in body
    assert isinstance(body["error"], str)
    assert "detail" not in body
