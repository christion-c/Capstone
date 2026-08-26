import assert from "node:assert/strict";
import { test } from "node:test";

import { expectOneRow, numericOrNull } from "./db-helpers.js";

test("expectOneRow returns the first row when present", () => {
  const result = expectOneRow({ rows: [{ id: "1" }, { id: "2" }] }, "user");

  assert.deepEqual(result, { id: "1" });
});

test("expectOneRow throws a labeled error when rows is empty", () => {
  assert.throws(
    () => expectOneRow({ rows: [] }, "vehicle"),
    /PostgreSQL did not return the vehicle\./,
  );
});

test("numericOrNull converts a numeric string to a number", () => {
  assert.equal(numericOrNull("42.5"), 42.5);
});

test("numericOrNull preserves null instead of coercing it to 0", () => {
  assert.equal(numericOrNull(null), null);
});

test("numericOrNull converts a zero string to the number 0, not null", () => {
  assert.equal(numericOrNull("0"), 0);
});
