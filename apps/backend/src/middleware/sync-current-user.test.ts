import assert from "node:assert/strict";
import { after, mock, test } from "node:test";

import type { DecodedIdToken } from "firebase-admin/auth";
import type { Request, Response } from "express";

import type {
  UpsertUserInput,
  UserProfile,
} from "../modules/users/users.repository.js";

const upsertUserFromFirebase =
  mock.fn<(input: UpsertUserInput) => Promise<UserProfile>>();

const mockedUsersModule = mock.module("../modules/users/users.repository.js", {
  namedExports: { upsertUserFromFirebase },
});

after(() => {
  mockedUsersModule.restore();
});

// Imported after mock.module() so the middleware picks up the mocked
// repository instead of hitting a real database.
const { syncCurrentUser } = await import("./sync-current-user.js");

// syncCurrentUser is wrapped in asyncHandler, which fires the async
// work and returns synchronously (see route-helpers.ts's
// `handler(...).catch(next)`) - a caller awaiting the call itself
// doesn't actually wait for that work to finish, so tests give the
// microtask queue one turn before asserting on its effects.
function flush(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

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
  } as unknown as Response;

  return { response, state };
}

const fakeProfile: UserProfile = {
  id: "user-1",
  firebaseUid: "firebase-1",
  email: "user@example.test",
  displayName: null,
  photoUrl: null,
  emailVerified: true,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

test("syncCurrentUser rejects a request with no verified auth", async () => {
  upsertUserFromFirebase.mock.resetCalls();
  const request = {} as unknown as Request;
  const { response, state } = createResponse();
  const next = mock.fn();

  syncCurrentUser(request, response, next as never);
  await flush();

  assert.equal(state.statusCode, 401);
  assert.equal(upsertUserFromFirebase.mock.callCount(), 0);
  assert.equal(next.mock.callCount(), 0);
});

test("syncCurrentUser maps Firebase's snake_case claims and attaches the synced profile", async () => {
  upsertUserFromFirebase.mock.resetCalls();
  upsertUserFromFirebase.mock.mockImplementationOnce(async () => fakeProfile);

  const decodedToken = {
    uid: "firebase-1",
    email: "user@example.test",
    name: "Jordan",
    picture: "https://example.test/photo.jpg",
    email_verified: true,
  } as unknown as DecodedIdToken;
  const request = { auth: decodedToken } as unknown as Request;
  const { response } = createResponse();
  const next = mock.fn();

  syncCurrentUser(request, response, next as never);
  await flush();

  assert.equal(next.mock.callCount(), 1);
  assert.equal(request.currentUser, fakeProfile);
  assert.deepEqual(upsertUserFromFirebase.mock.calls[0]?.arguments[0], {
    firebaseUid: "firebase-1",
    email: "user@example.test",
    displayName: "Jordan",
    photoUrl: "https://example.test/photo.jpg",
    emailVerified: true,
  });
});

test("syncCurrentUser defaults missing optional claims to null/false", async () => {
  upsertUserFromFirebase.mock.resetCalls();
  upsertUserFromFirebase.mock.mockImplementationOnce(async () => fakeProfile);

  const decodedToken = { uid: "firebase-1" } as unknown as DecodedIdToken;
  const request = { auth: decodedToken } as unknown as Request;
  const { response } = createResponse();
  const next = mock.fn();

  syncCurrentUser(request, response, next as never);
  await flush();

  assert.deepEqual(upsertUserFromFirebase.mock.calls[0]?.arguments[0], {
    firebaseUid: "firebase-1",
    email: null,
    displayName: null,
    photoUrl: null,
    emailVerified: false,
  });
});
