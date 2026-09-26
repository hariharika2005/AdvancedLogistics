const db = require("../db");

exports.getVehicles = (req, res) => {
  db.query("SELECT * FROM vehicles", (err, result) => {
    if (err) return res.status(500).send(err);
    res.json(result);
  });
};

exports.addVehicle = (req, res) => {
  const { number, model, capacity } = req.body;
  db.query(
    "INSERT INTO vehicles (number, model, capacity) VALUES (?, ?, ?)",
    [number, model, capacity],
    (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: "Vehicle number already exists" });
        return res.status(500).json({ message: "DB error" });
      }
      res.status(201).json({ id: result.insertId, number, model, capacity });
    }
  );
};

exports.updateVehicle = (req, res) => {
  const { id } = req.params;
  const { number, model, capacity } = req.body;
  db.query(
    "UPDATE vehicles SET number = ?, model = ?, capacity = ? WHERE id = ?",
    [number, model, capacity, id],
    (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: "Vehicle number already exists" });
        return res.status(500).json({ message: "DB error" });
      }
      if (result.affectedRows === 0) return res.status(404).json({ message: "Vehicle not found" });
      res.json({ message: "Updated" });
    }
  );
};

exports.setVehicleStatus = (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // active | maintenance | inactive
  if (!['active','maintenance','inactive'].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }
  db.query(
    "UPDATE vehicles SET status = ? WHERE id = ?",
    [status, id],
    (err, result) => {
      if (err) return res.status(500).json({ message: "DB error" });
      if (result.affectedRows === 0) return res.status(404).json({ message: "Vehicle not found" });
      res.json({ message: "Status updated" });
    }
  );
};

exports.deleteVehicle = (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM vehicles WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).json({ message: "DB error" });
    if (result.affectedRows === 0) return res.status(404).json({ message: "Vehicle not found" });
    res.json({ message: "Deleted" });
  });
};
