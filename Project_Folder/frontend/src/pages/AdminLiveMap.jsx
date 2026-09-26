import { useEffect, useRef, useState } from "react";
import Layout from "../components/Layout.jsx";
import api from "../api";

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;
const DEFAULT_CENTER = { lat: 17.3850, lng: 78.4867 };

export default function AdminLiveMap() {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef({});
  const polylinesRef = useRef({});
  const clusterRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showPaths, setShowPaths] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [autoFit, setAutoFit] = useState(true);

  // Load and persist controls
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('liveMapControls') || '{}');
      if (saved.statusFilter) setStatusFilter(saved.statusFilter);
      if (typeof saved.showPaths === 'boolean') setShowPaths(saved.showPaths);
      if (typeof saved.searchTerm === 'string') setSearchTerm(saved.searchTerm);
      if (typeof saved.autoFit === 'boolean') setAutoFit(saved.autoFit);
    } catch {}
  }, []);
  useEffect(() => {
    localStorage.setItem('liveMapControls', JSON.stringify({ statusFilter, showPaths, searchTerm, autoFit }));
  }, [statusFilter, showPaths, searchTerm, autoFit]);

  useEffect(() => {
    if (!MAPS_KEY) return;
    let script = document.querySelector("script[data-google-maps]");
    if (!script) {
      script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}`;
      script.async = true;
      script.defer = true;
      script.setAttribute("data-google-maps", "1");
      script.onload = initMap;
      document.body.appendChild(script);
    } else {
      if (window.google && window.google.maps) initMap();
      else script.addEventListener("load", initMap);
    }
    // Load MarkerClusterer library
    let clusterScript = document.querySelector("script[data-marker-clusterer]");
    if (!clusterScript) {
      clusterScript = document.createElement("script");
      clusterScript.src = "https://unpkg.com/@googlemaps/markerclusterer/dist/index.min.js";
      clusterScript.async = true;
      clusterScript.defer = true;
      clusterScript.setAttribute("data-marker-clusterer", "1");
      document.body.appendChild(clusterScript);
    }
    return () => {
      // No-op cleanup
    };

  const renderPolylines = (rows, visibleTripIds) => {
    if (!mapInstance.current || !window.google) return;
    if (!showPaths) {
      // remove all existing polylines when paths are hidden
      Object.keys(polylinesRef.current).forEach(k => {
        polylinesRef.current[k].setMap(null);
        delete polylinesRef.current[k];
      });
      return;
    }
    const visibleSet = new Set(visibleTripIds);
    // Group points by trip
    const groups = new Map();
    rows.forEach(r => {
      if (!visibleSet.has(r.trip_id)) return;
      if (!groups.has(r.trip_id)) groups.set(r.trip_id, []);
      groups.get(r.trip_id).push({ lat: Number(r.lat), lng: Number(r.lng) });
    });
    // Update polylines
    // Remove polylines for trips not in visible set
    Object.keys(polylinesRef.current).forEach(k => {
      if (!visibleSet.has(Number(k))) {
        polylinesRef.current[k].setMap(null);
        delete polylinesRef.current[k];
      }
    });
    groups.forEach((path, tripId) => {
      // limit to last 200 points per trip for performance
      if (path.length > 200) {
        path = path.slice(path.length - 200);
      }
      if (path.length < 2) return; // need at least 2 points
      let pl = polylinesRef.current[tripId];
      if (!pl) {
        pl = new window.google.maps.Polyline({
          path,
          geodesic: true,
          strokeColor: '#2563eb',
          strokeOpacity: 0.8,
          strokeWeight: 3,
          map: mapInstance.current,
        });
        polylinesRef.current[tripId] = pl;
      } else {
        pl.setPath(path);
      }
    });
  };
  }, []);

  const initMap = () => {
    if (mapInstance.current || !mapRef.current) return;
    // Restore view if saved
    let view = null;
    try { view = JSON.parse(localStorage.getItem('liveMapView') || 'null'); } catch {}
    const startCenter = view?.center && typeof view.center.lat === 'number' && typeof view.center.lng === 'number' ? view.center : DEFAULT_CENTER;
    const startZoom = typeof view?.zoom === 'number' ? view.zoom : 10;
    mapInstance.current = new window.google.maps.Map(mapRef.current, {
      center: startCenter,
      zoom: startZoom,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });
    // Persist view on idle
    mapInstance.current.addListener('idle', () => {
      try {
        const c = mapInstance.current.getCenter();
        const z = mapInstance.current.getZoom();
        if (c && typeof z === 'number') {
          localStorage.setItem('liveMapView', JSON.stringify({ center: { lat: c.lat(), lng: c.lng() }, zoom: z }));
        }
      } catch {}
    });
    fetchAndRender();
    // Poll every 15s
    const id = setInterval(fetchAndRender, 15000);
    return () => clearInterval(id);
  };

  const fetchAndRender = async () => {
    setLoading(true);
    setError("");
    try {
      const [locs, paths] = await Promise.all([
        api.get("/trips/active-locations/list"),
        api.get("/trips/active-paths/list")
      ]);
      let locations = (locs.data || []).filter(i => statusFilter === 'all' || (i.status || '').toLowerCase() === statusFilter);
      const q = searchTerm.trim().toLowerCase();
      if (q) {
        locations = locations.filter(i => {
          const v = (i.vehicle_number || '').toLowerCase();
          if (v.includes(q)) return true;
          const idStr = String(i.id);
          return idStr.includes(q);
        });
      }
      renderMarkers(locations);
      renderPolylines((paths.data || []), locations.map(i => i.id));
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load active trips");
    } finally {
      setLoading(false);
    }
  };

  const renderMarkers = (items) => {
    if (!mapInstance.current || !window.google) return;
    // Update or create markers keyed by trip id
    const seen = new Set();
    const bounds = new window.google.maps.LatLngBounds();
    items.forEach(item => {
      seen.add(item.id);
      if (item.last_lat != null && item.last_lng != null) {
        const pos = { lat: Number(item.last_lat), lng: Number(item.last_lng) };
        let m = markersRef.current[item.id];
        if (!m) {
          m = new window.google.maps.Marker({
            position: pos,
            map: mapInstance.current,
            title: `Trip ${item.id} - ${item.vehicle_number}`,
            icon: markerIcon(colorForStatus(item.status))
          });
          const info = new window.google.maps.InfoWindow({
            content: `<div style="min-width:200px"><b>Trip ${item.id}</b><br/>Vehicle: ${item.vehicle_number}<br/>Status: ${item.status}<br/><small>${item.last_time || ""}</small><br/><a href="/admin/trips/${item.id}" style="color:#2563eb;text-decoration:none;margin-top:6px;display:inline-block">View Trip ↗</a></div>`
          });
          m.addListener("click", () => info.open({ anchor: m, map: mapInstance.current }));
          markersRef.current[item.id] = m;
        } else {
          m.setPosition(pos);
          m.setIcon(markerIcon(colorForStatus(item.status)));
        }
        bounds.extend(pos);
      }
    });
    // Remove markers for trips no longer active
    Object.keys(markersRef.current).forEach(k => {
      if (!seen.has(Number(k))) {
        markersRef.current[k].setMap(null);
        delete markersRef.current[k];
      }
    });
    // Fit map to markers if any
    const hasPoints = !bounds.isEmpty?.() ? !bounds.isEmpty() : (items.some(i => i.last_lat != null && i.last_lng != null));
    if (autoFit && hasPoints) {
      mapInstance.current.fitBounds(bounds);
    }
    // Rebuild marker clusterer if available
    if (window.markerClusterer && window.markerClusterer.MarkerClusterer) {
      try {
        if (clusterRef.current && clusterRef.current.clearMarkers) {
          clusterRef.current.clearMarkers();
        }
        clusterRef.current = new window.markerClusterer.MarkerClusterer({
          map: mapInstance.current,
          markers: Object.values(markersRef.current),
        });
      } catch {}
    }
  };

  function colorForStatus(status) {
    switch ((status || '').toLowerCase()) {
      case 'planned': return '#6366f1'; // indigo
      case 'started': return '#10b981'; // emerald
      case 'paused': return '#f59e0b'; // amber
      case 'completed': return '#6b7280'; // gray
      case 'cancelled': return '#ef4444'; // red
      default: return '#3b82f6'; // blue
    }
  }

  function markerIcon(color) {
    return {
      path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z",
      fillColor: color,
      fillOpacity: 1,
      strokeWeight: 1,
      strokeColor: '#1f2937',
      scale: 1,
      anchor: new window.google.maps.Point(12, 22)
    };
  }

  return (
    <Layout role="admin">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Live Map</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search vehicle or trip id" style={{ padding: 6, border: '1px solid #d1d5db', borderRadius: 6, minWidth: 220 }} />
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); fetchAndRender(); }} style={{ padding: 6, border: '1px solid #d1d5db', borderRadius: 6 }}>
            <option value="all">All statuses</option>
            <option value="planned">Planned</option>
            <option value="started">Started</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
            <input type="checkbox" checked={showPaths} onChange={(e) => { setShowPaths(e.target.checked); fetchAndRender(); }} />
            Show paths
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
            <input type="checkbox" checked={autoFit} onChange={(e) => { setAutoFit(e.target.checked); fetchAndRender(); }} />
            Auto-fit
          </label>
          <button className="btn-trans" onClick={fetchAndRender} style={{ background: "#2563eb", color: "#fff", border: 0, padding: "6px 10px", borderRadius: 6, cursor: "pointer" }}>Refresh</button>
          <button className="btn-trans" onClick={() => { if (mapInstance.current) { mapInstance.current.setCenter(DEFAULT_CENTER); mapInstance.current.setZoom(10); localStorage.setItem('liveMapView', JSON.stringify({ center: DEFAULT_CENTER, zoom: 10 })); } }} style={{ background: "#0ea5e9", color: "#fff", border: 0, padding: "6px 10px", borderRadius: 6, cursor: "pointer" }}>Reset View</button>
          <button className="btn-trans" onClick={() => {
            setStatusFilter('all');
            setShowPaths(true);
            setSearchTerm('');
            if (mapInstance.current) {
              mapInstance.current.setCenter(DEFAULT_CENTER);
              mapInstance.current.setZoom(10);
            }
            localStorage.removeItem('liveMapControls');
            localStorage.removeItem('liveMapView');
            fetchAndRender();
          }} style={{ background: "#6b7280", color: "#fff", border: 0, padding: "6px 10px", borderRadius: 6, cursor: "pointer" }}>Reset All</button>
        </div>
      </div>
      {!MAPS_KEY && (
        <div style={{ marginBottom: 12, color: "#b45309", background: "#fffbeb", border: "1px solid #f59e0b", padding: 8, borderRadius: 6 }}>
          Set VITE_GOOGLE_MAPS_KEY in your frontend environment to enable the map.
        </div>
      )}
      {error && <div style={{ marginBottom: 8, color: "#b91c1c" }}>{error}</div>}
      <div ref={mapRef} style={{ height: 500, width: "100%", border: "1px solid #e5e7eb", borderRadius: 8, background: "#e5e7eb" }} />
      <div style={{ marginTop: 8, display: "flex", gap: 12, color: "#374151" }}>
        <Legend color="#10b981" label="Started" />
        <Legend color="#f59e0b" label="Paused" />
        <Legend color="#6366f1" label="Planned" />
        <Legend color="#6b7280" label="Completed" />
        <Legend color="#ef4444" label="Cancelled" />
      </div>
      {loading && <div style={{ marginTop: 8, color: "#6b7280" }}>Loading...</div>}
    </Layout>
  );
}
