
import test from "node:test";
import assert from "node:assert/strict";
import type { Request, Response, NextFunction } from "express";

import requireFields = require("../src/middleware/validate");

// Test 1: All required fields are present.
test("calls next when all required fields are present", () => {
  const middleware = requireFields(["email", "password"]);

  const req = {
    body: {
      email: "zee@example.com",
      password: "mypassword",
    },
  } as Request;

  let nextCalled = false;

  const res = {} as Response;
  const next: NextFunction = () => {
    nextCalled = true;
  };

  middleware(req, res, next);

  assert.equal(nextCalled, true);
});

// Test 2: One required field is missing.
test("throws a 400 error when a required field is missing", () => {
  const middleware = requireFields(["email", "password"]);

  const req = {
    body: {
      email: "zee@example.com",
    },
  } as Request;

  const res = {} as Response;
  const next: NextFunction = () => {};

  assert.throws(
    () => middleware(req, res, next),
    {
      statusCode: 400,
      message: "Missing required field(s): password",
    }
  );
});

// Test 3: Multiple required fields are missing.
test("identifies all missing required fields", () => {
  const middleware = requireFields(["email", "password"]);

  const req = {
    body: {},
  } as Request;

  const res = {} as Response;
  const next: NextFunction = () => {};

  assert.throws(
    () => middleware(req, res, next),
    {
      statusCode: 400,
      message: "Missing required field(s): email, password",
    }
  );
});