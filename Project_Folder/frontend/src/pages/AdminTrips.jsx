import { useEffect, useState } from "react";
import api from "../api";
import Layout from "../components/Layout.jsx";
import { Link } from "react-router-dom";

export default function AdminTrips() {
  const [trips, setTrips] = useState([]);
  const [error, setError] = useState("");
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [form, setForm] = useState({ vehicle_id: "", driver_id: "", origin: "", destination: "", material: "", quantity: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api.get("/trips", { validateStatus: () => true }).then(r => {
      if (r.status === 200) setTrips(r.data); else setError("Failed to load trips (need admin/supervisor role)");
    }).catch(() => setError("Failed to load trips"));
    api.get("/vehicles").then(r => setVehicles(r.data || [])).catch(() => setVehicles([]));
    api.get("/drivers").then(r => setDrivers(r.data || [])).catch(() => setDrivers([]));
  }, []);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const reloadTrips = () => {
    api.get("/trips").then(r => setTrips(r.data)).catch(() => {});
  };

  const onCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      const payload = { ...form, vehicle_id: Number(form.vehicle_id), driver_id: Number(form.driver_id), quantity: form.quantity ? Number(form.quantity) : undefined };
      await api.post("/trips", payload);
      setMsg("Trip created");
      setForm({ vehicle_id: "", driver_id: "", origin: "", destination: "", material: "", quantity: "" });
      reloadTrips();
    } catch (err) {
      setMsg(err?.response?.data?.message || "Create failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout role="admin">
      <h2>Trips</h2>
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff", marginBottom: 16 }}>
        <div style={{ padding: 12, borderBottom: "1px solid #e5e7eb", fontWeight: 600 }}>Create Trip</div>
        <form onSubmit={onCreate} style={{ padding: 12, display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12 }}>
          <div>
            <label>Vehicle</label>
            <select name="vehicle_id" value={form.vehicle_id} onChange={onChange} required style={inp()}>
              <option value="">Select</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.number}</option>)}
            </select>
          </div>
          <div>
            <label>Driver</label>
            <select name="driver_id" value={form.driver_id} onChange={onChange} required style={inp()}>
              <option value="">Select</option>
              {drivers.map(d => <option key={d.driver_id} value={d.driver_id}>{d.username}</option>)}
            </select>
          </div>
          <div>
            <label>Origin</label>
            <input name="origin" value={form.origin} onChange={onChange} required style={inp()} />
          </div>
          <div>
            <label>Destination</label>
            <input name="destination" value={form.destination} onChange={onChange} required style={inp()} />
          </div>
          <div>
            <label>Material</label>
            <input name="material" value={form.material} onChange={onChange} style={inp()} />
          </div>
          <div>
            <label>Quantity</label>
            <input type="number" step="0.01" name="quantity" value={form.quantity} onChange={onChange} style={inp()} />
          </div>
          {msg && <div style={{ gridColumn: "1 / -1", color: msg === "Trip created" ? "#065f46" : "#b91c1c" }}>{msg}</div>}
          <div style={{ gridColumn: "1 / -1" }}>
            <button className="btn-trans" type="submit" style={btn("#2563eb")} disabled={saving}>{saving ? "Creating..." : "Create Trip"}</button>
          </div>
        </form>
      </div>
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff" }}>
        <div style={{ padding: 12, borderBottom: "1px solid #e5e7eb", fontWeight: 600 }}>All Trips</div>
        <div style={{ padding: 12, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eee" }}>Trip ID</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eee" }}>Vehicle</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eee" }}>Status</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eee" }}>Origin → Destination</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eee" }}>Material</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eee" }}>Qty</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eee" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {trips.map(t => (
                <tr key={t.id}>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{t.id}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{t.vehicle_number || t.vehicle_id}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{t.status}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{t.origin} → {t.destination}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{t.material || "-"}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{t.quantity ?? "-"}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>
                    <Link to={`/admin/trips/${t.id}`} style={{ ...btn("#10b981"), textDecoration: "none", display: "inline-block" }}>View</Link>
                  </td>
                </tr>
              ))}
              {trips.length === 0 && (
                <tr><td colSpan="7" style={{ padding: 8, color: "#6b7280" }}>No trips</td></tr>
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
function btn(bg) { return { background: bg, color: "#fff", border: 0, padding: "6px 10px", borderRadius: 6, cursor: "pointer" }; }
