import { FormEvent, useState } from "react";
import {
  PlaneTakeoff,
  PlaneLanding,
  Calendar,
  Users,
  Armchair,
  X,
  Sparkles,
  ArrowLeftRight,
} from "lucide-react";
import { Input } from "./Input";
import { Button } from "./Button";
import { User } from "../types/user";

type Cabin = User["preferences"]["cabin"];

type Props = {
  defaultOrigin?: string;
  defaultCabin?: Cabin;
  onSubmit: (prompt: string) => void;
  onClose: () => void;
};

const CABINS: { value: Cabin; label: string }[] = [
  { value: "economy", label: "Economy" },
  { value: "premium", label: "Premium" },
  { value: "business", label: "Business" },
  { value: "first", label: "First" },
];

const todayPlus = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

/** Guided trip planner: structured inputs -> a rich prompt dropped into chat. */
export function TripFinder({ defaultOrigin, defaultCabin, onSubmit, onClose }: Props) {
  const [from, setFrom] = useState(defaultOrigin ?? "");
  const [to, setTo] = useState("");
  const [roundTrip, setRoundTrip] = useState(true);
  const [depart, setDepart] = useState(todayPlus(45));
  const [ret, setRet] = useState(todayPlus(52));
  const [cabin, setCabin] = useState<Cabin>(defaultCabin ?? "business");
  const [passengers, setPassengers] = useState("1");
  const [flexible, setFlexible] = useState(true);
  const [error, setError] = useState("");

  const buildPrompt = (): string => {
    const tripType = roundTrip ? "round-trip" : "one-way";
    const pax = Math.max(1, Number(passengers) || 1);
    const lines = [
      `Plan the best award-travel redemption for this ${tripType} flight:`,
      `- From: ${from.trim().toUpperCase()}`,
      `- To: ${to.trim().toUpperCase()}`,
      `- Departure: ${depart}`,
    ];
    if (roundTrip && ret) lines.push(`- Return: ${ret}`);
    lines.push(`- Cabin: ${cabin}`);
    lines.push(`- Passengers: ${pax}`);
    lines.push(`- Dates flexible: ${flexible ? "yes" : "no"}`);
    lines.push("");
    lines.push(
      "Use my wallet balances and preferences. Rank the top strategies by " +
        "cents-per-point (CPP) value and finish with your #1 recommendation, " +
        "stating its CPP clearly."
    );
    return lines.join("\n");
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (from.trim().length < 3 || to.trim().length < 3) {
      setError("Enter both a From and To airport (city or IATA code).");
      return;
    }
    if (!depart) {
      setError("Pick a departure date.");
      return;
    }
    setError("");
    onSubmit(buildPrompt());
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="animate-fade-in overflow-hidden rounded-2xl border border-pilot/30 bg-[#0d1424]/95 shadow-2xl shadow-pilot/20 backdrop-blur-xl"
    >
      {/* Gradient header */}
      <div className="relative flex items-center justify-between gap-3 bg-gradient-to-r from-pilot/30 via-indigo-500/20 to-transparent px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-pilot to-indigo-500 shadow-lg shadow-pilot/40">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Trip Finder</h3>
            <p className="text-[11px] text-gray-400">
              Fill this in — I'll build a ranked points strategy.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Close Trip Finder"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3.5 p-4">
        {/* From / To */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-300">
              <PlaneTakeoff className="h-3.5 w-3.5 text-pilot" /> From
            </label>
            <Input
              name="from"
              placeholder="YYZ or Toronto"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-300">
              <PlaneLanding className="h-3.5 w-3.5 text-pilot" /> To
            </label>
            <Input
              name="to"
              placeholder="NRT or Tokyo"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        </div>

        {/* Trip type toggle */}
        <div className="inline-flex rounded-xl border border-white/10 bg-white/5 p-0.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setRoundTrip(true)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors ${
              roundTrip ? "bg-pilot text-white shadow" : "text-gray-400 hover:text-white"
            }`}
          >
            <ArrowLeftRight className="h-3.5 w-3.5" /> Round trip
          </button>
          <button
            type="button"
            onClick={() => setRoundTrip(false)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors ${
              !roundTrip ? "bg-pilot text-white shadow" : "text-gray-400 hover:text-white"
            }`}
          >
            <PlaneTakeoff className="h-3.5 w-3.5" /> One way
          </button>
        </div>

        {/* Dates */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-300">
              <Calendar className="h-3.5 w-3.5 text-pilot" /> Departure
            </label>
            <Input
              name="depart"
              type="date"
              value={depart}
              onChange={(e) => setDepart(e.target.value)}
            />
          </div>
          {roundTrip && (
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-300">
                <Calendar className="h-3.5 w-3.5 text-pilot" /> Return
              </label>
              <Input
                name="return"
                type="date"
                value={ret}
                onChange={(e) => setRet(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Cabin / Passengers */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-300">
              <Armchair className="h-3.5 w-3.5 text-pilot" /> Cabin
            </label>
            <select
              value={cabin}
              onChange={(e) => setCabin(e.target.value as Cabin)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white backdrop-blur transition-colors focus:border-pilot/60 focus:outline-none focus:ring-2 focus:ring-pilot/30"
            >
              {CABINS.map((c) => (
                <option key={c.value} value={c.value} className="bg-[#0d1424]">
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-300">
              <Users className="h-3.5 w-3.5 text-pilot" /> Passengers
            </label>
            <Input
              name="passengers"
              type="number"
              min={1}
              max={9}
              step={1}
              value={passengers}
              onChange={(e) => setPassengers(e.target.value)}
            />
          </div>
        </div>

        {/* Flexible dates */}
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={flexible}
            onChange={(e) => setFlexible(e.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-white/5 text-pilot focus:ring-pilot/40"
          />
          My dates are flexible (find the sweet spots)
        </label>

        {error && <p className="text-sm text-red-300">{error}</p>}

        <Button
          type="submit"
          fullWidth
          className="!bg-gradient-to-r !from-pilot !to-indigo-500 !shadow-pilot/30"
        >
          <Sparkles className="h-4 w-4" />
          Find my best redemption
        </Button>
      </div>
    </form>
  );
}
