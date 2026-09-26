const express = require("express");
const { verifyToken, authorizeRoles } = require("../middleware/authMiddleware");
const { generateSummary } = require("../controllers/reportController");
const router = express.Router();

router.get('/summary', verifyToken, authorizeRoles('admin','supervisor'), generateSummary);

module.exports = router;
