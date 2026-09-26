const express = require("express");
const { verifyToken, authorizeRoles } = require("../middleware/authMiddleware");
const { listDrivers, createDriver, updateDriver, deleteDriver, createDriverProfile } = require("../controllers/driverController");
const router = express.Router();

// Loosen access to ensure visibility while we stabilize roles; still requires authentication
router.get('/', verifyToken, listDrivers);
router.post('/', verifyToken, authorizeRoles('admin'), createDriver);
router.put('/:id', verifyToken, authorizeRoles('admin'), updateDriver);
router.delete('/:id', verifyToken, authorizeRoles('admin'), deleteDriver);

// Create a drivers profile row for an existing driver user
router.post('/:userId/profile', verifyToken, authorizeRoles('admin'), createDriverProfile);

module.exports = router;
