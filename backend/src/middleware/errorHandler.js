// Central place where every error in the app ends up.
// Instead of each route deciding how to format an error response,
// they just throw or call next(err), and this turns it into
// consistent JSON: { error: "message" }.

function errorHandler(err, req, res, next) {
  console.error(err);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Something went wrong on the server";

  res.status(statusCode).json({ error: message });
}

// Small helper for controllers: throw new ApiError(404, "Drone not found")
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = { errorHandler, ApiError };
