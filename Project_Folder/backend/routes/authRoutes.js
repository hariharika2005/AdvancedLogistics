const express = require("express");
const { login, me, register } = require("../controllers/authController");
const { verifyToken } = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/login", login);
router.get("/me", verifyToken, me);
router.post("/register", register);

module.exports = router;
