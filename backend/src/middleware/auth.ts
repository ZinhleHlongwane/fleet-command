import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { ApiError } from "./errorHandler";

const requireAuth: RequestHandler = (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    throw new ApiError(401, "You must be logged in to do that");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);

if (
  typeof decoded === "string" ||
  typeof decoded.id !== "number"
) {
  throw new Error("Invalid token payload");
}

req.operator = {
  id: decoded.id,
  ...(typeof decoded.email === "string"
    ? { email: decoded.email }
    : {}),
  ...(typeof decoded.name === "string"
    ? { name: decoded.name }
    : {}),
  };
  } catch {
    throw new ApiError(
      401,
      "Your session has expired, please log in again"
    );
  }

  next();
};

export = requireAuth;