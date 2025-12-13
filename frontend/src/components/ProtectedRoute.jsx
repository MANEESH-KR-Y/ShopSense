import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  // ⛔ STOP redirect until loading is finished
  if (loading) {
    return <div>Loading session...</div>;
  }

  // Token still undefined? Try again (prevents instant redirect)
  // REMOVED: broken check that causes infinite stuck state
  /* if (!isAuthenticated && !window.__accessToken) {
    return <div>Restoring session...</div>;
  } */

  // If still not authenticated, redirect
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
