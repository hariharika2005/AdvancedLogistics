import { useEffect, useState } from "react";
import api from "./api";

function AdminDashboard() {
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    api.get("/vehicles").then(res => setVehicles(res.data));
  }, []);

  return (
    <div>
      <h2>Admin Dashboard</h2>
      <ul>
        {vehicles.map(v => (
          <li key={v.id}>{v.number} - {v.model}</li>
        ))}
      </ul>
    </div>
  );
}

export default AdminDashboard;
