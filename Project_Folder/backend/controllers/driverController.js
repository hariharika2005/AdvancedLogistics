const db = require("../db");
const bcrypt = require("bcryptjs");

exports.listDrivers = (req, res) => {
  const sql = `
    SELECT 
      d.id AS driver_id,
      u.id AS user_id,
      u.username,
      u.full_name,
      u.phone,
      d.license_no,
      d.shift,
      va.vehicle_id AS assigned_vehicle_id,
      v.number AS assigned_vehicle_number
    FROM users u
    LEFT JOIN drivers d ON d.user_id = u.id
    LEFT JOIN vehicle_assignments va ON va.driver_id = d.id AND va.active = 1
    LEFT JOIN vehicles v ON v.id = va.vehicle_id
    WHERE u.role = 'driver'
  `;
  db.query(sql, (err, rows) => {
    if (err) {
      console.error("listDrivers DB error:", err);
      return res.status(500).json({ message: "DB error", code: err.code });
    }
    res.json(rows);
  });
};

exports.createDriver = (req, res) => {
  const { username, password, full_name, phone, license_no, shift } = req.body;
  if (!username || !password) return res.status(400).json({ message: "username and password are required" });
  const password_hash = bcrypt.hashSync(password, 10);
  db.beginTransaction(txErr => {
    if (txErr) return res.status(500).json({ message: "TX error" });
    db.query(
      "INSERT INTO users (username, password_hash, role, full_name, phone) VALUES (?,?,?,?,?)",
      [username, password_hash, 'driver', full_name || null, phone || null],
      (err, result) => {
        if (err) {
          console.error("createDriver users insert error:", err);
          if (err.code === 'ER_DUP_ENTRY') return db.rollback(() => res.status(409).json({ message: "Username already exists" }));
          if (err.code === 'ER_NO_SUCH_TABLE') return db.rollback(() => res.status(500).json({ message: "Database not initialized (missing tables)", code: err.code }));
          return db.rollback(() => res.status(500).json({ message: "DB error", code: err.code }));
        }
        const userId = result.insertId;
        db.query(
          "INSERT INTO drivers (user_id, license_no, shift) VALUES (?,?,?)",
          [userId, license_no || null, shift || 'morning'],
          (err2) => {
            if (err2) {
              console.error("createDriver drivers insert error:", err2);
              if (err2.code === 'ER_NO_SUCH_TABLE') return db.rollback(() => res.status(500).json({ message: "Database not initialized (missing tables)", code: err2.code }));
              return db.rollback(() => res.status(500).json({ message: "DB error", code: err2.code }));
            }
            db.commit(commitErr => {
              if (commitErr) return res.status(500).json({ message: "Commit error" });
              res.status(201).json({ id: userId, username });
            });
          }
        );
      }
    );
  });
};

exports.updateDriver = (req, res) => {
  const { id } = req.params; // driver id (drivers.id or users.id?) We'll update by users.id for simplicity
  const { full_name, phone, license_no, shift, password } = req.body;
  // Update users and drivers in transaction
  db.beginTransaction(txErr => {
    if (txErr) return res.status(500).json({ message: "TX error" });
    const tasks = [];
    const params = [];
    let sqlUser = "UPDATE users SET ";
    if (full_name !== undefined) { sqlUser += "full_name = ?, "; params.push(full_name || null); }
    if (phone !== undefined) { sqlUser += "phone = ?, "; params.push(phone || null); }
    if (password) { sqlUser += "password_hash = ?, "; params.push(bcrypt.hashSync(password, 10)); }
    sqlUser = sqlUser.replace(/,\s*$/,' ') + "WHERE id = ?";
    params.push(id);
    db.query(sqlUser, params, (e1) => {
      if (e1) return db.rollback(() => res.status(500).json({ message: "User update error" }));
      const dParams = [];
      let sqlDriver = "UPDATE drivers SET ";
      let hasDriverUpdate = false;
      if (license_no !== undefined) { sqlDriver += "license_no = ?, "; dParams.push(license_no || null); hasDriverUpdate = true; }
      if (shift !== undefined) { sqlDriver += "shift = ?, "; dParams.push(shift || 'morning'); hasDriverUpdate = true; }
      if (!hasDriverUpdate) {
        return db.commit(err => err ? res.status(500).json({ message: "Commit error" }) : res.json({ message: "Updated" }));
      }
      sqlDriver = sqlDriver.replace(/,\s*$/,' ') + "WHERE user_id = ?";
      dParams.push(id);
      db.query(sqlDriver, dParams, (e2) => {
        if (e2) return db.rollback(() => res.status(500).json({ message: "Driver update error" }));
        db.commit(err => err ? res.status(500).json({ message: "Commit error" }) : res.json({ message: "Updated" }));
      });
    });
  });
};

exports.deleteDriver = (req, res) => {
  const { id } = req.params; // users.id
  // CASCADE removes driver row due to FK
  db.query("DELETE FROM users WHERE id = ? AND role = 'driver'", [id], (err, result) => {
    if (err) return res.status(500).json({ message: "Delete error" });
    if (result.affectedRows === 0) return res.status(404).json({ message: "Driver not found" });
    res.json({ message: "Deleted" });
  });
};

// Create a drivers profile row for an existing user with role='driver'
exports.createDriverProfile = (req, res) => {
  const { userId } = req.params;
  // Ensure user exists and is role driver
  db.query("SELECT id FROM users WHERE id = ? AND role = 'driver'", [userId], (e1, rows) => {
    if (e1) return res.status(500).json({ message: "DB error" });
    if (!rows || rows.length === 0) return res.status(404).json({ message: "User not found or not a driver" });
    // Insert drivers row if not exists
    db.query("SELECT id FROM drivers WHERE user_id = ?", [userId], (e2, rows2) => {
      if (e2) return res.status(500).json({ message: "DB error" });
      if (rows2 && rows2.length > 0) return res.status(409).json({ message: "Driver profile already exists" });
      db.query("INSERT INTO drivers (user_id, license_no, shift) VALUES (?,?,?)", [userId, null, 'morning'], (e3, result) => {
        if (e3) return res.status(500).json({ message: "DB error" });
        res.status(201).json({ driver_id: result.insertId });
      });
    });
  });
};
