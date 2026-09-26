const express = require("express");
const { verifyToken, authorizeRoles } = require("../middleware/authMiddleware");
const { assignDriver, unassignDriver } = require("../controllers/assignmentController");
const router = express.Router();

router.post('/assign', verifyToken, authorizeRoles('admin'), assignDriver);
router.post('/unassign', verifyToken, authorizeRoles('admin'), unassignDriver);

module.exports = router;
