import assert from "node:assert/strict";
import { after, afterEach, before, mock, test } from "node:test";

import type { BudgetPrediction } from "@thinktwice/shared-types";

import { env } from "../../config/env.js";
import type { ForecastEntryInput } from "./predictions.client.js";
import { requestForecast, requestPreview } from "./predictions.client.js";

const originalFetch = global.fetch;
const fetchMock = mock.fn<typeof fetch>();

before(() => {
  global.fetch = fetchMock as unknown as typeof fetch;
});

after(() => {
  global.fetch = originalFetch;
});

afterEach(() => {
  fetchMock.mock.resetCalls();
  fetchMock.mock.restore();
});

const sampleEntries: ForecastEntryInput[] = [
  {
    entryDate: "2026-08-01",
    fuelCost: 60,
    foodCost: 20,
    milesDriven: 150,
    meals: 14,
  },
  {
    entryDate: "2026-08-08",
    fuelCost: 65,
    foodCost: 16,
    milesDriven: 160,
    meals: 15,
  },
];

const samplePrediction: BudgetPrediction = {
  predictedFuelCost: 62,
  predictedFoodCost: 18,
  predictedTotal: 80,
  method: "linear_regression",
  sampleSize: 2,
};

test("requestForecast returns ok with the prediction on a successful response", async () => {
  fetchMock.mock.mockImplementation(
    async () => new Response(JSON.stringify(samplePrediction), { status: 200 }),
  );

  const outcome = await requestForecast(sampleEntries);

  assert.deepEqual(outcome, { status: "ok", prediction: samplePrediction });

  // The ML service's contract expects `date`, not `entryDate` - a
  // mismatch here would silently break every forecast request.
  const [url, init] = fetchMock.mock.calls[0]?.arguments ?? [];
  assert.equal(url, `${env.ML_SERVICE_URL}/predict`);
  const body = JSON.parse((init as RequestInit).body as string) as {
    entries: Array<{ date: string }>;
  };
  assert.equal(body.entries[0]?.date, "2026-08-01");
  assert.equal(body.entries.length, 2);
});

test("requestForecast returns service-error on a non-2xx response", async () => {
  fetchMock.mock.mockImplementation(
    async () =>
      new Response(JSON.stringify({ error: "bad input" }), { status: 500 }),
  );

  const outcome = await requestForecast(sampleEntries);

  assert.deepEqual(outcome, { status: "service-error" });
});

test("requestForecast returns unreachable when the network call fails", async () => {
  fetchMock.mock.mockImplementation(async () => {
    throw new TypeError("fetch failed");
  });

  const outcome = await requestForecast(sampleEntries);

  assert.deepEqual(outcome, { status: "unreachable" });
});

test("requestForecast rethrows a non-network error", async () => {
  fetchMock.mock.mockImplementation(async () => {
    throw new Error("something unexpected");
  });

  await assert.rejects(
    () => requestForecast(sampleEntries),
    /something unexpected/,
  );
});

test("requestPreview returns ok with the preview payload on a successful response", async () => {
  const previewPayload = { predictedMilesDriven: 120, method: "average" };

  fetchMock.mock.mockImplementation(
    async () => new Response(JSON.stringify(previewPayload), { status: 200 }),
  );

  const outcome = await requestPreview("caller-firebase-uid", 120);

  assert.deepEqual(outcome, { status: "ok", preview: previewPayload });

  // Verify the request always uses the caller's own identity and the
  // internal service token - not a client-supplied value - since that's
  // exactly the vulnerability this route was added to close.
  const [url, init] = fetchMock.mock.calls[0]?.arguments ?? [];
  const requestUrl = new URL(url as string);
  assert.equal(requestUrl.searchParams.get("user_id"), "caller-firebase-uid");
  assert.equal(requestUrl.searchParams.get("miles_driven"), "120");
  const headers = (init as RequestInit).headers as Record<string, string>;
  assert.equal(headers["X-Internal-Token"], env.INTERNAL_SERVICE_TOKEN);
});

test("requestPreview returns service-error on a non-2xx response", async () => {
  fetchMock.mock.mockImplementation(
    async () => new Response(null, { status: 502 }),
  );

  const outcome = await requestPreview("caller-firebase-uid", 120);

  assert.deepEqual(outcome, { status: "service-error" });
});

test("requestPreview returns unreachable when the network call fails", async () => {
  fetchMock.mock.mockImplementation(async () => {
    throw new TypeError("fetch failed");
  });

  const outcome = await requestPreview("caller-firebase-uid", 120);

  assert.deepEqual(outcome, { status: "unreachable" });
});
