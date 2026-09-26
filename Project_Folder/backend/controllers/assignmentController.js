const db = require("../db");

exports.assignDriver = (req, res) => {
  const { driver_id, vehicle_id } = req.body;
  if (!driver_id || !vehicle_id) return res.status(400).json({ message: "driver_id and vehicle_id required" });
  db.beginTransaction(txErr => {
    if (txErr) return res.status(500).json({ message: "TX error" });
    // Deactivate existing active assignments for this vehicle and driver
    db.query("UPDATE vehicle_assignments SET active=0 WHERE vehicle_id=? OR driver_id=?", [vehicle_id, driver_id], (e1) => {
      if (e1) return db.rollback(() => res.status(500).json({ message: "DB error" }));
      db.query(
  "SELECT 1 FROM vehicle_assignments WHERE vehicle_id=? AND active=1",
  [vehicle_id],
  (e0, rows) => {
    if (e0) return db.rollback(() => res.status(500).json({ message: "DB error" }));
    if (rows.length > 0)
      return db.rollback(() => res.status(409).json({ message: "Vehicle already assigned" }));
    
     db.query("INSERT INTO vehicle_assignments (vehicle_id, driver_id, active) VALUES (?,?,1)", [vehicle_id, driver_id], (e2) => {
        if (e2) return db.rollback(() => res.status(500).json({ message: "Assign error" }));
        db.commit(err => err ? res.status(500).json({ message: "Commit error" }) : res.status(201).json({ message: "Assigned" }));
      });
    
  }
);

    });
  });
};

exports.unassignDriver = (req, res) => {
  const { driver_id } = req.body;
  if (!driver_id) return res.status(400).json({ message: "driver_id required" });
  db.query("UPDATE vehicle_assignments SET active=0 WHERE driver_id=? AND active=1", [driver_id], (err, result) => {
    if (err) return res.status(500).json({ message: "DB error" });
    if (result.affectedRows === 0) return res.status(404).json({ message: "No active assignment" });
    res.json({ message: "Unassigned" });
  });
};
