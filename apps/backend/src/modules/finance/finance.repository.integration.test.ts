import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import {
  createTestUser,
  deleteTestUser,
  ensureSchemaReady,
} from "../../test-support/db-test-helpers.js";
import {
  getFinanceInputsForUser,
  upsertFinanceInputsForUser,
  type FinanceInputs,
} from "./finance.repository.js";

let dbAvailable = false;
let userId = "";

before(async () => {
  dbAvailable = await ensureSchemaReady();

  if (dbAvailable) {
    userId = await createTestUser();
  }
});

after(async () => {
  if (dbAvailable) {
    await deleteTestUser(userId);
  }
});

test("getFinanceInputsForUser returns empty defaults when nothing is saved yet", async (t) => {
  if (!dbAvailable) {
    t.skip("DATABASE_URL is not reachable; skipping integration test.");
    return;
  }

  const otherUserId = await createTestUser();

  const inputs = await getFinanceInputsForUser(otherUserId);

  assert.deepEqual(inputs, {
    incomeInput: "",
    expenseInput: "",
    monthlyFixedCostsInput: "",
    fuelGallonsInput: "",
    fuelPriceInput: "",
    milesPerWeekInput: "",
    combinedMpgInput: "",
    tankCapacityInput: "",
    currentTankPercentInput: "",
  });

  await deleteTestUser(otherUserId);
});

// Every field below uses a distinct value so a mapping bug (e.g. two
// columns swapped, or a camelCase/snake_case pair mismatched) shows up
// as a specific field mismatch rather than passing by coincidence.
const initialInputs: FinanceInputs = {
  incomeInput: "3200.00",
  expenseInput: "1800.50",
  monthlyFixedCostsInput: "950.25",
  fuelGallonsInput: "12.5",
  fuelPriceInput: "3.79",
  milesPerWeekInput: "210",
  combinedMpgInput: "28.4",
  tankCapacityInput: "14.2",
  currentTankPercentInput: "60",
};

const updatedInputs: FinanceInputs = {
  incomeInput: "4100.75",
  expenseInput: "2200.10",
  monthlyFixedCostsInput: "1075.60",
  fuelGallonsInput: "15.3",
  fuelPriceInput: "4.05",
  milesPerWeekInput: "275",
  combinedMpgInput: "31.1",
  tankCapacityInput: "16.0",
  currentTankPercentInput: "45",
};

test("upsertFinanceInputsForUser creates inputs that round-trip through getFinanceInputsForUser", async (t) => {
  if (!dbAvailable) {
    t.skip("DATABASE_URL is not reachable; skipping integration test.");
    return;
  }

  const created = await upsertFinanceInputsForUser(userId, initialInputs);

  // Verify all 9 fields individually - this is where a mapping typo
  // between camelCase and snake_case columns would silently corrupt data.
  assert.equal(created.incomeInput, initialInputs.incomeInput);
  assert.equal(created.expenseInput, initialInputs.expenseInput);
  assert.equal(
    created.monthlyFixedCostsInput,
    initialInputs.monthlyFixedCostsInput,
  );
  assert.equal(created.fuelGallonsInput, initialInputs.fuelGallonsInput);
  assert.equal(created.fuelPriceInput, initialInputs.fuelPriceInput);
  assert.equal(created.milesPerWeekInput, initialInputs.milesPerWeekInput);
  assert.equal(created.combinedMpgInput, initialInputs.combinedMpgInput);
  assert.equal(created.tankCapacityInput, initialInputs.tankCapacityInput);
  assert.equal(
    created.currentTankPercentInput,
    initialInputs.currentTankPercentInput,
  );

  const fetched = await getFinanceInputsForUser(userId);

  assert.deepEqual(fetched, initialInputs);
});

test("upsertFinanceInputsForUser updates the existing row on conflict and persists every field", async (t) => {
  if (!dbAvailable) {
    t.skip("DATABASE_URL is not reachable; skipping integration test.");
    return;
  }

  // userId already has a row from the previous test (one row per user,
  // enforced by ON CONFLICT (user_id)); this exercises the DO UPDATE path.
  const updated = await upsertFinanceInputsForUser(userId, updatedInputs);

  assert.equal(updated.incomeInput, updatedInputs.incomeInput);
  assert.equal(updated.expenseInput, updatedInputs.expenseInput);
  assert.equal(
    updated.monthlyFixedCostsInput,
    updatedInputs.monthlyFixedCostsInput,
  );
  assert.equal(updated.fuelGallonsInput, updatedInputs.fuelGallonsInput);
  assert.equal(updated.fuelPriceInput, updatedInputs.fuelPriceInput);
  assert.equal(updated.milesPerWeekInput, updatedInputs.milesPerWeekInput);
  assert.equal(updated.combinedMpgInput, updatedInputs.combinedMpgInput);
  assert.equal(updated.tankCapacityInput, updatedInputs.tankCapacityInput);
  assert.equal(
    updated.currentTankPercentInput,
    updatedInputs.currentTankPercentInput,
  );

  const fetched = await getFinanceInputsForUser(userId);

  assert.deepEqual(fetched, updatedInputs);
});
