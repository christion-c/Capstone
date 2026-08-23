# Test-only default for the shared secret app.main's require_internal_token
# dependency checks. Must be set before any test module imports app.main,
# so this lives at conftest.py's module level (loaded before test
# collection) rather than in a fixture. Mirrors apps/backend's test script,
# which exports a real value the same way for the equivalent Node service.
import os

os.environ.setdefault("INTERNAL_SERVICE_TOKEN", "test-only-internal-token")
