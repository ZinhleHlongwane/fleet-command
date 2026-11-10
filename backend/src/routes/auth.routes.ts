import express from "express";
import { register, login } from "../controllers/auth.controller";
import requireFields = require("../middleware/validate");

const router = express.Router();

router.post("/register", requireFields(["name", "email", "password"]), register);
router.post("/login", requireFields(["email", "password"]), login);

export = router;