import assert from "node:assert/strict";
import { test } from "node:test";

import { createApp } from "./app.js";

test("createApp trusts exactly one reverse-proxy hop (Cloud Run's own)", () => {
  // Without this, express-rate-limit can't safely identify clients by
  // IP behind Cloud Run's proxy (it logs a validation warning and risks
  // treating every request as coming from one shared client) - `1`
  // specifically, not `true`, so a client can't spoof additional
  // X-Forwarded-For hops to fake a different apparent IP.
  const app = createApp();

  assert.equal(app.get("trust proxy"), 1);
});
