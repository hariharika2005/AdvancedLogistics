import { useEffect, useState } from "react";
import api from "./api";
import Layout from "./components/Layout.jsx";

function StatCard({ label, value }) {
  return (
    <div style={{ flex: "1 1 180px", border: "1px solid #e5e7eb", borderRadius: 8, padding: 16, background: "#fff" }}>
      <div style={{ fontSize: 12, color: "#6b7280" }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function AdminDashboard() {
  const [vehicles, setVehicles] = useState([]);
  const [summary, setSummary] = useState({ vehicles: 0, drivers: 0, activeTrips: 0, completedTrips: 0 });
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/vehicles").then(res => setVehicles(res.data)).catch(() => setVehicles([]));
    api.get("/reports/summary").then(res => setSummary(res.data)).catch(() => setError("Failed to load summary"));
  }, []);

  return (
    <Layout role="admin">
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <StatCard label="Total Vehicles" value={summary.vehicles ?? 0} />
        <StatCard label="Total Drivers" value={summary.drivers ?? 0} />
        <StatCard label="Active Trips" value={summary.activeTrips ?? 0} />
        <StatCard label="Completed Trips" value={summary.completedTrips ?? 0} />
      </div>

      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff" }}>
        <div style={{ padding: 12, borderBottom: "1px solid #e5e7eb", fontWeight: 600 }}>Vehicles</div>
        <div style={{ padding: 12, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eee" }}>Number</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eee" }}>Model</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eee" }}>Capacity</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map(v => (
                <tr key={v.id}>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{v.number}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{v.model}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{v.capacity}</td>
                </tr>
              ))}
              {vehicles.length === 0 && (
                <tr><td colSpan="3" style={{ padding: 8, color: "#6b7280" }}>No vehicles</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {error && <div style={{ marginTop: 12, color: "#b91c1c" }}>{error}</div>}
    </Layout>
  );
}

export default AdminDashboard;
