import type { ErrorRequestHandler } from "express";

export class ApiError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = "ApiError";
  }
}

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error(err);

  const statusCode =
    err instanceof ApiError ? err.statusCode : 500;

  const message =
    err instanceof Error
      ? err.message
      : "Something went wrong on the server";

  res.status(statusCode).json({ error: message});
};

export { errorHandler };