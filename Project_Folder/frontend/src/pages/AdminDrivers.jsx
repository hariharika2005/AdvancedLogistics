import { useEffect, useState } from "react";
import api from "../api";
import Layout from "../components/Layout.jsx";

export default function AdminDrivers() {
  const [drivers, setDrivers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ username: "", password: "", full_name: "", phone: "", license_no: "", shift: "morning" });
  const [formMsg, setFormMsg] = useState("");
  const [vehicles, setVehicles] = useState([]);
  const [editId, setEditId] = useState(null); // users.id to update
  const [editForm, setEditForm] = useState({ full_name: "", phone: "", license_no: "", shift: "morning", password: "" });
  const [assignMap, setAssignMap] = useState({}); // driver_id -> selected vehicle_id

  useEffect(() => {
    loadDrivers();
    loadVehicles();
  }, []);

  const loadDrivers = () => {
    setLoading(true);
    setError("");
    api.get("/drivers")
      .then(r => setDrivers(r.data))
      .catch((e) => setError(e?.response?.data?.message || "Failed to load drivers"))
      .finally(() => setLoading(false));
  };

  const loadVehicles = () => {
    api.get("/vehicles")
      .then(r => setVehicles(r.data || []))
      .catch(() => setVehicles([]));
  };

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onAdd = async (e) => {
    e.preventDefault();
    setFormMsg("");
    try {
      await api.post("/drivers", form);
      setFormMsg("Driver added");
      setForm({ username: "", password: "", full_name: "", phone: "", license_no: "", shift: "morning" });
      loadDrivers();
    } catch (err) {
      setFormMsg(err?.response?.data?.message || "Failed to add driver");
    }
  };

  const onDelete = async (userId) => {
    if (!confirm("Delete this driver?")) return;
    try {
      await api.delete(`/drivers/${userId}`);
      loadDrivers();
    } catch (err) {
      alert(err?.response?.data?.message || "Delete failed");
    }
  };

  const startEdit = (d) => {
    setEditId(d.user_id);
    setEditForm({
      full_name: d.full_name || "",
      phone: d.phone || "",
      license_no: d.license_no || "",
      shift: d.shift || "morning",
      password: ""
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onEditChange = (e) => setEditForm({ ...editForm, [e.target.name]: e.target.value });

  const submitEdit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...editForm };
      if (!payload.password) delete payload.password; // optional
      await api.put(`/drivers/${editId}`, payload);
      setEditId(null);
      loadDrivers();
    } catch (err) {
      alert(err?.response?.data?.message || "Update failed");
    }
  };

  const onAssignChange = (driver_id, vehicle_id) => {
    setAssignMap(prev => ({ ...prev, [driver_id]: vehicle_id }));
  };

  const doAssign = async (driver_id) => {
    const vehicle_id = assignMap[driver_id];
    if (!vehicle_id) return alert("Select a vehicle first");
    try {
      await api.post('/assignments/assign', { driver_id, vehicle_id });
      loadDrivers();
    } catch (err) {
      alert(err?.response?.data?.message || "Assign failed");
    }
  };

  const doUnassign = async (driver_id) => {
    try {
      await api.post('/assignments/unassign', { driver_id });
      loadDrivers();
    } catch (err) {
      alert(err?.response?.data?.message || "Unassign failed");
    }
  };

  const createProfile = async (user_id) => {
    try {
      await api.post(`/drivers/${user_id}/profile`);
      loadDrivers();
    } catch (err) {
      alert(err?.response?.data?.message || "Create profile failed");
    }
  };

  return (
    <Layout role="admin">
      <h2 style={{ margin: 0, marginBottom: 12 }}>Drivers</h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16 }}>
        {/* Add Driver */}
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff" }}>
          <div style={{ padding: 12, borderBottom: "1px solid #e5e7eb", fontWeight: 600 }}>Add Driver</div>
          <form onSubmit={onAdd} style={{ padding: 12, display: "grid", gap: 8 }}>
            <div>
              <label>Username</label>
              <input name="username" value={form.username} onChange={onChange} required style={inp()} />
            </div>
            <div>
              <label>Password</label>
              <input type="password" name="password" value={form.password} onChange={onChange} required style={inp()} />
            </div>
            <div>
              <label>Full Name</label>
              <input name="full_name" value={form.full_name} onChange={onChange} style={inp()} />
            </div>
            <div>
              <label>Phone</label>
              <input name="phone" value={form.phone} onChange={onChange} style={inp()} />
            </div>
            <div>
              <label>License No</label>
              <input name="license_no" value={form.license_no} onChange={onChange} style={inp()} />
            </div>
            <div>
              <label>Shift</label>
              <select name="shift" value={form.shift} onChange={onChange} style={inp()}>
                <option value="morning">Morning</option>
                <option value="evening">Evening</option>
                <option value="night">Night</option>
              </select>
            </div>
            {formMsg && <div style={{ color: formMsg === "Driver added" ? "#065f46" : "#b91c1c" }}>{formMsg}</div>}
            <div>
              <button className="btn-trans" type="submit" style={btn("#2563eb")}>Add Driver</button>
            </div>
          </form>

          {editId && (
            <div style={{ borderTop: "1px solid #e5e7eb", marginTop: 8 }}>
              <div style={{ padding: 12, borderBottom: "1px solid #e5e7eb", fontWeight: 600 }}>Edit Driver</div>
              <form onSubmit={submitEdit} style={{ padding: 12, display: "grid", gap: 8 }}>
                <div>
                  <label>Full Name</label>
                  <input name="full_name" value={editForm.full_name} onChange={onEditChange} style={inp()} />
                </div>
                <div>
                  <label>Phone</label>
                  <input name="phone" value={editForm.phone} onChange={onEditChange} style={inp()} />
                </div>
                <div>
                  <label>License No</label>
                  <input name="license_no" value={editForm.license_no} onChange={onEditChange} style={inp()} />
                </div>
                <div>
                  <label>Shift</label>
                  <select name="shift" value={editForm.shift} onChange={onEditChange} style={inp()}>
                    <option value="morning">Morning</option>
                    <option value="evening">Evening</option>
                    <option value="night">Night</option>
                  </select>
                </div>
                <div>
                  <label>Reset Password (optional)</label>
                  <input type="password" name="password" value={editForm.password} onChange={onEditChange} style={inp()} placeholder="Leave blank to keep" />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn-trans" type="submit" style={btn("#10b981")}>Save Changes</button>
                  <button className="btn-trans" type="button" onClick={() => setEditId(null)} style={btn("#6b7280")}>Cancel</button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Drivers Table */}
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff" }}>
          <div style={{ padding: 12, borderBottom: "1px solid #e5e7eb", fontWeight: 600, display: "flex", justifyContent: "space-between" }}>
            <span>All Drivers</span>
            {loading && <span style={{ color: "#6b7280", fontSize: 12 }}>Loading...</span>}
          </div>
          <div style={{ padding: 12, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={th()}>Username</th>
                  <th style={th()}>Full Name</th>
                  <th style={th()}>Phone</th>
                  <th style={th()}>License</th>
                  <th style={th()}>Shift</th>
                  <th style={th()}>Assigned Vehicle</th>
                  <th style={th()}>Assign</th>
                  <th style={th()}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map(d => (
                  <tr key={d.user_id}>
                    <td style={td()}>{d.username}</td>
                    <td style={td()}>{d.full_name || "-"}</td>
                    <td style={td()}>{d.phone || "-"}</td>
                    <td style={td()}>{d.license_no || "-"}</td>
                    <td style={td()}>{d.shift || "-"}</td>
                    <td style={td()}>{d.assigned_vehicle_number || "-"}</td>
                    <td style={td()}>
                      <select disabled={!d.driver_id} value={assignMap[d.driver_id] || ""} onChange={(e) => onAssignChange(d.driver_id, e.target.value)} style={inp()}>
                        <option value="">Select vehicle</option>
                        {vehicles.filter(v => (v.status || 'active') !== 'inactive').map(v => (
                          <option key={v.id} value={v.id}>{v.number}</option>
                        ))}
                      </select>
                      <div style={{ marginTop: 6, display: "flex", gap: 6 }}>
                        <button className="btn-trans" disabled={!d.driver_id} onClick={() => doAssign(d.driver_id)} style={btn("#2563eb")}>Assign</button>
                        {d.assigned_vehicle_id && (
                          <button className="btn-trans" onClick={() => doUnassign(d.driver_id)} style={btn("#f59e0b")}>Unassign</button>
                        )}
                      </div>
                    </td>
                    <td style={td()}>
                      {d.driver_id ? (
                        <button className="btn-trans" onClick={() => startEdit(d)} style={btn("#10b981")}>Edit</button>
                      ) : (
                        <button className="btn-trans" onClick={() => createProfile(d.user_id)} style={btn("#10b981")}>Create Profile</button>
                      )}
                      <button className="btn-trans" onClick={() => onDelete(d.user_id)} style={{ ...btn("#ef4444"), marginLeft: 6 }}>Delete</button>
                    </td>
                  </tr>
                ))}
                {drivers.length === 0 && (
                  <tr><td colSpan="8" style={{ padding: 8, color: "#6b7280" }}>No drivers</td></tr>
                )}
              </tbody>
            </table>
            {error && <div style={{ marginTop: 8, color: "#b91c1c" }}>{error}</div>}
          </div>
        </div>
      </div>
    </Layout>
  );
}

function inp() { return { width: "100%", padding: 8, border: "1px solid #d1d5db", borderRadius: 6 }; }
function th() { return { textAlign: "left", padding: 8, borderBottom: "1px solid #eee", fontWeight: 600, color: "#374151" }; }
function td() { return { padding: 8, borderBottom: "1px solid #f3f4f6" }; }
function btn(bg) { return { background: bg, color: "#fff", border: 0, padding: "6px 10px", borderRadius: 6, cursor: "pointer" }; }
