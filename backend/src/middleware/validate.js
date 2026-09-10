// Very small validation helper. It takes a list of required field names
// and returns middleware that checks req.body has all of them, non-empty.
// Keeps controllers focused on logic instead of "is this field missing" checks.

const { ApiError } = require("./errorHandler");

function requireFields(fields) {
  return function (req, res, next) {
    const missing = fields.filter((field) => {
      const value = req.body[field];
      return value === undefined || value === null || value === "";
    });

    if (missing.length > 0) {
      throw new ApiError(400, `Missing required field(s): ${missing.join(", ")}`);
    }

    next();
  };
}

module.exports = requireFields;
