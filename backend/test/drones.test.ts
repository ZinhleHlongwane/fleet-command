
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

import { test, mock } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import jwt from "jsonwebtoken";

import app = require("../src/app");
import db = require("../src/config/db");

type MockQueryResult = Awaited<ReturnType<typeof db.query>>;

function mockRows(rows: unknown[]): MockQueryResult {
  return { rows } as MockQueryResult;
}

function createToken(): string {
  return jwt.sign(
    { id: 1 },
    process.env.JWT_SECRET as string
  );
}

test("returns all drones", async (t) => {
  const drones = [
    {
      id: 1,
      call_sign: "Falcon-01",
      model: "DJI Mavic 3",
    },
    {
      id: 2,
      call_sign: "Eagle-02",
      model: "DJI Matrice 300",
    },
  ];

  const queryMock = mock.method(
    db,
    "query",
    async () => mockRows(drones)
  );

  t.after(() => queryMock.mock.restore());

  const response = await request(app).get("/api/drones");

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, drones);
  assert.equal(queryMock.mock.callCount(), 1);
});

test("returns a drone by ID", async (t) => {
  const drone = {
    id: 1,
    call_sign: "Falcon-01",
    model: "DJI Mavic 3",
  };

  const queryMock = mock.method(
    db,
    "query",
    async () => mockRows([drone])
  );

  t.after(() => queryMock.mock.restore());

  const response = await request(app).get("/api/drones/1");

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, drone);
  assert.equal(queryMock.mock.callCount(), 1);
});

test("returns 404 when the drone does not exist", async (t) => {
  const queryMock = mock.method(
    db,
    "query",
    async () => mockRows([])
  );

  t.after(() => queryMock.mock.restore());

  const response = await request(app).get("/api/drones/999");

  assert.equal(response.status, 404);
  assert.deepEqual(response.body, {
    error: "Drone not found",
  });
  assert.equal(queryMock.mock.callCount(), 1);
});

test("creates a drone successfully", async (t) => {
  const drone = {
    id: 3,
    call_sign: "Hawk-03",
    model: "DJI Matrice 300",
    home_base: "Main Depot",
  };

  const queryMock = mock.method(
    db,
    "query",
    async () => mockRows([drone])
  );

  t.after(() => queryMock.mock.restore());

  const response = await request(app)
    .post("/api/drones")
    .set("Authorization", `Bearer ${createToken()}`)
    .send({
      call_sign: "Hawk-03",
      model: "DJI Matrice 300",
    });

  assert.equal(response.status, 201);
  assert.equal(response.body.call_sign, "Hawk-03");
  assert.equal(response.body.model, "DJI Matrice 300");
  assert.equal(queryMock.mock.callCount(), 1);
});

test("rejects drone creation when required fields are missing", async () => {
  const response = await request(app)
    .post("/api/drones")
    .set("Authorization", `Bearer ${createToken()}`)
    .send({
      call_sign: "Hawk-03",
    });

  assert.equal(response.status, 400);
  assert.deepEqual(response.body, {
    error: "Missing required field(s): model",
  });
});

test("rejects drone creation when call_sign is missing", async () => {
  const response = await request(app)
    .post("/api/drones")
    .set("Authorization", `Bearer ${createToken()}`)
    .send({
      model: "DJI Matrice 300",
    });

  assert.equal(response.status, 400);
  assert.deepEqual(response.body, {
    error: "Missing required field(s): call_sign",
  });
});

test("rejects drone creation when both required fields are missing", async () => {
  const response = await request(app)
    .post("/api/drones")
    .set("Authorization", `Bearer ${createToken()}`)
    .send({});

  assert.equal(response.status, 400);
  assert.deepEqual(response.body, {
    error: "Missing required field(s): call_sign, model",
  });
});

test("rejects drone creation without an authentication token", async () => {
  const response = await request(app)
    .post("/api/drones")
    .send({
      call_sign: "Hawk-04",
      model: "DJI Matrice 300",
    });

  assert.equal(response.status, 401);
  assert.deepEqual(response.body, {
    error: "You must be logged in to do that",
  });
});

test("rejects drone updates without an authentication token", async () => {
  const response = await request(app)
    .patch("/api/drones/1")
    .send({
      status: "idle",
    });

  assert.equal(response.status, 401);
  assert.deepEqual(response.body, {
    error: "You must be logged in to do that",
  });
});

test("rejects drone deletion without an authentication token", async () => {
  const response = await request(app)
    .delete("/api/drones/1");

  assert.equal(response.status, 401);
  assert.deepEqual(response.body, {
    error: "You must be logged in to do that",
  });
});

test("rejects drone recall without an authentication token", async () => {
  const response = await request(app)
    .post("/api/drones/1/recall");

  assert.equal(response.status, 401);
  assert.deepEqual(response.body, {
    error: "You must be logged in to do that",
  });
});

test("updates a drone successfully", async (t) => {
  const updatedDrone = {
    id: 1,
    call_sign: "Falcon-01",
    model: "DJI Mavic 3",
    status: "idle",
    battery_percent: 85,
    pos_x: 10,
    pos_y: 20,
    home_base: "New Depot",
  };

  const queryMock = mock.method(
    db,
    "query",
    async () => mockRows([updatedDrone])
  );

  t.after(() => queryMock.mock.restore());

  const response = await request(app)
    .patch("/api/drones/1")
    .set("Authorization", `Bearer ${createToken()}`)
    .send({
      battery_percent: 85,
      home_base: "New Depot",
    });

  assert.equal(response.status, 200);
  assert.equal(response.body.battery_percent, 85);
  assert.equal(response.body.home_base, "New Depot");
  assert.equal(queryMock.mock.callCount(), 1);
});

test("returns 404 when updating a drone that does not exist", async (t) => {
  const queryMock = mock.method(
    db,
    "query",
    async () => mockRows([])
  );

  t.after(() => queryMock.mock.restore());

  const response = await request(app)
    .patch("/api/drones/999")
    .set("Authorization", `Bearer ${createToken()}`)
    .send({
      status: "idle",
    });

  assert.equal(response.status, 404);
  assert.deepEqual(response.body, {
    error: "Drone not found",
  });
  assert.equal(queryMock.mock.callCount(), 1);
});

test("deletes a drone successfully", async (t) => {
  const queryMock = mock.method(
    db,
    "query",
    async () => mockRows([{ id: 1 }])
  );

  t.after(() => queryMock.mock.restore());

  const response = await request(app)
    .delete("/api/drones/1")
    .set("Authorization", `Bearer ${createToken()}`);

  assert.equal(response.status, 204);
  assert.equal(response.text, "");
  assert.equal(queryMock.mock.callCount(), 1);
});

test("returns 404 when deleting a drone that does not exist", async (t) => {
  const queryMock = mock.method(
    db,
    "query",
    async () => mockRows([])
  );

  t.after(() => queryMock.mock.restore());

  const response = await request(app)
    .delete("/api/drones/999")
    .set("Authorization", `Bearer ${createToken()}`);

  assert.equal(response.status, 404);
  assert.deepEqual(response.body, {
    error: "Drone not found",
  });
  assert.equal(queryMock.mock.callCount(), 1);
});

test("recalls a drone to base successfully", async (t) => {
  const recalledDrone = {
    id: 1,
    call_sign: "Falcon-01",
    model: "DJI Mavic 3",
    status: "idle",
    pos_x: 0,
    pos_y: 0,
  };

  const queryMock = mock.method(
    db,
    "query",
    async () => mockRows([recalledDrone])
  );

  t.after(() => queryMock.mock.restore());

  const response = await request(app)
    .post("/api/drones/1/recall")
    .set("Authorization", `Bearer ${createToken()}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.status, "idle");
  assert.equal(response.body.pos_x, 0);
  assert.equal(response.body.pos_y, 0);
  assert.equal(queryMock.mock.callCount(), 1);
});

test("returns 404 when recalling a drone that does not exist", async (t) => {
  const queryMock = mock.method(
    db,
    "query",
    async () => mockRows([])
  );

  t.after(() => queryMock.mock.restore());

  const response = await request(app)
    .post("/api/drones/999/recall")
    .set("Authorization", `Bearer ${createToken()}`);

  assert.equal(response.status, 404);
  assert.deepEqual(response.body, {
    error: "Drone not found",
  });
  assert.equal(queryMock.mock.callCount(), 1);
});
