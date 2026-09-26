import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "./api";
import { setAuth } from "./auth";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const role = params.get("role");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api.post("/auth/login", { username, password });
      const { token, role, user } = res.data;
      setAuth(token, role, user);
      const redirect = role === "admin" ? "/admin" : role === "driver" ? "/driver" : "/supervisor";
      window.location.href = redirect;
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed");
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", padding: 16, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10 }}>
      <h2 style={{ marginTop: 0 }}>Login {role ? `as ${role}` : ""}</h2>
      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: 8 }}>
          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }}
            required
          />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }}
            required
          />
        </div>
        {error && <div style={{ color: "red", marginBottom: 8 }}>{error}</div>}
        <button type="submit" style={{ background: "#2563eb", color: "#fff", border: 0, padding: "10px 14px", borderRadius: 8, fontWeight: 600, width: "100%" }}>Login</button>
      </form>
      <div style={{ marginTop: 12, textAlign: "center", color: "#6b7280" }}>
        New here? {role === "driver" ? (
          <span>Drivers are created by Admin</span>
        ) : (
          <Link to={role ? `/register?role=${role}` : "/register"}>Create an account</Link>
        )}
      </div>
    </div>
  );
}

export default Login;
