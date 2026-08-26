import test from "node:test";
import assert from "node:assert/strict";
import { after, before } from "node:test";
import type { AddressInfo } from "node:net";

import { createApp } from "../../app.js";
import { entrySchema } from "./fill-up-history.routes.js";

// Matches the default the test script exports (see package.json's
// "test" script) before env.ts is ever imported.
const CORRECT_INTERNAL_TOKEN = "test-only-internal-token";

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

test("GET /fill-up-history rejects a request with no Authorization header", async () => {
  const response = await fetch(`${baseUrl}/fill-up-history`);

  assert.equal(response.status, 401);
});

test("POST /fill-up-history rejects a request with no Authorization header", async () => {
  const response = await fetch(`${baseUrl}/fill-up-history`, {
    method: "POST",
  });

  assert.equal(response.status, 401);
});

test("GET /fill-up-history/internal rejects a request with no internal token", async () => {
  const response = await fetch(
    `${baseUrl}/fill-up-history/internal?firebase_uid=some-uid`,
  );

  assert.equal(response.status, 401);
});

test("GET /fill-up-history/internal rejects a request with the wrong internal token", async () => {
  const response = await fetch(
    `${baseUrl}/fill-up-history/internal?firebase_uid=some-uid`,
    {
      headers: { "X-Internal-Token": "wrong-token" },
    },
  );

  assert.equal(response.status, 401);
});

test("GET /fill-up-history/internal rejects a missing firebase_uid query param even with a valid token", async () => {
  const response = await fetch(`${baseUrl}/fill-up-history/internal`, {
    headers: { "X-Internal-Token": CORRECT_INTERNAL_TOKEN },
  });

  assert.equal(response.status, 400);
  const body = (await response.json()) as { error: string };
  assert.equal(body.error, "firebase_uid query param required");
});

test("entrySchema accepts an explicit fill-up date", () => {
  const result = entrySchema.safeParse({
    milesDriven: 150,
    fuelPrice: 3.89,
    combinedMpg: 30,
    tankCapacity: 14,
    gallons: 12.4,
    observedCost: 48.14,
    recordedAt: "2026-08-12T08:30:00-05:00",
  });

  assert.equal(result.success, true);
});

test("entrySchema accepts a missing fill-up date", () => {
  const result = entrySchema.safeParse({
    milesDriven: 150,
    fuelPrice: 3.89,
    combinedMpg: 30,
    tankCapacity: 14,
    gallons: 12.4,
    observedCost: 48.14,
  });

  assert.equal(result.success, true);
});

test("entrySchema rejects an invalid fill-up date", () => {
  const result = entrySchema.safeParse({
    milesDriven: 150,
    fuelPrice: 3.89,
    combinedMpg: 30,
    tankCapacity: 14,
    gallons: 12.4,
    observedCost: 48.14,
    recordedAt: "not-a-date",
  });

  assert.equal(result.success, false);
});
