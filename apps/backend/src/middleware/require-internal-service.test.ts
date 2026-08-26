import assert from "node:assert/strict";
import { mock, test } from "node:test";

import type { Request, Response } from "express";

import { requireInternalService } from "./require-internal-service.js";

// Matches the default the test script exports (see package.json's
// "test" script) before this module (and env.ts) is ever imported.
const CORRECT_TOKEN = "test-only-internal-token";

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

function createRequest(token: string | undefined) {
  return {
    header: (name: string) => (name === "x-internal-token" ? token : undefined),
  } as unknown as Request;
}

test("requireInternalService rejects a request with no token header", () => {
  const request = createRequest(undefined);
  const { response, state } = createResponse();
  const next = mock.fn();

  requireInternalService(request, response, next);

  assert.equal(state.statusCode, 401);
  assert.equal(next.mock.callCount(), 0);
});

test("requireInternalService rejects a request with the wrong token", () => {
  const request = createRequest("definitely-not-the-right-token");
  const { response, state } = createResponse();
  const next = mock.fn();

  requireInternalService(request, response, next);

  assert.equal(state.statusCode, 401);
  assert.equal(next.mock.callCount(), 0);
});

test("requireInternalService rejects a token of a different length without throwing", () => {
  // Exercises tokensMatch's hash-first approach: timingSafeEqual throws
  // on mismatched buffer lengths, which hashing both sides to a fixed
  // digest first avoids - a much shorter/longer token should still be a
  // clean 401, not an unhandled exception.
  const request = createRequest("short");
  const { response, state } = createResponse();
  const next = mock.fn();

  assert.doesNotThrow(() => requireInternalService(request, response, next));
  assert.equal(state.statusCode, 401);
  assert.equal(next.mock.callCount(), 0);
});

test("requireInternalService calls next() for the correct token", () => {
  const request = createRequest(CORRECT_TOKEN);
  const { response, state } = createResponse();
  const next = mock.fn();

  requireInternalService(request, response, next);

  assert.equal(next.mock.callCount(), 1);
  assert.equal(state.statusCode, undefined);
});
