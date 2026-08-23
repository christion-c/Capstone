import json

from app.json_store import read_json


def test_read_json_missing_file_returns_default(tmp_path):
    missing = tmp_path / "missing.json"

    assert read_json(missing, default={"a": 1}) == {"a": 1}


def test_read_json_corrupt_file_returns_default(tmp_path):
    corrupt = tmp_path / "corrupt.json"
    corrupt.write_text("{not valid json", encoding="utf-8")

    assert read_json(corrupt, default=[]) == []


def test_read_json_valid_file_returns_parsed_content(tmp_path):
    valid = tmp_path / "valid.json"
    payload = {"key": "value", "n": 3, "nested": [1, 2, 3]}
    valid.write_text(json.dumps(payload), encoding="utf-8")

    assert read_json(valid, default=None) == payload
