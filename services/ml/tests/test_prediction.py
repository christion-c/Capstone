from app import prediction as ml_prediction
from app.models import BudgetEntry
from app.prediction import (
    MIN_ENTRIES_FOR_REGRESSION,
    _baseline_cost_per_mile,
    _blend_with_history,
    predict_by_regression,
    recency_weighted_average,
)


def test_recency_weighted_average_returns_none_for_empty_list():
    assert recency_weighted_average([]) is None


def test_recency_weighted_average_returns_the_only_value_for_a_single_entry():
    assert recency_weighted_average([42.0]) == 42.0


def test_recency_weighted_average_returns_none_when_every_value_is_non_positive():
    assert recency_weighted_average([0.0, -5.0, -1.0]) is None


def test_predict_by_regression_falls_back_to_a_zeroed_average_when_every_entry_is_unusable():
    # At/above MIN_ENTRIES_FOR_REGRESSION so /predict would route here,
    # but every entry has non-positive miles or cost - valid_entries
    # ends up empty, a distinct branch from the "entries list itself is
    # empty" case (which /predict rejects with a 422 before this
    # function is ever called).
    entries = [
        BudgetEntry(date="2026-08-01", fuelCost=0, milesDriven=100),
        BudgetEntry(date="2026-08-08", fuelCost=50, milesDriven=0),
        BudgetEntry(date="2026-08-15", fuelCost=0, milesDriven=0),
    ]
    assert len(entries) >= MIN_ENTRIES_FOR_REGRESSION

    result = predict_by_regression(entries)

    assert result.method == "average"
    assert result.predicted_fuel_cost == 0.0
    assert result.predicted_total == 0.0
    assert result.sample_size == len(entries)


def test_blend_with_history_returns_unblended_baseline_when_history_is_empty(monkeypatch):
    monkeypatch.setattr(ml_prediction, "load_user_history", lambda user_id=None: [])

    fuel_prediction, history_count, blended, blend_weight = _blend_with_history(
        user_id="no-history-user", miles_driven=120, baseline_prediction=30.0
    )

    assert fuel_prediction == 30.0
    assert history_count == 0
    assert blended is False
    assert blend_weight == 0.0


def test_blend_with_history_weight_at_one_entry(monkeypatch):
    # blend_weight = min(0.9, 0.65 + 0.05 * min(history_count, 10))
    # history_count=1 -> 0.65 + 0.05 = 0.70
    fake_history = [{"observed_cost": 40.0, "miles_driven": 100}]
    monkeypatch.setattr(ml_prediction, "load_user_history", lambda user_id=None: fake_history)

    _, history_count, blended, blend_weight = _blend_with_history(
        user_id="one-entry-user", miles_driven=100, baseline_prediction=30.0
    )

    assert history_count == 1
    assert blended is True
    assert round(blend_weight, 2) == 0.70


def test_blend_with_history_weight_caps_at_ninety_percent_by_ten_entries(monkeypatch):
    # history_count=10 -> 0.65 + 0.05*10 = 1.15, capped to 0.90 (the cap).
    fake_history = [{"observed_cost": 40.0, "miles_driven": 100} for _ in range(10)]
    monkeypatch.setattr(ml_prediction, "load_user_history", lambda user_id=None: fake_history)

    _, history_count, blended, blend_weight = _blend_with_history(
        user_id="ten-entry-user", miles_driven=100, baseline_prediction=30.0
    )

    assert history_count == 10
    assert blended is True
    assert round(blend_weight, 2) == 0.90


def test_blend_with_history_weight_stays_capped_beyond_ten_entries(monkeypatch):
    # history_count=15 -> min(history_count, 10) still clamps the
    # formula's input to 10, so the weight doesn't grow past the cap
    # just because there's even more history.
    fake_history = [{"observed_cost": 40.0, "miles_driven": 100} for _ in range(15)]
    monkeypatch.setattr(ml_prediction, "load_user_history", lambda user_id=None: fake_history)

    _, history_count, blended, blend_weight = _blend_with_history(
        user_id="many-entries-user", miles_driven=100, baseline_prediction=30.0
    )

    assert history_count == 15
    assert blended is True
    assert round(blend_weight, 2) == 0.90


def test_baseline_cost_per_mile_falls_back_to_a_flat_rate_when_rows_are_unusable():
    # Every row has zero miles, so _rates filters all of them out and
    # the function falls back to its documented flat-rate default
    # rather than dividing by zero.
    unusable_rows = [{"fuel_cost": 10.0, "miles_driven": 0} for _ in range(5)]

    assert _baseline_cost_per_mile(unusable_rows) == 0.29


def test_baseline_cost_per_mile_falls_back_for_empty_rows():
    assert _baseline_cost_per_mile([]) == 0.29
