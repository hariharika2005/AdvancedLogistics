import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./Login.jsx";
import AdminDashboard from "./AdminDashboard.jsx";
import DriverDashboard from "./DriverDashboard.jsx";
import SupervisorDashboard from "./SupervisorDashboard.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";
import Home from "./Home.jsx";
import Register from "./Register.jsx";
import AdminVehicles from "./pages/AdminVehicles.jsx";
import AdminDrivers from "./pages/AdminDrivers.jsx";
import AdminTrips from "./pages/AdminTrips.jsx";
import AdminTripDetails from "./pages/AdminTripDetails.jsx";
import AdminLiveMap from "./pages/AdminLiveMap.jsx";
import AdminReports from "./pages/AdminReports.jsx";
import SupervisorVerifications from "./pages/SupervisorVerifications.jsx";
import SupervisorReports from "./pages/SupervisorReports.jsx";
import RoleSelect from "./RoleSelect.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/select-role" element={<RoleSelect />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/vehicles"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminVehicles />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/drivers"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminDrivers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/trips"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminTrips />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/trips/:id"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminTripDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/live-map"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminLiveMap />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/driver"
          element={
            <ProtectedRoute roles={["driver"]}>
              <DriverDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/supervisor"
          element={
            <ProtectedRoute roles={["supervisor"]}>
              <SupervisorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/supervisor/verifications"
          element={
            <ProtectedRoute roles={["supervisor"]}>
              <SupervisorVerifications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/supervisor/reports"
          element={
            <ProtectedRoute roles={["supervisor"]}>
              <SupervisorReports />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
