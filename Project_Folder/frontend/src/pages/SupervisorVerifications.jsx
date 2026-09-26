import { useEffect, useState } from "react";
import Layout from "../components/Layout.jsx";

export default function SupervisorVerifications() {
  const [pending, setPending] = useState([]);
  // TODO: Hook up to an endpoint like /verifications/pending
  useEffect(() => {
    setPending([]);
  }, []);
  return (
    <Layout role="supervisor">
      <h2>Pending Verifications</h2>
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff" }}>
        <div style={{ padding: 12, borderBottom: "1px solid #e5e7eb", fontWeight: 600 }}>Incoming Vehicles</div>
        <div style={{ padding: 12 }}>
          {pending.length === 0 ? (
            <div style={{ color: "#6b7280" }}>No pending verifications.</div>
          ) : (
            <ul>
              {pending.map(p => (
                <li key={p.id}>{p.vehicle} - {p.trip}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Layout>
  );
}
