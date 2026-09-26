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

export default function SupervisorDashboard() {
  const [summary, setSummary] = useState({ vehicles: 0, drivers: 0, activeTrips: 0, completedTrips: 0 });
  const [error, setError] = useState("");
  const [drivers, setDrivers] = useState([]);
  const [driversErr, setDriversErr] = useState("");

  useEffect(() => {
    api
      .get("/reports/summary")
      .then((res) => setSummary(res.data))
      .catch(() => setError("Failed to load summary"));

    api
      .get("/drivers")
      .then((r) => setDrivers(r.data || []))
      .catch((e) => setDriversErr(e?.response?.data?.message || "Failed to load drivers"));
  }, []);

  return (
    <Layout role="supervisor">
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <StatCard label="Total Vehicles" value={summary.vehicles ?? 0} />
        <StatCard label="Total Drivers" value={summary.drivers ?? 0} />
        <StatCard label="Active Trips" value={summary.activeTrips ?? 0} />
        <StatCard label="Completed Trips" value={summary.completedTrips ?? 0} />
      </div>
      {error && <div style={{ color: "#b91c1c" }}>{error}</div>}
      <div style={{ marginTop: 16, border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff" }}>
        <div style={{ padding: 12, borderBottom: "1px solid #e5e7eb", fontWeight: 600 }}>Drivers</div>
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
              </tr>
            </thead>
            <tbody>
              {drivers.map((d) => (
                <tr key={d.user_id}>
                  <td style={td()}>{d.username}</td>
                  <td style={td()}>{d.full_name || "-"}</td>
                  <td style={td()}>{d.phone || "-"}</td>
                  <td style={td()}>{d.license_no || "-"}</td>
                  <td style={td()}>{d.shift || "-"}</td>
                  <td style={td()}>{d.assigned_vehicle_number || "-"}</td>
                </tr>
              ))}
              {drivers.length === 0 && (
                <tr><td colSpan="6" style={{ padding: 8, color: "#6b7280" }}>No drivers</td></tr>
              )}
            </tbody>
          </table>
          {driversErr && <div style={{ marginTop: 8, color: "#b91c1c" }}>{driversErr}</div>}
        </div>
      </div>
    </Layout>
  );
}

function th() { return { textAlign: "left", padding: 8, borderBottom: "1px solid #eee", fontWeight: 600, color: "#374151" }; }
function td() { return { padding: 8, borderBottom: "1px solid #f3f4f6" }; }
