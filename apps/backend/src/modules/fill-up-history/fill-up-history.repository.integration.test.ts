import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { database } from "../../db/pool.js";
import {
  createTestUser,
  deleteTestUser,
  ensureSchemaReady,
} from "../../test-support/db-test-helpers.js";
import {
  insertFillUpHistory,
  listFillUpHistoryByFirebaseUid,
  listFillUpHistoryByUserId,
} from "./fill-up-history.repository.js";

let dbAvailable = false;
let userId = "";
let userFirebaseUid = "";
let otherUserId = "";

before(async () => {
  dbAvailable = await ensureSchemaReady();

  if (dbAvailable) {
    userId = await createTestUser();
    otherUserId = await createTestUser();

    const row = await database.query<{ firebase_uid: string }>(
      "SELECT firebase_uid FROM users WHERE id = $1",
      [userId],
    );
    userFirebaseUid = row.rows[0]?.firebase_uid ?? "";
  }
});

after(async () => {
  if (dbAvailable) {
    await deleteTestUser(userId);
    await deleteTestUser(otherUserId);
  }
});

test("insertFillUpHistory then listFillUpHistoryByUserId returns the entry, newest first", async (t) => {
  if (!dbAvailable) {
    t.skip("DATABASE_URL is not reachable; skipping integration test.");
    return;
  }

  await insertFillUpHistory(userId, {
    milesDriven: 150,
    fuelPrice: 3.5,
    combinedMpg: 30,
    tankCapacity: 14,
    gallons: 5,
    observedCost: 17.5,
    recordedAt: "2026-01-01T00:00:00Z",
  });

  await insertFillUpHistory(userId, {
    milesDriven: 200,
    fuelPrice: 3.6,
    combinedMpg: 31,
    tankCapacity: 14,
    gallons: 6,
    observedCost: 21.6,
    recordedAt: "2026-02-01T00:00:00Z",
  });

  const entries = await listFillUpHistoryByUserId(userId);

  assert.equal(entries.length, 2);
  // Newest first: the February entry should come before the January one.
  assert.equal(entries[0]?.gallons, 6);
  assert.equal(entries[1]?.gallons, 5);
});

test("insertFillUpHistory defaults recordedAt to now when not provided", async (t) => {
  if (!dbAvailable) {
    t.skip("DATABASE_URL is not reachable; skipping integration test.");
    return;
  }

  const before = Date.now();

  await insertFillUpHistory(userId, {
    milesDriven: 100,
    fuelPrice: 3.0,
    combinedMpg: 28,
    tankCapacity: 12,
    gallons: 4,
    observedCost: 12,
  });

  const entries = await listFillUpHistoryByUserId(userId);
  const created = entries.find((entry) => entry.gallons === 4);

  assert.ok(created);
  assert.ok(created.recordedAt.getTime() >= before);
});

test("listFillUpHistoryByUserId does not leak another user's fill-up history", async (t) => {
  if (!dbAvailable) {
    t.skip("DATABASE_URL is not reachable; skipping integration test.");
    return;
  }

  await insertFillUpHistory(otherUserId, {
    milesDriven: 999,
    fuelPrice: 9.99,
    combinedMpg: 10,
    tankCapacity: 10,
    gallons: 9,
    observedCost: 90,
  });

  const ownEntries = await listFillUpHistoryByUserId(userId);

  assert.ok(!ownEntries.some((entry) => entry.gallons === 9));
});

test("listFillUpHistoryByFirebaseUid returns only the matching user's history", async (t) => {
  if (!dbAvailable) {
    t.skip("DATABASE_URL is not reachable; skipping integration test.");
    return;
  }

  await insertFillUpHistory(userId, {
    milesDriven: 175,
    fuelPrice: 3.75,
    combinedMpg: 29,
    tankCapacity: 13,
    gallons: 6.2,
    observedCost: 23.25,
  });

  const entries = await listFillUpHistoryByFirebaseUid(userFirebaseUid);

  assert.ok(entries.length > 0);
  assert.ok(entries.every((entry) => Number.isFinite(entry.gallons)));
  assert.ok(entries.some((entry) => entry.gallons === 6.2));
  // otherUserId's entry from the previous test must not appear here.
  assert.ok(!entries.some((entry) => entry.gallons === 9));
});

test("listFillUpHistoryByFirebaseUid returns an empty list for an unknown Firebase UID", async (t) => {
  if (!dbAvailable) {
    t.skip("DATABASE_URL is not reachable; skipping integration test.");
    return;
  }

  const entries = await listFillUpHistoryByFirebaseUid(
    "firebase-uid-that-does-not-exist",
  );

  assert.deepEqual(entries, []);
});
