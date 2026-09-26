import { Link } from "react-router-dom";

export default function Home() {
  

  return (
    <div>
      {/* Hero Section */}
      <section style={{
        background: "linear-gradient(135deg, #1d4ed8 0%, #0ea5e9 100%)",
        color: "#fff"
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "64px 16px", display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 520px" }}>
            <h1 style={{ margin: 0, fontSize: 36, lineHeight: 1.2 }}>Advanced Logistics & Fleet Monitoring</h1>
            <p style={{ marginTop: 12, opacity: 0.95, fontSize: 16 }}>
              Centralized control for construction sites, mixture plants, and logistics operations. Manage vehicles and drivers, monitor trips in real time, and generate actionable reports.
            </p>
            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
              <Link to="/select-role"><button className="btn-trans" style={primaryBtn()}>Select Role</button></Link>
            </div>
          </div>
          <div style={{ flex: "1 1 360px", background: "rgba(255,255,255,0.12)", borderRadius: 12, padding: 16 }}>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>Live vehicle tracking on map</li>
              <li>Role-based dashboards (Admin, Driver, Supervisor)</li>
              <li>Trip planning and status control</li>
              <li>Reports and performance analytics</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 16px" }}>
        <h2 style={{ marginTop: 16 }}>Why this platform</h2>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 12 }}>
          <FeatureCard title="Fleet Control" desc="Add, assign, and maintain vehicles. Keep the fleet available and efficient." />
          <FeatureCard title="Smart Trips" desc="Plan trips, track progress, and analyze delivery performance." />
          <FeatureCard title="Operational Insights" desc="Daily/weekly/monthly insights and exports for management." />
        </div>
      </section>

      {/* Public Footer */}
      <footer style={{ borderTop: "1px solid #e5e7eb", background: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "12px 16px", display: "flex", justifyContent: "space-between", color: "#6b7280" }}>
          <div>© {new Date().getFullYear()} Advanced Logistics</div>
          <div style={{ fontSize: 12 }}>Built for reliable, real-time fleet monitoring</div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ title, desc }) {
  return (
    <div style={{ flex: "1 1 300px", border: "1px solid #e5e7eb", borderRadius: 10, padding: 16, background: "#fff" }}>
      <div style={{ fontWeight: 700 }}>{title}</div>
      <div style={{ color: "#6b7280", marginTop: 6 }}>{desc}</div>
    </div>
  );
}

function primaryBtn() {
  return {
    background: "#fbbf24",
    color: "#111827",
    border: 0,
    padding: "10px 14px",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600
  };
}

function ghostBtn() {
  return {
    background: "transparent",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.7)",
    padding: "10px 14px",
    borderRadius: 8,
    cursor: "pointer"
  };
}
