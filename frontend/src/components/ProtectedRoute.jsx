// Wraps a page that should only be visible to logged-in operators.
// If nobody is logged in, it redirects to /login instead of rendering.

import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { operator } = useAuth();
  if (!operator) return <Navigate to="/login" replace />;
  return children;
}
