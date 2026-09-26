import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api";
import Layout from "../components/Layout.jsx";
const UPLOAD_BASE = (typeof window !== 'undefined' && window.location?.hostname)
  ? `http://${window.location.hostname}:5000`
  : 'http://localhost:5000';

export default function AdminTripDetails() {
  const { id } = useParams();
  const [trip, setTrip] = useState(null);
  const [locations, setLocations] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [issues, setIssues] = useState([]);
  const [issuesMsg, setIssuesMsg] = useState("");

  useEffect(() => {
    setLoading(true);
    api.get(`/trips/${id}`, { validateStatus: () => true })
      .then(r => {
        if (r.status === 200) {
          setTrip(r.data.trip);
          setLocations(r.data.locations || []);
        } else {
          setError(r.data?.message || "Failed to load trip");
        }
      })
      .catch(() => setError("Failed to load trip"))
      .finally(() => setLoading(false));
    // Load issues for this trip
    api.get(`/trips/${id}/issues`, { validateStatus: () => true })
      .then(r => {
        if (r.status === 200) {
          setIssues(r.data || []);
          if (!r.data || r.data.length === 0) setIssuesMsg("No issues reported for this trip");
        } else {
          setIssuesMsg(r.data?.message || "Failed to load issues");
        }
      })
      .catch(() => setIssuesMsg("Failed to load issues"));
  }, [id]);

  return (
    <Layout role="admin">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Trip Details</h2>
        <Link to="/admin/trips" style={{ textDecoration: "none", color: "#2563eb" }}>← Back to Trips</Link>
      </div>

      {loading && <div style={{ color: "#6b7280" }}>Loading...</div>}
      {error && <div style={{ color: "#b91c1c" }}>{error}</div>}

      {trip && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff" }}>
            <div style={{ padding: 12, borderBottom: "1px solid #e5e7eb", fontWeight: 600 }}>Overview</div>
            <div style={{ padding: 12, display: "grid", gap: 6 }}>
              <Row label="Trip ID" value={trip.id} />
              <Row label="Vehicle" value={trip.vehicle_number || trip.vehicle_id} />
              <Row label="Driver" value={trip.driver_name || trip.driver_username || trip.driver_id} />
              <Row label="Status" value={trip.status} />
              <Row label="Origin" value={trip.origin} />
              <Row label="Destination" value={trip.destination} />
              <Row label="Material" value={trip.material || "-"} />
              <Row label="Quantity" value={trip.quantity ?? "-"} />
              <Row label="Started" value={trip.started_at || "-"} />
              <Row label="Paused" value={trip.paused_at || "-"} />
              <Row label="Completed" value={trip.completed_at || "-"} />
            </div>
          </div>

          <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff" }}>
            <div style={{ padding: 12, borderBottom: "1px solid #e5e7eb", fontWeight: 600 }}>Recent Locations</div>
            <div style={{ padding: 12, maxHeight: 360, overflowY: "auto" }}>
              {locations.length === 0 && <div style={{ color: "#6b7280" }}>No pings</div>}
              {Array.isArray(locations) && locations.map(loc => (
                  <div key={loc.id || `${loc.trip_id}-${loc.recorded_at}`} style={{ padding: 8, borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between" }}>

                  <div>
                    <div style={{ fontWeight: 600 }}>{Number(loc.lat).toFixed(5)}, {Number(loc.lng).toFixed(5)} </div>

                    <div style={{ color: "#6b7280", fontSize: 12 }}>{loc.recorded_at ? new Date(loc.recorded_at).toLocaleString() : "-"} </div>
                  </div>
                  <div style={{ color: "#374151" }}>{loc.speed != null ? `${loc.speed} km/h` : "-"}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ gridColumn: "1 / -1", border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff" }}>
            <div style={{ padding: 12, borderBottom: "1px solid #e5e7eb", fontWeight: 600 }}>Reported Issues</div>
            <div style={{ padding: 12 }}>
              {issuesMsg && <div style={{ color: issuesMsg.includes("No issues") ? "#6b7280" : "#991b1b" }}>{issuesMsg}</div>}
              {issues.length > 0 && (
                <div style={{ display: "grid", gap: 10 }}>
                  {issues.map(it => (
                    <div key={it.id} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 10, display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{it.description || "(no description)"}</div>
                        {it.address && <div style={{ color: "#6b7280", fontSize: 12, marginTop: 2 }}>{it.address}</div>}
                        <div style={{ color: "#6b7280", fontSize: 12, marginTop: 4 }}>By: {it.full_name || it.username || it.user_id} • {new Date(it.created_at).toLocaleString()}</div>
                        {it.photo_path && (
                          <div style={{ marginTop: 8 }}>
                            <img src={`${UPLOAD_BASE}${it.photo_path}`} alt="Issue" style={{ maxWidth: 280, borderRadius: 6, border: "1px solid #e5e7eb" }} />
                          </div>
                        )}
                      </div>
                      {it.photo_path && (
                        <div style={{ display: "flex", alignItems: "start" }}>
                          <a href={`${UPLOAD_BASE}${it.photo_path}`} target="_blank" rel="noreferrer" style={{ textDecoration: "none", color: "#2563eb" }}>Open Photo</a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
      <div style={{ color: "#6b7280" }}>{label}</div>
      <div style={{ fontWeight: 600 }}>{String(value)}</div>
    </div>
  );
}
