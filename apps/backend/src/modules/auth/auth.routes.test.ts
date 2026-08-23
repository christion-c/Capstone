import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { AddressInfo } from "node:net";

import { createApp } from "../../app.js";

// GET /me needs a verified Firebase token to reach the authenticated
// success path, which isn't practical to test without a live Firebase
// project. What's testable without one is that the route is actually
// gated by requireAuth.
let baseUrl = "";
let server: ReturnType<ReturnType<typeof createApp>["listen"]>;

before(async () => {
  const app = createApp();

  await new Promise<void>((resolve) => {
    server = app.listen(0, () => resolve());
  });

  const address = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("GET /auth/me rejects a request with no Authorization header", async () => {
  const response = await fetch(`${baseUrl}/auth/me`);

  assert.equal(response.status, 401);
  const body = (await response.json()) as { error: string };
  assert.equal(body.error, "Authentication required");
});

test("GET /auth/me rejects a request with a malformed Authorization header", async () => {
  const response = await fetch(`${baseUrl}/auth/me`, {
    headers: { Authorization: "Token abc123" },
  });

  assert.equal(response.status, 401);
  const body = (await response.json()) as { error: string };
  assert.equal(
    body.error,
    "Authorization header must use Bearer authentication",
  );
});
