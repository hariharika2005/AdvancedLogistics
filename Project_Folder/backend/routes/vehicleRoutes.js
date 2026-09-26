const express = require("express");
const { getVehicles, addVehicle, updateVehicle, setVehicleStatus, deleteVehicle } = require("../controllers/vehicleController");
const { verifyToken, authorizeRoles } = require("../middleware/authMiddleware");
const router = express.Router();

router.get("/", verifyToken, authorizeRoles('admin'), getVehicles);
router.post("/", verifyToken, authorizeRoles('admin'), addVehicle);
router.put("/:id", verifyToken, authorizeRoles('admin'), updateVehicle);
router.patch("/:id/status", verifyToken, authorizeRoles('admin'), setVehicleStatus);
router.delete("/:id", verifyToken, authorizeRoles('admin'), deleteVehicle);

module.exports = router;
