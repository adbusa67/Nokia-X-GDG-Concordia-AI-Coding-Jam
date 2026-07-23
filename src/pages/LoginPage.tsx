import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, Sparkles, AlertCircle } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { loginUser, saveSession } from "../lib/auth";

const DEMO_EMAIL = "demo@pointpilot.com";
const DEMO_PASSWORD = "demo123";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const attemptLogin = (em: string, pw: string) => {
    const user = loginUser({ email: em, password: pw });
    if (!user) {
      setError("Invalid email or password. Please try again.");
      return;
    }
    saveSession(user);
    navigate("/dashboard");
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    attemptLogin(email, password);
  };

  const handleDemo = () => {
    setError("");
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    attemptLogin(DEMO_EMAIL, DEMO_PASSWORD);
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto flex max-w-md flex-col px-4 pb-16 pt-12 sm:pt-16">
        <Card className="p-6 sm:p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-amex/20 text-amex">
              <LogIn className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-extrabold text-white">Welcome back</h1>
            <p className="mt-1 text-sm text-gray-400">Log in to your points hub.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-aeroplan/30 bg-aeroplan/10 px-3 py-2.5 text-sm text-red-300">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" fullWidth size="lg">
              Login
            </Button>
            <Button type="button" variant="secondary" fullWidth onClick={handleDemo}>
              <Sparkles className="h-4 w-4" />
              Use Demo Account
            </Button>
          </form>

          <div className="mt-5 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-gray-400">
            <p className="font-semibold text-gray-300">Demo credentials</p>
            <p className="mt-1">
              Email: <span className="text-white">{DEMO_EMAIL}</span>
            </p>
            <p>
              Password: <span className="text-white">{DEMO_PASSWORD}</span>
            </p>
          </div>

          <p className="mt-6 text-center text-sm text-gray-400">
            No account?{" "}
            <Link to="/register" className="font-semibold text-pilot hover:underline">
              Create one
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
