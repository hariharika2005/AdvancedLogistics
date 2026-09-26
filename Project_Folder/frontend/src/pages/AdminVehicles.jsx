import { useEffect, useState } from "react";
import api from "../api";
import Layout from "../components/Layout.jsx";

export default function AdminVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ number: "", model: "", capacity: "" });
  const [editing, setEditing] = useState(null); // vehicle id
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = () => {
    setLoading(true);
    setError("");
    api.get("/vehicles")
      .then(r => setVehicles(r.data))
      .catch(() => setError("Failed to load vehicles"))
      .finally(() => setLoading(false));
  };

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatusMsg("");
    try {
      if (editing) {
        await api.put(`/vehicles/${editing}`, { ...form, capacity: Number(form.capacity) });
        setStatusMsg("Vehicle updated");
      } else {
        await api.post("/vehicles", { ...form, capacity: Number(form.capacity) });
        setStatusMsg("Vehicle added");
      }
      setForm({ number: "", model: "", capacity: "" });
      setEditing(null);
      loadVehicles();
    } catch (err) {
      setStatusMsg(err?.response?.data?.message || "Save failed");
    }
  };

  const onEdit = (v) => {
    setEditing(v.id);
    setForm({ number: v.number, model: v.model, capacity: String(v.capacity) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onDelete = async (id) => {
    if (!confirm("Delete this vehicle?")) return;
    try {
      await api.delete(`/vehicles/${id}`);
      loadVehicles();
    } catch (err) {
      alert(err?.response?.data?.message || "Delete failed");
    }
  };

  const onStatus = async (id, status) => {
    try {
      await api.patch(`/vehicles/${id}/status`, { status });
      loadVehicles();
    } catch (err) {
      alert(err?.response?.data?.message || "Status update failed");
    }
  };

  return (
    <Layout role="admin">
      <h2 style={{ margin: 0, marginBottom: 12 }}>Vehicles</h2>

      {/* Add/Edit Vehicle Form */}
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff", marginBottom: 16 }}>
        <div style={{ padding: 12, borderBottom: "1px solid #e5e7eb", fontWeight: 600 }}>{editing ? "Edit Vehicle" : "Add Vehicle"}</div>
        <form onSubmit={onSubmit} style={{ padding: 12, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          <div>
            <label>Number</label>
            <input name="number" value={form.number} onChange={onChange} required style={inp()} />
          </div>
          <div>
            <label>Model</label>
            <input name="model" value={form.model} onChange={onChange} required style={inp()} />
          </div>
          <div>
            <label>Capacity</label>
            <input type="number" name="capacity" value={form.capacity} onChange={onChange} required style={inp()} />
          </div>
          <div style={{ alignSelf: "end", display: "flex", gap: 8 }}>
            <button className="btn-trans" type="submit" style={btn("#2563eb")}>{editing ? "Update" : "Add"}</button>
            {editing && <button className="btn-trans" type="button" onClick={() => { setEditing(null); setForm({ number: "", model: "", capacity: "" }); }} style={btn("#6b7280")}>Cancel</button>}
          </div>
          {statusMsg && <div style={{ gridColumn: "1 / -1", color: statusMsg.includes("failed") ? "#b91c1c" : "#065f46" }}>{statusMsg}</div>}
        </form>
      </div>

      {/* Vehicles Table */}
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff" }}>
        <div style={{ padding: 12, borderBottom: "1px solid #e5e7eb", fontWeight: 600, display: "flex", justifyContent: "space-between" }}>
          <span>All Vehicles</span>
          {loading && <span style={{ color: "#6b7280", fontSize: 12 }}>Loading...</span>}
        </div>
        <div style={{ padding: 12, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th()}>Number</th>
                <th style={th()}>Model</th>
                <th style={th()}>Capacity</th>
                <th style={th()}>Status</th>
                <th style={th()}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map(v => (
                <tr key={v.id}>
                  <td style={td()}>{v.number}</td>
                  <td style={td()}>{v.model}</td>
                  <td style={td()}>{v.capacity}</td>
                  <td style={td()}>
                    <select value={v.status || 'active'} onChange={(e) => onStatus(v.id, e.target.value)} style={inp()}>
                      <option value="active">Active</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </td>
                  <td style={td()}>
                    <button className="btn-trans" onClick={() => onEdit(v)} style={btn("#10b981")}>Edit</button>
                    <button className="btn-trans" onClick={() => onDelete(v.id)} style={{ ...btn("#ef4444"), marginLeft: 8 }}>Delete</button>
                  </td>
                </tr>
              ))}
              {vehicles.length === 0 && (
                <tr><td colSpan="5" style={{ padding: 8, color: "#6b7280" }}>No vehicles</td></tr>
              )}
            </tbody>
          </table>
          {error && <div style={{ marginTop: 8, color: "#b91c1c" }}>{error}</div>}
        </div>
      </div>
    </Layout>
  );
}

function inp() { return { width: "100%", padding: 8, border: "1px solid #d1d5db", borderRadius: 6 }; }
function th() { return { textAlign: "left", padding: 8, borderBottom: "1px solid #eee", fontWeight: 600, color: "#374151" }; }
function td() { return { padding: 8, borderBottom: "1px solid #f3f4f6" }; }
function btn(bg) { return { background: bg, color: "#fff", border: 0, padding: "6px 10px", borderRadius: 6, cursor: "pointer" }; }
