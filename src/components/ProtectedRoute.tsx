import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { getSession } from "../lib/auth";

/** Renders children only when a session exists; otherwise redirects to /login. */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const session = getSession();
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
