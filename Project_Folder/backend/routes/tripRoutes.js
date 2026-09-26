const express = require("express");
const multer = require("multer");
const path = require("path");
const { verifyToken, authorizeRoles } = require("../middleware/authMiddleware");
const { listTrips, createTrip, startTrip, pauseTrip, completeTrip, addLocationPing, getTripById, listActiveTripLocations, listActiveTripPaths, addTripIssue, listTripIssues } = require("../controllers/tripController");
const router = express.Router();

// Admin & supervisor can list trips; drivers see only their own (basic example: filter by req.user.id in real version)
router.get('/', verifyToken, authorizeRoles('admin','supervisor'), listTrips);
router.post('/', verifyToken, authorizeRoles('admin'), createTrip);
router.post('/:id/start', verifyToken, authorizeRoles('driver','admin'), startTrip);
router.post('/:id/pause', verifyToken, authorizeRoles('driver','admin'), pauseTrip);
router.post('/:id/complete', verifyToken, authorizeRoles('driver','admin'), completeTrip);
router.post('/location', verifyToken, authorizeRoles('driver','admin'), addLocationPing);
router.get('/:id', verifyToken, authorizeRoles('admin','supervisor'), getTripById);
router.get('/active-locations/list', verifyToken, authorizeRoles('admin','supervisor'), listActiveTripLocations);
router.get('/active-paths/list', verifyToken, authorizeRoles('admin','supervisor'), listActiveTripPaths);

// File upload storage for issue photos
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "..", "uploads")),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random()*1e9);
    const ext = path.extname(file.originalname || '');
    cb(null, `issue-${unique}${ext}`);
  }
});
const upload = multer({ storage });

// Driver reports an issue for a trip with optional photo
router.post('/:id/issues', verifyToken, authorizeRoles('driver','admin'), upload.single('photo'), addTripIssue);

// List issues for a trip (driver, admin, supervisor)
router.get('/:id/issues', verifyToken, authorizeRoles('driver','admin','supervisor'), listTripIssues);

module.exports = router;
