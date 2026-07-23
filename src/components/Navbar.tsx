import { Link, useNavigate } from "react-router-dom";
import { Plane, LogOut } from "lucide-react";
import { Button } from "./Button";
import { getSession, logout } from "../lib/auth";

type NavbarProps = {
  /** Show a Logout action (used inside the protected dashboard). */
  showLogout?: boolean;
  onLogout?: () => void;
};

export function Navbar({ showLogout = false, onLogout }: NavbarProps) {
  const navigate = useNavigate();
  const session = getSession();

  const handleLogout = () => {
    logout();
    onLogout?.();
    navigate("/login");
  };

  return (
    <nav className="sticky top-0 z-40 border-b border-white/10 bg-[#0B1220]/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-pilot to-amex">
            <Plane className="h-4 w-4 text-white" />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-white">
            Point<span className="text-pilot">Pilot</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {showLogout ? (
            <Button variant="secondary" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          ) : session ? (
            <Link to="/dashboard">
              <Button variant="primary" size="sm">
                Go to Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
