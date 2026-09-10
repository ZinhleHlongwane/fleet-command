// Checks that a request has a valid login token before letting it through.
// The token is sent by the frontend as: Authorization: Bearer <token>

const jwt = require("jsonwebtoken");
const { ApiError } = require("./errorHandler");

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    throw new ApiError(401, "You must be logged in to do that");
  }

  try {
    // This puts { id, email } on req.operator for later handlers to use.
    req.operator = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    throw new ApiError(401, "Your session has expired, please log in again");
  }
}

module.exports = requireAuth;
