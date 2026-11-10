
import { test, mock } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import app = require("../src/app");
import db = require("../src/config/db");

process.env.JWT_SECRET = "test-secret-key-for-auth-tests";

type MockQueryResult = Awaited<ReturnType<typeof db.query>>;

function mockRows(rows: unknown[]): MockQueryResult {
  return { rows } as MockQueryResult;
}

test("registers a new operator successfully", async (t) => {
  const newOperator = {
    id: 1,
    name: "Test Operator",
    email: "test@example.com",
    created_at: new Date().toISOString(),
  };

  let savedPasswordHash = "";

  const queryMock = mock.method(
    db,
    "query",
    async (...args: Parameters<typeof db.query>) => {
      const sql = String(args[0]);
      const params = args[1] as unknown[] | undefined;

      if (sql.includes("SELECT id FROM operators")) {
        return mockRows([]);
      }

      if (sql.includes("INSERT INTO operators")) {
        savedPasswordHash = String(params?.[2]);
        return mockRows([newOperator]);
      }

      throw new Error("Unexpected database query");
    }
  );

  t.after(() => queryMock.mock.restore());

  const response = await request(app)
    .post("/api/auth/register")
    .send({
      name: "Test Operator",
      email: "test@example.com",
      password: "password123",
    });

  assert.equal(response.status, 201);
  assert.equal(response.body.operator.email, "test@example.com");
  assert.ok(response.body.token);

  assert.equal(
    await bcrypt.compare("password123", savedPasswordHash),
    true
  );

  const decodedToken = jwt.verify(
    response.body.token,
    process.env.JWT_SECRET as string
  ) as jwt.JwtPayload;

  assert.equal(decodedToken.id, 1);
  assert.equal(decodedToken.email, "test@example.com");

  assert.equal(queryMock.mock.callCount(), 2);
});

test("rejects registration when the email already exists", async (t) => {
  const queryMock = mock.method(
    db,
    "query",
    async () => mockRows([{ id: 1 }])
  );

  t.after(() => queryMock.mock.restore());

  const response = await request(app)
    .post("/api/auth/register")
    .send({
      name: "Another Operator",
      email: "test@example.com",
      password: "password123",
    });

  assert.equal(response.status, 409);
  assert.equal(
    response.body.error,
    "An operator with that email already exists"
  );

  // The database should only be queried once.
  // No INSERT should happen for a duplicate email.
  assert.equal(queryMock.mock.callCount(), 1);
});

test("logs in an operator with the correct password", async (t) => {
  const passwordHash = await bcrypt.hash("password123", 10);

  const existingOperator = {
    id: 1,
    name: "Test Operator",
    email: "test@example.com",
    password_hash: passwordHash,
  };

  const queryMock = mock.method(
    db,
    "query",
    async () => mockRows([existingOperator])
  );

  t.after(() => queryMock.mock.restore());

  const response = await request(app)
    .post("/api/auth/login")
    .send({
      email: "test@example.com",
      password: "password123",
    });

  assert.equal(response.status, 200);
  assert.equal(response.body.operator.name, "Test Operator");
  assert.equal(response.body.operator.email, "test@example.com");
  assert.ok(response.body.token);

  // Verify that the returned JWT is valid.
  const decodedToken = jwt.verify(
    response.body.token,
    process.env.JWT_SECRET as string
  ) as jwt.JwtPayload;

  assert.equal(decodedToken.id, 1);
  assert.equal(decodedToken.email, "test@example.com");

  // The password hash must never be returned to the client.
  assert.equal(response.body.operator.password_hash, undefined);
});

test("rejects login with an incorrect password", async (t) => {
  const passwordHash = await bcrypt.hash("password123", 10);

  const queryMock = mock.method(
    db,
    "query",
    async () =>
      mockRows([
        {
          id: 1,
          name: "Test Operator",
          email: "test@example.com",
          password_hash: passwordHash,
        },
      ])
  );

  t.after(() => queryMock.mock.restore());

  const response = await request(app)
    .post("/api/auth/login")
    .send({
      email: "test@example.com",
      password: "wrongpassword",
    });

  assert.equal(response.status, 401);
  assert.equal(response.body.error, "Invalid email or password");
});

test("rejects login when the email does not exist", async (t) => {
  const queryMock = mock.method(
    db,
    "query",
    async () => mockRows([])
  );

  t.after(() => queryMock.mock.restore());

  const response = await request(app)
    .post("/api/auth/login")
    .send({
      email: "unknown@example.com",
      password: "password123",
    });

  assert.equal(response.status, 401);
  assert.equal(response.body.error, "Invalid email or password");
});

test("rejects drone creation without an authentication token", async () => {
  const response = await request(app)
    .post("/api/drones")
    .send({
      call_sign: "Test-Drone",
      model: "DJI Mavic 3",
    });

  assert.equal(response.status, 401);
  assert.equal(
    response.body.error,
    "You must be logged in to do that"
  );
});

test("rejects drone creation with an invalid token", async () => {
  const response = await request(app)
    .post("/api/drones")
    .set("Authorization", "Bearer invalid-token")
    .send({
      call_sign: "Test-Drone",
      model: "DJI Mavic 3",
    });

  assert.equal(response.status, 401);
  assert.equal(
    response.body.error,
    "Your session has expired, please log in again"
  );
});

test("allows drone creation with a valid authentication token", async (t) => {
  const token = jwt.sign(
    { id: 1, email: "test@example.com", name: "Test Operator" },
    process.env.JWT_SECRET as string
  );

  const createdDrone = {
    id: 1,
    call_sign: "Test-Drone",
    model: "DJI Mavic 3",
    status: "idle",
  };

  const queryMock = mock.method(
    db,
    "query",
    async () => mockRows([createdDrone])
  );

  t.after(() => queryMock.mock.restore());

  const response = await request(app)
    .post("/api/drones")
    .set("Authorization", `Bearer ${token}`)
    .send({
      call_sign: "Test-Drone",
      model: "DJI Mavic 3",
    });

  assert.equal(response.status, 201);
  assert.equal(response.body.call_sign, "Test-Drone");
  assert.equal(response.body.model, "DJI Mavic 3");
  assert.equal(queryMock.mock.callCount(), 1);
});
