const test = require("node:test");
const assert = require("node:assert/strict");

const requireFields = require("../src/middleware/validate");

// Test 1: All required fields are present.
test("calls next when all required fields are present", () => {
    const middleware = requireFields(["email", "password"]);

    const req = {
        body: {
            email: "zee@example.com",
            password: "mypassword",
        },
    };

    let nextCalled = false;

    middleware(req, {}, () => {
        nextCalled = true;
    });

    assert.equal(nextCalled, true);
});

//Test 2: One required field is missing.
test("throws a 400 error when a required field is missing", () => {
    const middleware = requireFields(["email", "password"]);

    const req = {
        body: {
            email: "zee@example.com",
        },
    };

    assert.throws(
        () => middleware(req, {}, () => {}),
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
    };

    assert.throws(
        () => middleware(req, {}, () => {}),
        {
            statusCode: 400,
            message: "Missing required field(s): email, password",
        }
    );
});