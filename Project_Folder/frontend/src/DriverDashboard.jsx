import { useState, useRef, useEffect } from "react";
const UPLOAD_BASE = (typeof window !== 'undefined' && window.location?.hostname)
  ? `http://${window.location.hostname}:5000`
  : 'http://localhost:5000';
import api from "./api";
import Layout from "./components/Layout.jsx";

export default function DriverDashboard() {
  const [tripId, setTripId] = useState("");
  const [status, setStatus] = useState("");
  const [message, setMessage] = useState("");
  const [processing, setProcessing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [locMsg, setLocMsg] = useState("");

  // Issue reporting state
  const [issueTripId, setIssueTripId] = useState("");
  const [issueDesc, setIssueDesc] = useState("");
  const [issueFile, setIssueFile] = useState(null);
  const [issueMsg, setIssueMsg] = useState("");
  const [issueSending, setIssueSending] = useState(false);

  // Auto location/address
  const [address, setAddress] = useState("");
  const [locating, setLocating] = useState(false);
  const [addrMsg, setAddrMsg] = useState("");

  // Live camera capture
  const [cameraOn, setCameraOn] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const autoLocateTried = useRef(false);

  const call = async (path) => {
    setMessage("");
    if (!tripId) {
      setMessage("Enter Trip ID");
      return;
    }
    setProcessing(true);
    try {
      const res = await api.post(`/trips/${tripId}/${path}`);
      setStatus(path);
      setMessage(res.data.message || `Trip ${path}`);
      setLastUpdated(new Date());
    } catch (e) {
      setMessage(e?.response?.data?.message || "Action failed");
    } finally {
      setProcessing(false);
    }
  };


  const submitIssue = async (e) => {
    e.preventDefault();
    setIssueMsg("");
    if (!issueTripId || (!issueDesc && !issueFile)) {
      setIssueMsg("Enter Trip ID and at least a description or photo");
      return;
    }
    try {
      setIssueSending(true);
      const fd = new FormData();
      fd.append("description", issueDesc);
      if (address) fd.append("address", address);
      if (issueFile) fd.append("photo", issueFile);
      const res = await api.post(`/trips/${issueTripId}/issues`, fd);
      setIssueMsg("Issue submitted");
      setIssueDesc("");
      setIssueFile(null);
      // Reload issues list
      await loadIssues(issueTripId);
    } catch (e) {
      setIssueMsg(e?.response?.data?.message || "Failed to submit issue");
    } finally {
      setIssueSending(false);
    }
  };

  // Issues listing state
  const [issues, setIssues] = useState([]);
  const [issuesLoading, setIssuesLoading] = useState(false);
  const [issuesMsg, setIssuesMsg] = useState("");

  const loadIssues = async (tripIdToLoad) => {
    const tid = tripIdToLoad || issueTripId;
    if (!tid) {
      setIssues([]);
      return;
    }
    try {
      setIssuesLoading(true);
      setIssuesMsg("");
      const r = await api.get(`/trips/${tid}/issues`);
      setIssues(r.data || []);
      if (!r.data || r.data.length === 0) setIssuesMsg("No issues yet for this trip");
    } catch (e) {
      setIssuesMsg(e?.response?.data?.message || "Failed to load issues");
      setIssues([]);
    } finally {
      setIssuesLoading(false);
    }
  };

  const sendLocation = async (e) => {
  e.preventDefault();
  setLocMsg("");

  if (!tripId || lat === "" || lng === "") {
    setLocMsg("Enter Trip ID and allow location access");
    return;
  }

  try {
    await api.post(`/trips/location`, {
      trip_id: Number(tripId),
      lat: Number(lat),
      lng: Number(lng)
    });
    setLocMsg("Location recorded");
  } catch (e) {
    setLocMsg(e?.response?.data?.message || "Failed to record location");
  }
};


  // Use browser geolocation and reverse geocode to fill address
  const useCurrentLocation = () => {
    setAddrMsg("");
    if (!navigator.geolocation) {
      setAddrMsg("Geolocation not supported");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const { latitude, longitude } = pos.coords;
        setLat(latitude.toString());
        setLng(longitude.toString());
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;
        const resp = await fetch(url, { headers: { 'Accept': 'application/json' } });
        if (resp.ok) {
          const data = await resp.json();
          const disp = data.display_name || "";
          setAddress(disp);
          if (!issueDesc) setIssueDesc(disp);
          setAddrMsg("Address filled from current location");
        } else {
          setAddrMsg("Failed to get address");
        }
      } catch (err) {
        setAddrMsg("Error fetching address");
      } finally {
        setLocating(false);
      }
    }, (err) => {
      setAddrMsg(err?.message || "Location permission denied");
      setLocating(false);
    }, { enableHighAccuracy: true, timeout: 10000 });
  };

  // Camera controls
  const startCamera = async () => {
    setIssueMsg("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraOn(true);
      }
    } catch (e) {
      setIssueMsg("Unable to access camera");
    }
  };

  const stopStream = () => {
    const v = videoRef.current;
    if (v && v.srcObject) {
      const tracks = v.srcObject.getTracks();
      tracks.forEach(t => t.stop());
      v.srcObject = null;
    }
    setCameraOn(false);
  };

  const capturePhoto = () => {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c) return;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    const ctx = c.getContext('2d');
    ctx.drawImage(v, 0, 0, c.width, c.height);
    c.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
        setIssueFile(file);
        const url = URL.createObjectURL(blob);
        setPhotoPreview(url);
      }
      stopStream();
    }, 'image/jpeg', 0.92);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStream();
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Try to auto-fill address without typing using Geolocation/Nominatim once
  useEffect(() => {
    if (autoLocateTried.current) return;
    autoLocateTried.current = true;
    try {
      if (navigator && 'permissions' in navigator && navigator.permissions?.query) {
        navigator.permissions.query({ name: 'geolocation' }).then((res) => {
          if (res.state === 'granted' || res.state === 'prompt') {
            useCurrentLocation();
          }
        }).catch(() => {
          // If permissions API fails, still attempt
          useCurrentLocation();
        });
      } else {
        useCurrentLocation();
      }
    } catch (_) {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Layout role="driver">
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr", maxWidth: 900 }}>
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff" }}>
          <div style={{ padding: 12, borderBottom: "1px solid #e5e7eb", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>Current Trip</span>
            <StatusPill status={status} />
          </div>
          <div style={{ padding: 12 }}>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 12, color: "#6b7280" }}>Trip ID</label>
              <input
                value={tripId}
                onChange={(e) => setTripId(e.target.value)}
                style={{ marginLeft: 8, padding: 8, border: "1px solid #d1d5db", borderRadius: 6, minWidth: 160 }}
                placeholder="Enter assigned trip id"
              />
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button disabled={processing} onClick={() => call("start")} style={btn("#10b981", processing)}>
                {processing ? "Processing..." : "Start"}
              </button>
              <button disabled={processing} onClick={() => call("pause")} style={btn("#f59e0b", processing)}>
                {processing ? "Processing..." : "Pause"}
              </button>
              <button disabled={processing} onClick={() => call("complete")} style={btn("#3b82f6", processing)}>
                {processing ? "Processing..." : "Complete"}
              </button>
            </div>
            {lastUpdated && (
              <div style={{ marginTop: 8, color: "#6b7280", fontSize: 12 }}>
                Last updated: {lastUpdated.toLocaleString()}
              </div>
            )}
            {message && (
              <div style={{ marginTop: 10, padding: 10, background: "#ecfeff", border: "1px solid #a5f3fc", color: "#0e7490", borderRadius: 6 }}>
                {message}
              </div>
            )}
            <div style={{ marginTop: 12, color: "#6b7280", fontSize: 12 }}>
              Tip: Ask your supervisor/admin for the assigned Trip ID.
            </div>
          </div>
        </div>

        <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff" }}>
          <div style={{ padding: 12, borderBottom: "1px solid #e5e7eb", fontWeight: 700 }}>Send Location Ping</div>
          <form onSubmit={sendLocation} style={{ padding: 12, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <div>
              <label style={{ fontSize: 12, color: "#6b7280" }}>Trip ID</label>
              <input value={tripId} disabled style={{ marginLeft: 6, padding: 8, border: "1px solid #d1d5db", borderRadius: 6, width: 120, background: "#f3f4f6", cursor: "not-allowed" }} />

            </div>
            <div>
              <label style={{ fontSize: 12, color: "#6b7280" }}>Lat</label>
              <input value={lat} onChange={(e) => setLat(e.target.value)} style={{ marginLeft: 6, padding: 8, border: "1px solid #d1d5db", borderRadius: 6, width: 140 }} placeholder="e.g. 17.448" />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "#6b7280" }}>Lng</label>
              <input value={lng} onChange={(e) => setLng(e.target.value)} style={{ marginLeft: 6, padding: 8, border: "1px solid #d1d5db", borderRadius: 6, width: 140 }} placeholder="e.g. 78.391" />
            </div>
            <button type="submit" disabled={!tripId} style={btn("#111827", !tripId)}>Send </button>

            {locMsg && (
              <div style={{ marginLeft: 6, color: locMsg.includes("recorded") ? "#065f46" : "#991b1b" }}>{locMsg}</div>
            )}
          </form>
        </div>

        <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff" }}>
          <div style={{ padding: 12, borderBottom: "1px solid #e5e7eb", fontWeight: 700 }}>Report Trip Issue</div>
          <form onSubmit={submitIssue} style={{ padding: 12, display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
            <div style={{ gridColumn: "1 / 2" }}>
              <label style={{ fontSize: 12, color: "#6b7280" }}>Trip ID</label>
              <input value={issueTripId} onChange={(e) => setIssueTripId(e.target.value)} style={{ display: "block", marginTop: 6, padding: 8, border: "1px solid #d1d5db", borderRadius: 6, width: 180 }} placeholder="e.g. 12" />
            </div>
            <div style={{ gridColumn: "1 / 2" }}>
              <label style={{ fontSize: 12, color: "#6b7280" }}>Address</label>
              <input value={address} onChange={(e) => setAddress(e.target.value)} style={{ display: "block", marginTop: 6, padding: 8, border: "1px solid #d1d5db", borderRadius: 6, width: "100%" }} placeholder="Auto-filled current address" />
              <div style={{ marginTop: 6 }}>
                <button type="button" onClick={useCurrentLocation} disabled={locating} style={btn("#10b981", locating)}>{locating ? "Locating..." : "Use Current Location"}</button>
                {addrMsg && <span style={{ marginLeft: 8, color: (addrMsg.includes("filled")) ? "#065f46" : "#991b1b" }}>{addrMsg}</span>}
              </div>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: 12, color: "#6b7280" }}>Description</label>
              <textarea value={issueDesc} onChange={(e) => setIssueDesc(e.target.value)} rows={3} style={{ display: "block", marginTop: 6, width: "100%", padding: 8, border: "1px solid #d1d5db", borderRadius: 6 }} placeholder="Traffic jam, road block, breakdown, etc." />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: 12, color: "#6b7280" }}>Photo (optional)</label>
              <input type="file" accept="image/*" onChange={(e) => setIssueFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)} style={{ display: "block", marginTop: 6 }} />
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
                {!cameraOn && <button type="button" onClick={startCamera} style={btn("#111827", false)}>Open Camera</button>}
                {cameraOn && <button type="button" onClick={capturePhoto} style={btn("#2563eb", false)}>Capture Photo</button>}
                {cameraOn && <button type="button" onClick={stopStream} style={btn("#991b1b", false)}>Cancel Camera</button>}
              </div>
              {cameraOn && (
                <div style={{ marginTop: 8 }}>
                  <video ref={videoRef} style={{ width: "100%", maxWidth: 420, borderRadius: 8, background: "#000" }} />
                  <canvas ref={canvasRef} style={{ display: "none" }} />
                </div>
              )}
              {photoPreview && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Captured preview:</div>
                  <img src={photoPreview} alt="Captured" style={{ width: "100%", maxWidth: 320, borderRadius: 8, border: "1px solid #e5e7eb" }} />
                </div>
              )}
              <div style={{ color: "#6b7280", fontSize: 12, marginTop: 4 }}>Attach a photo as proof (traffic, accident, etc.).</div>
            </div>
            {issueMsg && <div style={{ gridColumn: "1 / -1", color: issueMsg.includes("submitted") ? "#065f46" : "#991b1b" }}>{issueMsg}</div>}
            <div style={{ gridColumn: "1 / -1" }}>
              <button type="submit" disabled={issueSending} style={btn("#2563eb", issueSending)}>{issueSending ? "Submitting..." : "Submit Issue"}</button>
              <button type="button" onClick={() => loadIssues()} style={{ ...btn("#374151", false), marginLeft: 8 }}>Load Issues</button>
            </div>
          </form>
        </div>

        {issueTripId && (
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff" }}>
            <div style={{ padding: 12, borderBottom: "1px solid #e5e7eb", fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Recent Issues for Trip #{issueTripId}</span>
              <button type="button" onClick={() => loadIssues()} style={btn("#2563eb", false)}>Refresh</button>
            </div>
            <div style={{ padding: 12 }}>
              {issuesLoading && <div style={{ color: "#6b7280" }}>Loading...</div>}
              {issuesMsg && <div style={{ color: issuesMsg.includes("No issues") ? "#6b7280" : "#991b1b" }}>{issuesMsg}</div>}
              {!issuesLoading && issues.length > 0 && (
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
                          <a href={`${UPLOAD_BASE}${it.photo_path}`} target="_blank" rel="noreferrer" style={{ textDecoration: "none", ...btn("#10b981", false) }}>Open Photo</a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

function btn(color, disabled) {
  return {
    background: disabled ? "#9ca3af" : color,
    color: "#fff",
    border: 0,
    padding: "10px 14px",
    borderRadius: 8,
    cursor: disabled ? "not-allowed" : "pointer",
    minWidth: 110,
    fontWeight: 600
  };
}

function StatusPill({ status }) {
  if (!status) return <span style={{ color: "#6b7280", fontSize: 12 }}>No status</span>;
  const map = {
    start: { bg: "#dcfce7", color: "#166534", text: "Started" },
    pause: { bg: "#fef9c3", color: "#854d0e", text: "Paused" },
    complete: { bg: "#e0e7ff", color: "#3730a3", text: "Completed" }
  };
  const st = map[status] || { bg: "#e5e7eb", color: "#111827", text: status };
  return (
    <span style={{ background: st.bg, color: st.color, padding: "4px 8px", borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
      {st.text}
    </span>
  );
}
