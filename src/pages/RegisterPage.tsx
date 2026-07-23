import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus, AlertCircle } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { registerUser, saveSession } from "../lib/auth";

export function RegisterPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    const result = registerUser({ username, email, password });
    if (!result.ok) {
      setError(result.error);
      return;
    }

    // Auto-login on success.
    saveSession(result.user);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto flex max-w-md flex-col px-4 pb-16 pt-12 sm:pt-16">
        <Card className="p-6 sm:p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-pilot/20 text-pilot">
              <UserPlus className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-extrabold text-white">Create your account</h1>
            <p className="mt-1 text-sm text-gray-400">
              Start tracking points and chatting with AwardPilot.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Username"
              name="username"
              type="text"
              autoComplete="name"
              placeholder="Jane Doe"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
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
              autoComplete="new-password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Input
              label="Confirm Password"
              name="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="Re-enter your password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-aeroplan/30 bg-aeroplan/10 px-3 py-2.5 text-sm text-red-300">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" fullWidth size="lg">
              Create Account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-pilot hover:underline">
              Log in
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
