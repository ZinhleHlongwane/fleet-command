import type { RequestHandler } from "express";
import { ApiError } from "./errorHandler";

function requireFields(fields: string[]): RequestHandler {
  return (req, res, next) => {
    const body = req.body as Record<string, unknown>;

    const missing = fields.filter((field) => {
      const value = body[field];
      return value === undefined || value === null || value === "";
    });

    if (missing.length > 0) {
      throw new ApiError(
        400,
        `Missing required field(s): ${missing.join(", ")}`
      );
    }

    next();
  };
}

export = requireFields;