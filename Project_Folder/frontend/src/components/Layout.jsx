import { NavLink, useNavigate } from "react-router-dom";
import { clearAuth, getRole } from "../auth";

export default function Layout({ role: roleProp, children }) {
  const nav = useNavigate();
  const role = roleProp || getRole();

  const onLogout = () => {
    clearAuth();
    nav("/", { replace: true });
  };

  const menu = getMenu(role);

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6", display: "flex", flexDirection: "column" }}>
      <Header role={role} onLogout={onLogout} />
      <div style={{ display: "flex", maxWidth: 1200, margin: "0 auto", width: "100%", flex: 1 }}>
        <aside style={{ width: 240, padding: 16 }}>
          <nav>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {menu.map((m) => (
                <li key={m.to} style={{ marginBottom: 8 }}>
                  <NavLink
                    to={m.to}
                    style={({ isActive }) => ({
                      textDecoration: "none",
                      color: isActive ? "#111827" : "#374151",
                      fontWeight: isActive ? 700 : 500,
                      background: isActive ? "#e5e7eb" : "transparent",
                      padding: "8px 10px",
                      borderRadius: 8,
                      display: "block"
                    })}
                  >
                    {m.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
        <main style={{ flex: 1, padding: 16 }}>{children}</main>
      </div>
      <Footer />
    </div>
  );
}

function Header({ role, onLogout }) {
  return (
    <header style={{ background: "#111827", color: "#fff" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ fontWeight: 700 }}>Advanced Logistics & Fleet Monitoring</div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ opacity: 0.9 }}>Role: {role}</span>
          <button onClick={onLogout} style={{ background: "#ef4444", color: "#fff", border: 0, padding: "6px 10px", borderRadius: 6, cursor: "pointer" }}>Logout</button>
        </div>
      </div>
    </header>
  );
}

function getMenu(role) {
  if (role === "admin") {
    return [
      { label: "Dashboard", to: "/admin" },
      { label: "Vehicles", to: "/admin/vehicles" },
      { label: "Drivers", to: "/admin/drivers" },
      { label: "Trips", to: "/admin/trips" },
      { label: "Live Map", to: "/admin/live-map" },
      { label: "Reports", to: "/admin/reports" }
    ];
  }
  if (role === "driver") {
    return [
      { label: "My Trips", to: "/driver" },
    ];
  }
  if (role === "supervisor") {
    return [
      { label: "Supervisor Dashboard", to: "/supervisor" },
      { label: "Verifications", to: "/supervisor/verifications" },
      { label: "Reports", to: "/supervisor/reports" }
    ];
  }
  return [{ label: "Home", to: "/" }];
}

function Footer() {
  return (
    <footer style={{ marginTop: 16, borderTop: "1px solid #e5e7eb", background: "#ffffff" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "12px 16px", display: "flex", justifyContent: "space-between", color: "#6b7280" }}>
        <div>© {new Date().getFullYear()} Advanced Logistics</div>
        <div style={{ fontSize: 12 }}>All systems operational</div>
      </div>
    </footer>
  );
}
