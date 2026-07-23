import { FormEvent, useMemo, useState } from "react";
import { CreditCard, Plane, Wallet as WalletIcon, Save, CheckCircle2 } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Card } from "../components/Card";
import { StatCard } from "../components/StatCard";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { AwardPilotChat } from "../components/AwardPilotChat";
import { getSession, updateUserPoints } from "../lib/auth";
import { formatPoints } from "../lib/format";
import { User } from "../types/user";

const TYPE_LABEL: Record<string, string> = {
  credit_card: "Credit Card",
  airline: "Airline",
  hotel: "Hotel",
};

export function DashboardPage() {
  // ProtectedRoute guarantees a session exists here.
  const [user, setUser] = useState<User>(() => getSession() as User);

  const [amexInput, setAmexInput] = useState(String(user.amexPoints));
  const [aeroplanInput, setAeroplanInput] = useState(String(user.aeroplanPoints));
  const [formError, setFormError] = useState("");
  const [saved, setSaved] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);

  const initial = user.username.trim().charAt(0).toUpperCase() || "?";

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    setFormError("");

    const amex = Number(amexInput);
    const aeroplan = Number(aeroplanInput);

    const valid = (n: number) => Number.isInteger(n) && n >= 0;
    if (!valid(amex) || !valid(aeroplan)) {
      setFormError("Balances must be whole numbers of 0 or more (no decimals).");
      return;
    }

    const updated = updateUserPoints(user.id, amex, aeroplan);
    if (!updated) {
      setFormError("Could not save balances. Please try again.");
      return;
    }

    setUser(updated);
    setAmexInput(String(updated.amexPoints));
    setAeroplanInput(String(updated.aeroplanPoints));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  const otherPrograms = useMemo(
    () =>
      user.wallet.filter(
        (w) =>
          w.program.toLowerCase() !== "amex membership rewards" &&
          w.program.toLowerCase() !== "air canada aeroplan"
      ),
    [user.wallet]
  );

  return (
    <div className="min-h-screen">
      <Navbar showLogout />

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {/* PROFILE CARD */}
        <Card className="mb-6 flex items-center gap-4 p-5 sm:gap-5 sm:p-6">
          {avatarFailed ? (
            <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pilot to-amex text-3xl font-extrabold text-white">
              {initial}
            </div>
          ) : (
            <img
              src={user.avatarUrl}
              alt={user.username}
              className="h-24 w-24 flex-shrink-0 rounded-full object-cover ring-2 ring-white/20"
              onError={() => setAvatarFailed(true)}
            />
          )}
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold text-white">{user.username}</h1>
            <p className="truncate text-sm text-gray-400">{user.email}</p>
            {user.homeAirports.length > 0 && (
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-xs text-gray-300">
                <Plane className="h-3.5 w-3.5 text-pilot" />
                Home: {user.homeAirports.join(", ")}
              </p>
            )}
          </div>
        </Card>

        {/* MAIN GRID: AwardPilot (dominant) + wallet column */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* AWARDPILOT CHAT — primary element */}
          <section className="lg:col-span-2">
            <AwardPilotChat user={user} />
          </section>

          {/* WALLET COLUMN */}
          <aside className="space-y-6">
            {/* Highlighted point cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <StatCard
                title="Amex Membership Rewards"
                value={formatPoints(user.amexPoints)}
                subtitle="Membership Rewards points"
                accent="#006FCF"
                icon={<CreditCard className="h-5 w-5" />}
              />
              <StatCard
                title="Aeroplan Points"
                value={formatPoints(user.aeroplanPoints)}
                subtitle="Air Canada Aeroplan miles"
                accent="#F01428"
                icon={<Plane className="h-5 w-5" />}
              />
            </div>

            {/* Edit balances form */}
            <Card className="p-5">
              <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-white">
                <Save className="h-4 w-4 text-pilot" />
                Edit Balances
              </h3>
              <form onSubmit={handleSave} className="space-y-4">
                <Input
                  label="Amex Points"
                  name="amex"
                  type="number"
                  min={0}
                  step={1}
                  value={amexInput}
                  onChange={(e) => setAmexInput(e.target.value)}
                />
                <Input
                  label="Aeroplan Points"
                  name="aeroplan"
                  type="number"
                  min={0}
                  step={1}
                  value={aeroplanInput}
                  onChange={(e) => setAeroplanInput(e.target.value)}
                />

                {formError && (
                  <p className="text-sm text-red-300">{formError}</p>
                )}
                {saved && (
                  <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    Balances saved!
                  </p>
                )}

                <Button type="submit" fullWidth>
                  Save Balances
                </Button>
              </form>
            </Card>

            {/* Full wallet list */}
            {user.wallet.length > 0 && (
              <Card className="p-5">
                <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-white">
                  <WalletIcon className="h-4 w-4 text-pilot" />
                  Points Wallet
                </h3>
                <ul className="space-y-2.5">
                  {[...user.wallet]
                    .sort((a, b) => b.balance - a.balance)
                    .map((w) => {
                      const highlighted =
                        w.program.toLowerCase() === "amex membership rewards" ||
                        w.program.toLowerCase() === "air canada aeroplan";
                      return (
                        <li
                          key={w.program}
                          className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-white">
                              {w.program}
                            </p>
                            <p className="text-xs text-gray-500">
                              {TYPE_LABEL[w.type] ?? w.type}
                            </p>
                          </div>
                          <span
                            className={`flex-shrink-0 text-sm font-bold ${
                              highlighted ? "text-white" : "text-gray-300"
                            }`}
                          >
                            {formatPoints(w.balance)}
                          </span>
                        </li>
                      );
                    })}
                </ul>
                {otherPrograms.length === 0 && (
                  <p className="mt-3 text-xs text-gray-500">
                    Add more programs by updating your wallet data.
                  </p>
                )}
              </Card>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
