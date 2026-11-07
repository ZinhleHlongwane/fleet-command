const { test, mock } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const app = require("../src/app");
const db = require("../src/config/db");

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

  const queryMock = mock.method(db, "query", async () => ({
    rows: drones,
  }));

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

  const queryMock = mock.method(db, "query", async () => ({
    rows: [drone],
  }));

  t.after(() => queryMock.mock.restore());

  const response = await request(app).get("/api/drones/1");

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, drone);
  assert.equal(queryMock.mock.callCount(), 1);
});

test("returns 404 when the drone does not exist", async (t) => {
  const queryMock = mock.method(db, "query", async () => ({
    rows: [],
  }));

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

  const queryMock = mock.method(db, "query", async () => ({
    rows: [drone],
  }));

  t.after(() => queryMock.mock.restore());

  const token = require("jsonwebtoken").sign(
    { id: 1 },
    process.env.JWT_SECRET
  );

  const response = await request(app)
    .post("/api/drones")
    .set("Authorization", `Bearer ${token}`)
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
  const token = require("jsonwebtoken").sign(
    { id: 1 },
    process.env.JWT_SECRET
  );

  const response = await request(app)
    .post("/api/drones")
    .set("Authorization", `Bearer ${token}`)
    .send({
      call_sign: "Hawk-03",
    });

  assert.equal(response.status, 400);
  assert.deepEqual(response.body, {
    error: "Missing required field(s): model",
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

  const queryMock = mock.method(db, "query", async () => ({
    rows: [updatedDrone],
  }));

  t.after(() => queryMock.mock.restore());

  const token = require("jsonwebtoken").sign(
    { id: 1 },
    process.env.JWT_SECRET
  );

  const response = await request(app)
    .patch("/api/drones/1")
    .set("Authorization", `Bearer ${token}`)
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
  const queryMock = mock.method(db, "query", async () => ({
    rows: [],
  }));

  t.after(() => queryMock.mock.restore());

  const token = require("jsonwebtoken").sign(
    { id: 1 },
    process.env.JWT_SECRET
  );

  const response = await request(app)
    .patch("/api/drones/999")
    .set("Authorization", `Bearer ${token}`)
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
  const queryMock = mock.method(db, "query", async () => ({
    rows: [{ id: 1 }],
  }));

  t.after(() => queryMock.mock.restore());

  const token = require("jsonwebtoken").sign(
    { id: 1 },
    process.env.JWT_SECRET
  );

  const response = await request(app)
    .delete("/api/drones/1")
    .set("Authorization", `Bearer ${token}`);

  assert.equal(response.status, 204);
  assert.equal(response.text, "");
  assert.equal(queryMock.mock.callCount(), 1);
});

test("returns 404 when deleting a drone that does not exist", async (t) => {
  const queryMock = mock.method(db, "query", async () => ({
    rows: [],
  }));

  t.after(() => queryMock.mock.restore());

  const token = require("jsonwebtoken").sign(
    { id: 1 },
    process.env.JWT_SECRET
  );

  const response = await request(app)
    .delete("/api/drones/999")
    .set("Authorization", `Bearer ${token}`);

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

  const queryMock = mock.method(db, "query", async () => ({
    rows: [recalledDrone],
  }));

  t.after(() => queryMock.mock.restore());

  const token = require("jsonwebtoken").sign(
    { id: 1 },
    process.env.JWT_SECRET
  );

  const response = await request(app)
    .post("/api/drones/1/recall")
    .set("Authorization", `Bearer ${token}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.status, "idle");
  assert.equal(response.body.pos_x, 0);
  assert.equal(response.body.pos_y, 0);
  assert.equal(queryMock.mock.callCount(), 1);
});

test("returns 404 when recalling a drone that does not exist", async (t) => {
  const queryMock = mock.method(db, "query", async () => ({
    rows: [],
  }));

  t.after(() => queryMock.mock.restore());

  const token = require("jsonwebtoken").sign(
    { id: 1 },
    process.env.JWT_SECRET
  );

  const response = await request(app)
    .post("/api/drones/999/recall")
    .set("Authorization", `Bearer ${token}`);

  assert.equal(response.status, 404);
  assert.deepEqual(response.body, {
    error: "Drone not found",
  });
  assert.equal(queryMock.mock.callCount(), 1);
});