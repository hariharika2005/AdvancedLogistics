import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function RoleSelect() {
  const [selected, setSelected] = useState("");
  useEffect(() => {
    const saved = localStorage.getItem("preferredRole");
    if (saved) setSelected(saved);
  }, []);
  const onSelect = (role) => {
    setSelected(role);
    localStorage.setItem("preferredRole", role);
  };
  const isChosen = Boolean(selected);
  const loginTo = isChosen ? `/login?role=${selected}` : "/login";
  const registerTo = isChosen ? `/register?role=${selected}` : "/register";
  const isDriver = selected === "driver";

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb" }}>
      {/* Hero header */}
      <div style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #0ea5e9 100%)", color: "#fff" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "28px 16px" }}>
          <h1 style={{ margin: 0 }}>Choose your role</h1>
          <div style={{ opacity: 0.9, marginTop: 6 }}>Tailor the experience for your responsibilities.</div>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "24px 16px" }}>
        <div style={{ color: "#6b7280", marginBottom: 16 }}>
          Select one option below. You can change it later from the role selection screen.
        </div>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <RoleCard
            role="admin"
            title="Admin / Manager"
            description="Manage vehicles and drivers, plan trips, monitor, and analyze performance."
            selected={selected}
            onSelect={onSelect}
          />
          <RoleCard
            role="driver"
            title="Driver"
            description="View your assigned vehicle, start/pause/complete trips, and send location updates."
            selected={selected}
            onSelect={onSelect}
          />
          <RoleCard
            role="supervisor"
            title="Supervisor / Site Incharge"
            description="Verify arrivals and deliveries, close trips, and review site-level reports."
            selected={selected}
            onSelect={onSelect}
          />
        </div>

        {/* CTA Panel */}
        <div style={{ marginTop: 20, background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ color: "#374151" }}>
            {isChosen ? (
              <><strong>Selected:</strong> {selected}</>
            ) : (
              <span>Please select a role to continue</span>
            )}
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <Link to={loginTo}><button className="btn-trans" disabled={!isChosen} style={primary(isChosen)} aria-label="Continue to Login">Continue to Login</button></Link>
            {isDriver ? (
              <button className="btn-trans" disabled style={secondary(false)} aria-label="Driver registration disabled">Drivers are added by Admin</button>
            ) : (
              <Link to={registerTo}><button className="btn-trans" disabled={!isChosen} style={secondary(isChosen)} aria-label="Create an Account">Create an Account</button></Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RoleCard({ role, title, description, selected, onSelect }) {
  const active = selected === role;
  return (
    <div
      onClick={() => onSelect(role)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' ? onSelect(role) : null)}
      style={{
        flex: "1 1 300px",
        background: "#fff",
        border: active ? "2px solid #2563eb" : "1px solid #e5e7eb",
        borderRadius: 14,
        padding: 18,
        cursor: "pointer",
        boxShadow: active ? "0 0 0 4px rgba(37,99,235,0.15)" : "0 1px 3px rgba(0,0,0,0.06)"
      }}
      className="hover-lift fade-in"
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0 }}>{title}</h3>
        {active && <span style={{ color: "#2563eb", fontWeight: 700 }}>Selected</span>}
      </div>
      <p style={{ color: "#6b7280", marginTop: 8 }}>{description}</p>
    </div>
  );
}

function primary(enabled) {
  return {
    background: enabled ? "#2563eb" : "#93c5fd",
    color: "#fff",
    border: 0,
    padding: "10px 14px",
    borderRadius: 8,
    cursor: enabled ? "pointer" : "not-allowed",
    fontWeight: 600
  };
}

function secondary(enabled) {
  return {
    background: enabled ? "#10b981" : "#a7f3d0",
    color: enabled ? "#fff" : "#064e3b",
    border: 0,
    padding: "10px 14px",
    borderRadius: 8,
    cursor: enabled ? "pointer" : "not-allowed",
    fontWeight: 600
  };
}
