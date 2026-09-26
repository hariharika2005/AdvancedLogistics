import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import api from "./api";

export default function Register() {
  const nav = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "admin",
    full_name: "",
    phone: "",
    license_no: "",
    shift: "morning"
  });
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [blocked, setBlocked] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const r = params.get("role");
    if (r && ["admin","driver","supervisor"].includes(r)) {
      if (r === "driver") {
        setBlocked(true);
        setForm(prev => ({ ...prev, role: "driver" }));
      } else {
        setForm(prev => ({ ...prev, role: r }));
      }
    }
  }, [location.search]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setOk("");
    if (blocked || form.role === "driver") {
      setError("Drivers are added by Admin. Please contact your manager.");
      return;
    }
    try {
      const body = { ...form };
      if (body.role !== "driver") {
        delete body.license_no;
        delete body.shift;
      }
      await api.post("/auth/register", body);
      setOk("Registered successfully. Please login.");
      setTimeout(() => nav("/login"), 800);
    } catch (err) {
      setError(err?.response?.data?.message || "Registration failed");
    }
  };

  const loginHref = form.role ? `/login?role=${form.role}` : "/login";

  return (
    <div style={{ maxWidth: 480, margin: "40px auto", padding: 16, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10 }}>
      <h2 style={{ marginTop: 0 }}>Create your account {form.role ? `(${form.role})` : ""}</h2>
      {blocked && (
        <div style={{ marginBottom: 12, color: "#b45309", background: "#fffbeb", border: "1px solid #f59e0b", padding: 8, borderRadius: 6 }}>
          Drivers cannot self-register. Please ask an Admin to create your account.
        </div>
      )}
      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: 8 }}>
          <label>Username</label>
          <input name="username" value={form.username} onChange={onChange} required style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Password</label>
          <input type="password" name="password" value={form.password} onChange={onChange} required style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Role</label>
          <select name="role" value={form.role} onChange={onChange} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }}>
            <option value="admin">Admin / Manager</option>
            <option value="supervisor">Supervisor</option>
          </select>
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Full Name</label>
          <input name="full_name" value={form.full_name} onChange={onChange} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Phone</label>
          <input name="phone" value={form.phone} onChange={onChange} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }} />
        </div>
        {form.role === "driver" && (
          <>
            <div style={{ marginBottom: 8 }}>
              <label>License No</label>
              <input name="license_no" value={form.license_no} onChange={onChange} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }} />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label>Shift</label>
              <select name="shift" value={form.shift} onChange={onChange} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }}>
                <option value="morning">Morning</option>
                <option value="evening">Evening</option>
                <option value="night">Night</option>
              </select>
            </div>
          </>
        )}
        {error && <div style={{ color: "red", marginBottom: 8 }}>{error}</div>}
        {ok && <div style={{ color: "green", marginBottom: 8 }}>{ok}</div>}
        <button type="submit" disabled={blocked} style={{ background: "#10b981", color: "#fff", border: 0, padding: "10px 14px", borderRadius: 8, fontWeight: 600, width: "100%", opacity: blocked ? 0.6 : 1 }}>Create account</button>
      </form>
      <div style={{ marginTop: 12, textAlign: "center", color: "#6b7280" }}>
        Already have an account? <Link to={loginHref}>Login</Link>
      </div>
    </div>
  );
}
