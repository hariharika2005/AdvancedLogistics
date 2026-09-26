import api from "./api";

function Login() {
  const login = async () => {
    const res = await api.post("/auth/login", {
      username: "admin",
      role: "admin"
    });
    localStorage.setItem("token", res.data.token);
    window.location.href = "/admin";
  };

  return (
    <div>
      <h2>Login</h2>
      <button onClick={login}>Login as Admin</button>
    </div>
  );
}

export default Login;
