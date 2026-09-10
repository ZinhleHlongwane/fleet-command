const express = require("express");
const { register, login } = require("../controllers/auth.controller");
const requireFields = require("../middleware/validate");

const router = express.Router();

router.post("/register", requireFields(["name", "email", "password"]), register);
router.post("/login", requireFields(["email", "password"]), login);

module.exports = router;
