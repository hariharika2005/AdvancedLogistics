import { Navigate, useLocation } from "react-router-dom";
import { getToken, getRole } from "./auth";

export default function ProtectedRoute({ roles = [], children }) {
  const token = getToken();
  const role = getRole();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (roles.length > 0 && (!role || !roles.includes(role))) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
