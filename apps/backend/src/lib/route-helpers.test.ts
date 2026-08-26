import assert from "node:assert/strict";
import { test } from "node:test";

import { z } from "zod";
import type { Request, Response } from "express";

import type { UserProfile } from "../modules/users/users.repository.js";
import {
  asyncHandler,
  parseRouteParam,
  respondNotFound,
  respondWithValidationError,
  requireCurrentUser,
  withCurrentUser,
} from "./route-helpers.js";

function createResponse() {
  const state: { statusCode?: number; body?: unknown } = {};

  const response = {
    status(code: number) {
      state.statusCode = code;
      return response;
    },
    json(body: unknown) {
      state.body = body;
      return response;
    },
    end() {
      return response;
    },
  } as unknown as Response;

  return { response, state };
}

const fakeUser: UserProfile = {
  id: "user-1",
  firebaseUid: "firebase-1",
  email: "user@example.test",
  displayName: null,
  photoUrl: null,
  emailVerified: true,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

test("requireCurrentUser returns the profile when present on the request", () => {
  const request = { currentUser: fakeUser } as unknown as Request;
  const { response, state } = createResponse();

  const result = requireCurrentUser(request, response);

  assert.equal(result, fakeUser);
  assert.equal(state.statusCode, undefined);
});

test("requireCurrentUser responds with 500 and returns null when the profile is missing", () => {
  const request = {} as unknown as Request;
  const { response, state } = createResponse();

  const result = requireCurrentUser(request, response);

  assert.equal(result, null);
  assert.equal(state.statusCode, 500);
  assert.deepEqual(state.body, { error: "User profile unavailable" });
});

test("asyncHandler forwards a rejected promise to next instead of throwing", async () => {
  const failure = new Error("boom");
  const handler = asyncHandler(async () => {
    throw failure;
  });
  const request = {} as unknown as Request;
  const { response } = createResponse();
  let forwardedError: unknown;
  const next = (error?: unknown) => {
    forwardedError = error;
  };

  await handler(request, response, next as never);

  // asyncHandler's internal .catch(next) is fire-and-forget, so give
  // the microtask queue a turn before asserting.
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(forwardedError, failure);
});

test("withCurrentUser calls through with the resolved user when present", async () => {
  const request = { currentUser: fakeUser } as unknown as Request;
  const { response } = createResponse();
  let receivedUser: UserProfile | undefined;
  const handler = withCurrentUser(async (currentUser) => {
    receivedUser = currentUser;
  });

  await handler(request, response, (() => {}) as never);

  assert.equal(receivedUser, fakeUser);
});

test("withCurrentUser short-circuits with 500 and never calls the handler when the user is missing", async () => {
  const request = {} as unknown as Request;
  const { response, state } = createResponse();
  let handlerCalled = false;
  const handler = withCurrentUser(async () => {
    handlerCalled = true;
  });

  await handler(request, response, (() => {}) as never);

  assert.equal(handlerCalled, false);
  assert.equal(state.statusCode, 500);
});

test("respondWithValidationError maps zod issues to flat field/message pairs, including nested paths", () => {
  const schema = z.object({
    email: z.string(),
    address: z.object({ zip: z.string() }),
  });
  const result = schema.safeParse({ email: 5, address: { zip: 10 } });
  assert.equal(result.success, false);
  if (result.success) {
    return;
  }
  const { response, state } = createResponse();

  respondWithValidationError(response, result.error, "Invalid input");

  assert.equal(state.statusCode, 400);
  const body = state.body as {
    error: string;
    details: { field: string; message: string }[];
  };
  assert.equal(body.error, "Invalid input");
  assert.ok(body.details.some((detail) => detail.field === "email"));
  assert.ok(body.details.some((detail) => detail.field === "address.zip"));
});

test("respondNotFound responds with 404 and a labeled message", () => {
  const { response, state } = createResponse();

  respondNotFound(response, "Vehicle");

  assert.equal(state.statusCode, 404);
  assert.deepEqual(state.body, { error: "Vehicle not found" });
});

test("parseRouteParam returns the parsed value for valid input", () => {
  const { response } = createResponse();

  const result = parseRouteParam(
    response,
    z.string().uuid(),
    "550e8400-e29b-41d4-a716-446655440000",
    "vehicleId",
  );

  assert.equal(result, "550e8400-e29b-41d4-a716-446655440000");
});

test("parseRouteParam responds with 400 and returns null for invalid input", () => {
  const { response, state } = createResponse();

  const result = parseRouteParam(
    response,
    z.string().uuid(),
    "not-a-uuid",
    "vehicleId",
  );

  assert.equal(result, null);
  assert.equal(state.statusCode, 400);
  assert.deepEqual(state.body, { error: "Invalid vehicleId" });
});
