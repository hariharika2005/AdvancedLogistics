const db = require("../db");

exports.listTrips = (req, res) => {
  const sql = `SELECT t.*, v.number AS vehicle_number FROM trips t
               JOIN vehicles v ON v.id = t.vehicle_id`;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ message: "DB error" });
    res.json(rows);
  });
};

// List issues for a trip (basic: anyone with admin/supervisor can see; drivers can view too)
exports.listTripIssues = (req, res) => {
  const { id } = req.params; // trip id
  // If role is driver, restrict to their own trip
  const runQuery = () => {
    const sql = `
      SELECT ti.id, ti.trip_id, ti.user_id, u.username, u.full_name,
             ti.description, ti.address, ti.photo_path, ti.created_at
      FROM trip_issues ti
      JOIN users u ON u.id = ti.user_id
      WHERE ti.trip_id = ?
      ORDER BY ti.created_at DESC
      LIMIT 100
    `;
    db.query(sql, [id], (err, rows) => {
      if (err) return res.status(500).json({ message: "DB error" });
      res.json(rows || []);
    });
  };
  if (req.user && req.user.role === 'driver') {
    const userId = req.user.id;
    db.query("SELECT id FROM drivers WHERE user_id = ?", [userId], (e1, rows) => {
      if (e1) return res.status(500).json({ message: "DB error" });
      if (!rows || rows.length === 0) return res.status(403).json({ message: "Forbidden" });
      const driverId = rows[0].id;
      db.query("SELECT 1 FROM trips WHERE id = ? AND driver_id = ?", [id, driverId], (e2, rows2) => {
        if (e2) return res.status(500).json({ message: "DB error" });
        if (!rows2 || rows2.length === 0) return res.status(403).json({ message: "Forbidden" });
        runQuery();
      });
    });
  } else {
    runQuery();
  }
};

// Recent paths for active trips (returns rows grouped by trip_id on client)
exports.listActiveTripPaths = (req, res) => {
  const sql = `
    SELECT tl.trip_id, tl.lat, tl.lng, tl.recorded_at
    FROM trip_locations tl
    WHERE tl.trip_id IN (SELECT id FROM trips WHERE status IN ('planned','started','paused'))
      AND tl.recorded_at >= (NOW() - INTERVAL 60 MINUTE)
    ORDER BY tl.trip_id ASC, tl.recorded_at ASC
    LIMIT 5000
  `;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ message: "DB error" });
    res.json(rows);
  });
};

exports.createTrip = (req, res) => {
  const { vehicle_id, driver_id, origin, destination, material, quantity } = req.body;

  if (!vehicle_id || !driver_id || !origin || !destination) {
    return res.status(400).json({ message: "Missing fields" });
  }

  // 🔹 Start transaction
  db.beginTransaction(err => {
    if (err) return res.status(500).json({ message: "TX error" });

    // 🔹 STEP 1: deactivate old assignments (same logic as assignmentController)
    db.query(
      "UPDATE vehicle_assignments SET active=0 WHERE vehicle_id=? OR driver_id=?",
      [vehicle_id, driver_id],
      (e1) => {
        if (e1) return db.rollback(() => res.status(500).json({ message: "DB error" }));

        // 🔹 STEP 2: create new assignment
        db.query(
          "INSERT INTO vehicle_assignments (vehicle_id, driver_id, active) VALUES (?,?,1)",
          [vehicle_id, driver_id],
          (e2) => {
            if (e2) return db.rollback(() => res.status(500).json({ message: "Assign error" }));

            // 🔹 STEP 3: create trip (your existing logic)
            db.query(
              "INSERT INTO trips (vehicle_id, driver_id, origin, destination, material, quantity, status) VALUES (?,?,?,?, ?, ?, 'planned')",
              [vehicle_id, driver_id, origin, destination, material || null, quantity || null],
              (e3, result) => {
                if (e3) return db.rollback(() => res.status(500).json({ message: "DB error" }));

                db.commit(err2 => {
                  if (err2) return res.status(500).json({ message: "Commit error" });
                  res.status(201).json({ id: result.insertId });
                });
              }
            );
          }
        );
      }
    );
  });
};


exports.getTripById = (req, res) => {
  const { id } = req.params;
  const tripSql = `
    SELECT t.*, v.number AS vehicle_number, u.username AS driver_username, u.full_name AS driver_name
    FROM trips t
    JOIN vehicles v ON v.id = t.vehicle_id
    JOIN drivers d ON d.id = t.driver_id
    JOIN users u ON u.id = d.user_id
    WHERE t.id = ?
  `;
  db.query(tripSql, [id], (e1, trips) => {
    if (e1) return res.status(500).json({ message: "DB error" });
    if (!trips || trips.length === 0) return res.status(404).json({ message: "Trip not found" });
    const trip = trips[0];
    db.query(
      "SELECT id, lat, lng, speed, recorded_at FROM trip_locations WHERE trip_id = ? ORDER BY recorded_at DESC LIMIT 100",
      [id],
      (e2, locs) => {
        if (e2) return res.status(500).json({ message: "DB error" });
        res.json({ trip, locations: locs || [] });
      }
    );
  });
};

exports.startTrip = (req, res) => {
  const { id } = req.params;
  db.query("UPDATE trips SET status='started', started_at=NOW() WHERE id=?", [id], (err) => {
    if (err) return res.status(500).json({ message: "DB error" });
    res.json({ message: "Trip started" });
  });
};

exports.pauseTrip = (req, res) => {
  const { id } = req.params;
  db.query("UPDATE trips SET status='paused', paused_at=NOW() WHERE id=?", [id], (err) => {
    if (err) return res.status(500).json({ message: "DB error" });
    res.json({ message: "Trip paused" });
  });
};

exports.completeTrip = (req, res) => {
  const { id } = req.params;

  db.beginTransaction(err => {
    if (err) return res.status(500).json({ message: "TX error" });

    // 1️⃣ Get driver_id for this trip
    db.query(
      "SELECT driver_id FROM trips WHERE id = ?",
      [id],
      (e1, rows) => {
        if (e1) return db.rollback(() => res.status(500).json({ message: "DB error" }));
        if (!rows.length) return db.rollback(() => res.status(404).json({ message: "Trip not found" }));

        const driverId = rows[0].driver_id;

        // 2️⃣ Mark trip as completed
        db.query(
          "UPDATE trips SET status='completed', completed_at=NOW() WHERE id=?",
          [id],
          (e2) => {
            if (e2) return db.rollback(() => res.status(500).json({ message: "DB error" }));

            // 3️⃣ Auto-unassign vehicle from driver
            db.query(
              "UPDATE vehicle_assignments SET active=0 WHERE driver_id=? AND active=1",
              [driverId],
              (e3) => {
                if (e3) return db.rollback(() => res.status(500).json({ message: "DB error" }));

                db.commit(err2 => {
                  if (err2) return res.status(500).json({ message: "Commit error" });
                  res.json({ message: "Trip completed and vehicle unassigned" });
                });
              }
            );
          }
        );
      }
    );
  });
};


exports.addLocationPing = (req, res) => {
  const { trip_id, lat, lng, speed } = req.body;
  if (!trip_id || lat == null || lng == null) return res.status(400).json({ message: "Missing fields" });
  db.query(
    "INSERT INTO trip_locations (trip_id, lat, lng, speed) VALUES (?,?,?,?)",
    [trip_id, lat, lng, speed || null],
    (err) => {
      if (err) return res.status(500).json({ message: "DB error" });
      res.status(201).json({ message: "Location recorded" });
    }
  );
};

// Driver reports an issue for a trip, with optional photo
exports.addTripIssue = (req, res) => {
  const { id } = req.params; // trip id
  const userId = req.user && req.user.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  const description = req.body.description || null;
  const address = req.body.address || null;
  const photo_path = req.file ? `/uploads/${req.file.filename}` : null;
  // If role is driver, enforce that this trip belongs to the driver
  if (req.user && req.user.role === 'driver') {
    const sqlGetDriverId = "SELECT id FROM drivers WHERE user_id = ?";
    db.query(sqlGetDriverId, [userId], (e1, rows) => {
      if (e1) return res.status(500).json({ message: "DB error" });
      if (!rows || rows.length === 0) return res.status(403).json({ message: "Forbidden" });
      const driverId = rows[0].id;
      db.query("SELECT 1 FROM trips WHERE id = ? AND driver_id = ?", [id, driverId], (e2, rows2) => {
        if (e2) return res.status(500).json({ message: "DB error" });
        if (!rows2 || rows2.length === 0) return res.status(403).json({ message: "Forbidden" });
        const sql = "INSERT INTO trip_issues (trip_id, user_id, description, address, photo_path) VALUES (?,?,?,?,?)";
        db.query(sql, [id, userId, description, address, photo_path], (err, result) => {
          if (err) return res.status(500).json({ message: "DB error" });
          res.status(201).json({ id: result.insertId, trip_id: Number(id), description, address, photo_path });
        });
      });
    });
  } else {
    // Admin/supervisor path: allow insert directly
    const sql = "INSERT INTO trip_issues (trip_id, user_id, description, address, photo_path) VALUES (?,?,?,?,?)";
    db.query(sql, [id, userId, description, address, photo_path], (err, result) => {
      if (err) return res.status(500).json({ message: "DB error" });
      res.status(201).json({ id: result.insertId, trip_id: Number(id), description, address, photo_path });
    });
  }
};

// Active trips with latest location
exports.listActiveTripLocations = (req, res) => {
  const sql = `
    SELECT t.id, t.status, v.number AS vehicle_number,
           tl.lat AS last_lat, tl.lng AS last_lng, tl.recorded_at AS last_time
    FROM trips t
    JOIN vehicles v ON v.id = t.vehicle_id
    LEFT JOIN (
      SELECT tl1.* FROM trip_locations tl1
      JOIN (
        SELECT trip_id, MAX(recorded_at) AS max_time FROM trip_locations GROUP BY trip_id
      ) mx ON mx.trip_id = tl1.trip_id AND mx.max_time = tl1.recorded_at
    ) tl ON tl.trip_id = t.id
    WHERE t.status IN ('planned','started','paused')
    ORDER BY t.id DESC
  `;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ message: "DB error" });
    res.json(rows);
  });
};
