const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("../db");

exports.login = (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "username and password are required" });
  }
  db.query(
    "SELECT id, username, password_hash, role FROM users WHERE username = ?",
    [username],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "DB error" });
      if (!rows || rows.length === 0) return res.status(401).json({ message: "Invalid credentials" });
      const user = rows[0];
      const ok = bcrypt.compareSync(password, user.password_hash);
      if (!ok) return res.status(401).json({ message: "Invalid credentials" });
      const payload = { sub: user.id, username: user.username, role: user.role };
      const token = jwt.sign(payload, process.env.JWT_SECRET || "secretkey", { expiresIn: "2h" });
      res.json({ token, role: user.role, user: { id: user.id, username: user.username, role: user.role } });
    }
  );
};

exports.me = (req, res) => {
  const { sub, username, role } = req.user || {};
  if (!sub) return res.status(401).json({ message: "Unauthorized" });
  res.json({ id: sub, username, role });
};

exports.register = (req, res) => {
  const { username, password, role, full_name, phone, license_no, shift } = req.body;
  if (!username || !password || !role) {
    return res.status(400).json({ message: "username, password, and role are required" });
  }
  if (!['admin','driver','supervisor'].includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }
  const password_hash = bcrypt.hashSync(password, 10);
  db.beginTransaction(txErr => {
    if (txErr) return res.status(500).json({ message: "TX error" });
    db.query(
      "INSERT INTO users (username, password_hash, role, full_name, phone) VALUES (?,?,?,?,?)",
      [username, password_hash, role, full_name || null, phone || null],
      (err, result) => {
        if (err) {
          console.error("Register user insert error:", err);
          if (err.code === 'ER_DUP_ENTRY') {
            return db.rollback(() => res.status(409).json({ message: "Username already exists" }));
          }
          return db.rollback(() => res.status(500).json({ message: "User create error", error: err.code || "DB_ERROR" }));
        }
        const userId = result.insertId;
        const finish = () => db.commit(commitErr => {
          if (commitErr) return res.status(500).json({ message: "Commit error" });
          res.status(201).json({ id: userId, username, role });
        });
        if (role === 'driver') {
          db.query(
            "INSERT INTO drivers (user_id, license_no, shift) VALUES (?,?,?)",
            [userId, license_no || null, shift || 'morning'],
            (dErr) => {
              if (dErr) {
                return db.rollback(() => res.status(500).json({ message: "Driver profile error" }));
              }
              finish();
            }
          );
        } else {
          finish();
        }
      }
    );
  });
};
