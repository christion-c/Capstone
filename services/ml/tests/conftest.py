# Test-only default for the shared secret app.main's require_internal_token
# dependency checks. Must be set before any test module imports app.main,
# so this lives at conftest.py's module level (loaded before test
# collection) rather than in a fixture. Mirrors apps/backend's test script,
# which exports a real value the same way for the equivalent Node service.
import os

import pytest

os.environ.setdefault("INTERNAL_SERVICE_TOKEN", "test-only-internal-token")


@pytest.fixture(autouse=True)
def _reset_rate_limiter():
    # app.main's limiter is a module-level singleton with in-memory
    # storage that otherwise persists across the whole pytest session -
    # every test's TestClient calls share the same key (remote address),
    # so without this, a test file that happens to run late could start
    # failing from a 429 caused by an earlier, unrelated test file's call
    # volume rather than its own behavior. Reset before every test so
    # each one starts with a clean rate-limit window.
    from app.main import limiter

    limiter.reset()
    yield
