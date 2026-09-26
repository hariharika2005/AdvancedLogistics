const db = require("../db");

exports.generateSummary = (req, res) => {
  // Simple summary: counts
  const queries = {
    vehicles: "SELECT COUNT(*) as count FROM vehicles",
    drivers: "SELECT COUNT(*) as count FROM drivers",
    activeTrips: "SELECT COUNT(*) as count FROM trips WHERE status IN ('planned','started','paused')",
    completedTrips: "SELECT COUNT(*) as count FROM trips WHERE status='completed'"
  };
  const results = {};
  db.query(queries.vehicles, (e1, r1) => {
    if (e1) return res.status(500).json({ message: "DB error" });
    results.vehicles = r1[0].count;
    db.query(queries.drivers, (e2, r2) => {
      if (e2) return res.status(500).json({ message: "DB error" });
      results.drivers = r2[0].count;
      db.query(queries.activeTrips, (e3, r3) => {
        if (e3) return res.status(500).json({ message: "DB error" });
        results.activeTrips = r3[0].count;
        db.query(queries.completedTrips, (e4, r4) => {
          if (e4) return res.status(500).json({ message: "DB error" });
          results.completedTrips = r4[0].count;
          res.json(results);
        });
      });
    });
  });
};
