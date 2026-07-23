import { useNavigate } from "react-router-dom";
import { Bot, Wallet, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Button } from "../components/Button";
import { Card } from "../components/Card";

const features = [
  {
    icon: Bot,
    title: "AI Award Advisor",
    text: "Ask PointPilot how to book any flight for the fewest points, using the balances you already have.",
    accent: "#7C5CFF",
  },
  {
    icon: Wallet,
    title: "Balance Tracking",
    text: "View and update your Amex, Aeroplan, and other program points instantly.",
    accent: "#006FCF",
  },
  {
    icon: ShieldCheck,
    title: "Simple, Private Access",
    text: "Your wallet lives in your browser. Register and log in to your personal points hub.",
    accent: "#F01428",
  },
];

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* HERO */}
      <header className="relative overflow-hidden">
        {/* Animated gradient orbs (CSS only) */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-[-6rem] h-72 w-72 -translate-x-1/2 rounded-full bg-pilot/30 blur-3xl animate-pulse-glow" />
          <div className="absolute left-[15%] top-24 h-56 w-56 rounded-full bg-amex/20 blur-3xl animate-float" />
          <div className="absolute right-[12%] top-40 h-52 w-52 rounded-full bg-aeroplan/20 blur-3xl animate-float [animation-delay:2s]" />
        </div>

        <div className="mx-auto max-w-4xl px-4 pb-16 pt-20 text-center sm:px-6 sm:pt-28">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-gray-300 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-pilot" />
            Powered by PointPilot AI
          </div>

          <h1 className="text-balance text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl">
            Turn your points into{" "}
            <span className="bg-gradient-to-r from-pilot via-indigo-400 to-amex bg-clip-text text-transparent">
              better flights
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-pretty text-base text-gray-400 sm:text-lg">
            Chat with PointPilot, your AI award-travel expert, and track your Amex
            and Aeroplan balances in one premium dashboard.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" onClick={() => navigate("/register")}>
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="secondary" onClick={() => navigate("/login")}>
              Login
            </Button>
          </div>
        </div>
      </header>

      {/* FEATURES */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="grid gap-5 sm:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <Card key={f.title} className="p-6 transition-transform hover:-translate-y-1">
                <div
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${f.accent}22`, color: f.accent }}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-400">{f.text}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-8 text-center text-sm text-gray-500">
        PointPilot — Hackathon Demo 2026
      </footer>
    </div>
  );
}
