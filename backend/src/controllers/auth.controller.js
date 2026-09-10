// Handles operator registration and login.
// Passwords are never stored in plain text - bcrypt hashes them first.

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const { ApiError } = require("../middleware/errorHandler");
const asyncHandler = require("../utils/asyncHandler");

const SALT_ROUNDS = 10;

function signToken(operator) {
  return jwt.sign(
    { id: operator.id, email: operator.email, name: operator.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
  );
}

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await db.query("SELECT id FROM operators WHERE email = $1", [email]);
  if (existing.rows.length > 0) {
    throw new ApiError(409, "An operator with that email already exists");
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const result = await db.query(
    `INSERT INTO operators (name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, name, email, created_at`,
    [name, email, passwordHash]
  );

  const operator = result.rows[0];
  const token = signToken(operator);

  res.status(201).json({ operator, token });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const result = await db.query("SELECT * FROM operators WHERE email = $1", [email]);
  const operator = result.rows[0];

  // Deliberately use the same error message whether the email doesn't
  // exist or the password is wrong, so we don't reveal which emails
  // are registered to someone trying to guess.
  if (!operator) {
    throw new ApiError(401, "Invalid email or password");
  }

  const passwordMatches = await bcrypt.compare(password, operator.password_hash);
  if (!passwordMatches) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = signToken(operator);

  res.json({
    operator: { id: operator.id, name: operator.name, email: operator.email },
    token,
  });
});

module.exports = { register, login };
