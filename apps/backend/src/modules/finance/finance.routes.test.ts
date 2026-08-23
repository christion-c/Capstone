import assert from "node:assert/strict";
import { test } from "node:test";

import { financeInputsSchema } from "./finance.routes.js";

const validInputs = {
  incomeInput: "3200",
  expenseInput: "1800",
  monthlyFixedCostsInput: "950",
  fuelGallonsInput: "12.5",
  fuelPriceInput: "3.79",
  milesPerWeekInput: "210",
  combinedMpgInput: "28",
  tankCapacityInput: "14",
  currentTankPercentInput: "60",
};

test("financeInputsSchema accepts a full valid set of inputs", () => {
  const result = financeInputsSchema.safeParse(validInputs);

  assert.equal(result.success, true);
});

test("financeInputsSchema rejects a missing field", () => {
  const { incomeInput: _incomeInput, ...withoutIncome } = validInputs;

  const result = financeInputsSchema.safeParse(withoutIncome);

  assert.equal(result.success, false);
});

test("financeInputsSchema rejects a non-string value", () => {
  const result = financeInputsSchema.safeParse({
    ...validInputs,
    incomeInput: 3200,
  });

  assert.equal(result.success, false);
});

test("financeInputsSchema rejects a value over the max length", () => {
  const result = financeInputsSchema.safeParse({
    ...validInputs,
    incomeInput: "1".repeat(31),
  });

  assert.equal(result.success, false);
});

test("financeInputsSchema accepts a value at the max length", () => {
  const result = financeInputsSchema.safeParse({
    ...validInputs,
    incomeInput: "1".repeat(30),
  });

  assert.equal(result.success, true);
});

test("financeInputsSchema rejects unknown fields", () => {
  const result = financeInputsSchema.safeParse({
    ...validInputs,
    notes: "extra field",
  });

  assert.equal(result.success, false);
});

test("financeInputsSchema accepts an empty string for a field", () => {
  const result = financeInputsSchema.safeParse({
    ...validInputs,
    incomeInput: "",
  });

  assert.equal(result.success, true);
});
