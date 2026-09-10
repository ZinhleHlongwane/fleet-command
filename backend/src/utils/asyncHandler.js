// Express doesn't automatically catch errors thrown inside "async"
// route handlers. Wrapping a handler in this function means any
// rejected promise gets forwarded to next(err) automatically,
// so we don't have to write try/catch in every single controller.

function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
