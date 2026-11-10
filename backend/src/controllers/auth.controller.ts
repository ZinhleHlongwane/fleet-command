// Handles operator registration and login.
// Passwords are never stored in plain text - bcrypt hashes them first.

import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import db = require("../config/db");
import { ApiError } from "../middleware/errorHandler";
import asyncHandler = require("../utils/asyncHandler");

const SALT_ROUNDS = 10;

interface Operator {
  id: number;
  name: string;
  email: string;
  created_at?: Date | string;
}

interface OperatorCredentials extends Operator {
  password_hash: string;
}

interface RegisterBody {
  name: string;
  email: string;
  password: string;
}

interface LoginBody {
  email: string;
  password: string;
}

function signToken(operator: Operator): string {
  return jwt.sign(
    {
      id: operator.id,
      email: operator.email,
      name: operator.name,
    },
    process.env.JWT_SECRET as string,
    {
      expiresIn: (process.env.JWT_EXPIRES_IN || "8h") as SignOptions["expiresIn"],
    }
  );
}

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body as RegisterBody;

  const existing = await db.query(
    "SELECT id FROM operators WHERE email = $1",
    [email]
  );

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

  const operator = result.rows[0] as Operator;
  const token = signToken(operator);

  res.status(201).json({ operator, token });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body as LoginBody;

  const result = await db.query(
    "SELECT * FROM operators WHERE email = $1",
    [email]
  );

  const operator = result.rows[0] as OperatorCredentials | undefined;

  // Deliberately use the same error message whether the email doesn't
  // exist or the password is wrong, so we don't reveal which emails
  // are registered to someone trying to guess.
  if (!operator) {
    throw new ApiError(401, "Invalid email or password");
  }

  const passwordMatches = await bcrypt.compare(
    password,
    operator.password_hash
  );

  if (!passwordMatches) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = signToken(operator);

  res.json({
    operator: {
      id: operator.id,
      name: operator.name,
      email: operator.email,
    },
    token,
  });
});

export { register, login };