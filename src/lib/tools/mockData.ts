/**
 * Deterministic, realistic seeded mock for award space and cash fares.
 *
 * Everything is derived from a hash of the query, so the SAME query always
 * returns the SAME seats and prices. That makes a live demo repeatable: ask
 * "YYZ -> NRT business" twice and you get identical results, and the CPP math
 * is stable. Swap this out for a real API via ./dataSource without touching
 * the agent loop.
 */

import {
  AwardDataSource,
  AwardOption,
  AwardSpaceQuery,
  Cabin,
  CashPriceQuery,
  CashPriceResult,
} from "./dataSource";

// ─── Seeded PRNG ─────────────────────────────────────────────────────────────

function hashString(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32: tiny deterministic PRNG returning floats in [0, 1). */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rng = () => number;

const pick = <T>(rng: Rng, arr: T[]): T => arr[Math.floor(rng() * arr.length)];
const between = (rng: Rng, min: number, max: number) => min + rng() * (max - min);
const roundTo = (n: number, step: number) => Math.round(n / step) * step;

// ─── Geography ────────────────────────────────────────────────────────────────

type Region =
  | "NorthAmerica"
  | "Europe"
  | "Asia"
  | "MiddleEast"
  | "Oceania"
  | "SouthAmerica"
  | "Africa";

const AIRPORT_REGION: Record<string, Region> = {
  // North America
  YYZ: "NorthAmerica", YVR: "NorthAmerica", YUL: "NorthAmerica", YYC: "NorthAmerica",
  JFK: "NorthAmerica", EWR: "NorthAmerica", LAX: "NorthAmerica", SFO: "NorthAmerica",
  ORD: "NorthAmerica", BOS: "NorthAmerica", SEA: "NorthAmerica", IAD: "NorthAmerica",
  DFW: "NorthAmerica", MIA: "NorthAmerica", ATL: "NorthAmerica", YOW: "NorthAmerica",
  // Europe
  LHR: "Europe", LGW: "Europe", CDG: "Europe", FRA: "Europe", MUC: "Europe",
  ZRH: "Europe", AMS: "Europe", MAD: "Europe", BCN: "Europe", FCO: "Europe",
  LIS: "Europe", VIE: "Europe", CPH: "Europe", DUB: "Europe", HEL: "Europe",
  // Asia
  NRT: "Asia", HND: "Asia", ICN: "Asia", PVG: "Asia", PEK: "Asia", HKG: "Asia",
  SIN: "Asia", BKK: "Asia", KUL: "Asia", TPE: "Asia", MNL: "Asia", DEL: "Asia",
  BOM: "Asia",
  // Middle East
  DOH: "MiddleEast", DXB: "MiddleEast", AUH: "MiddleEast", JED: "MiddleEast",
  RUH: "MiddleEast", IST: "MiddleEast",
  // Oceania
  SYD: "Oceania", MEL: "Oceania", BNE: "Oceania", AKL: "Oceania", PER: "Oceania",
  // South America
  GRU: "SouthAmerica", EZE: "SouthAmerica", SCL: "SouthAmerica", BOG: "SouthAmerica",
  LIM: "SouthAmerica",
  // Africa
  JNB: "Africa", CPT: "Africa", CAI: "Africa", NBO: "Africa", ADD: "Africa",
};

function regionOf(iata: string): Region {
  return AIRPORT_REGION[iata.toUpperCase()] ?? "NorthAmerica";
}

type Tier = "short" | "medium" | "long" | "ultra";

/** Rough haul tier from a region pair (drives miles + cash scaling). */
function haulTier(a: Region, b: Region): Tier {
  if (a === b) return a === "NorthAmerica" || a === "Asia" ? "medium" : "short";
  const key = [a, b].sort().join("|");
  const ultra = new Set([
    ["Asia", "NorthAmerica"].sort().join("|"),
    ["MiddleEast", "NorthAmerica"].sort().join("|"),
    ["NorthAmerica", "Oceania"].sort().join("|"),
    ["Europe", "Oceania"].sort().join("|"),
    ["Asia", "SouthAmerica"].sort().join("|"),
    ["Africa", "NorthAmerica"].sort().join("|"),
  ]);
  const long = new Set([
    ["Europe", "NorthAmerica"].sort().join("|"),
    ["Asia", "Europe"].sort().join("|"),
    ["Europe", "MiddleEast"].sort().join("|"),
    ["Asia", "MiddleEast"].sort().join("|"),
    ["Asia", "Oceania"].sort().join("|"),
    ["Africa", "Europe"].sort().join("|"),
    ["NorthAmerica", "SouthAmerica"].sort().join("|"),
  ]);
  if (ultra.has(key)) return "ultra";
  if (long.has(key)) return "long";
  return "medium";
}

// ─── Pricing baselines ─────────────────────────────────────────────────────────

const BUSINESS_MILES_BY_TIER: Record<Tier, number> = {
  short: 12500,
  medium: 25000,
  long: 55000,
  ultra: 75000,
};

const CABIN_MILES_MULT: Record<Cabin, number> = {
  economy: 0.45,
  premium: 0.7,
  business: 1.0,
  first: 1.5,
};

const ECON_CASH_BY_TIER: Record<Tier, number> = {
  short: 180,
  medium: 340,
  long: 720,
  ultra: 1150,
};

const CABIN_CASH_MULT: Record<Cabin, number> = {
  economy: 1.0,
  premium: 1.8,
  business: 3.6,
  first: 6.0,
};

// ─── Airline / program templates ────────────────────────────────────────────────

type Template = {
  program: string;
  alliance: AwardOption["alliance"];
  fuelSurcharge: AwardOption["fuelSurcharge"];
  milesFactor: number; // relative to the tier/cabin baseline
  taxesBase: number; // USD before jitter
};

const STAR_POOL: Template[] = [
  { program: "Air Canada Aeroplan", alliance: "Star Alliance", fuelSurcharge: "low", milesFactor: 1.05, taxesBase: 45 },
  { program: "Avianca LifeMiles", alliance: "Star Alliance", fuelSurcharge: "none", milesFactor: 1.0, taxesBase: 30 },
  { program: "United MileagePlus", alliance: "Star Alliance", fuelSurcharge: "none", milesFactor: 1.15, taxesBase: 25 },
  { program: "Turkish Miles&Smiles", alliance: "Star Alliance", fuelSurcharge: "none", milesFactor: 0.9, taxesBase: 40 },
];

const ONEWORLD_POOL: Template[] = [
  { program: "American AAdvantage", alliance: "Oneworld", fuelSurcharge: "none", milesFactor: 1.0, taxesBase: 40 },
  { program: "British Airways Avios", alliance: "Oneworld", fuelSurcharge: "high", milesFactor: 0.95, taxesBase: 350 },
  { program: "Alaska Mileage Plan", alliance: "Oneworld", fuelSurcharge: "none", milesFactor: 0.95, taxesBase: 30 },
  { program: "Cathay Asia Miles", alliance: "Oneworld", fuelSurcharge: "low", milesFactor: 1.05, taxesBase: 60 },
];

const SKYTEAM_POOL: Template[] = [
  { program: "Air France-KLM Flying Blue", alliance: "SkyTeam", fuelSurcharge: "low", milesFactor: 1.0, taxesBase: 200 },
  { program: "Virgin Atlantic Flying Club", alliance: "SkyTeam", fuelSurcharge: "low", milesFactor: 0.95, taxesBase: 150 },
  { program: "Delta SkyMiles", alliance: "SkyTeam", fuelSurcharge: "none", milesFactor: 1.2, taxesBase: 25 },
];

const REPRESENTATIVE_AIRLINE: Record<AwardOption["alliance"], Partial<Record<Region, string>>> = {
  "Star Alliance": {
    Asia: "ANA", Europe: "Lufthansa", MiddleEast: "Turkish Airlines",
    NorthAmerica: "United", Oceania: "Air New Zealand", SouthAmerica: "Avianca",
    Africa: "Ethiopian", // fallthrough
  },
  Oneworld: {
    Asia: "Japan Airlines", Europe: "British Airways", MiddleEast: "Qatar Airways",
    NorthAmerica: "American", Oceania: "Qantas", SouthAmerica: "LATAM",
    Africa: "Royal Air Maroc",
  },
  SkyTeam: {
    Asia: "Korean Air", Europe: "Air France", MiddleEast: "Saudia",
    NorthAmerica: "Delta", Oceania: "China Airlines", SouthAmerica: "Aerolineas Argentinas",
    Africa: "Kenya Airways",
  },
  "Non-alliance": {},
};

function airlineFor(alliance: AwardOption["alliance"], destRegion: Region): string {
  return REPRESENTATIVE_AIRLINE[alliance][destRegion] ?? "partner carrier";
}

// ─── Sweet spots (Section 6 of the system prompt) ────────────────────────────────

/** Curated premium-cabin sweet spots, injected when the route/cabin matches. */
function sweetSpotFor(
  originRegion: Region,
  destRegion: Region,
  cabin: Cabin
): (Template & { airline: string }) | null {
  const premium = cabin === "business" || cabin === "first";
  if (!premium) return null;

  const naOrOce = originRegion === "NorthAmerica";
  if (naOrOce && destRegion === "Asia") {
    // ANA business via Virgin Atlantic Flying Club — legendary value.
    return {
      program: "Virgin Atlantic Flying Club",
      airline: "ANA",
      alliance: "Non-alliance",
      fuelSurcharge: "low",
      milesFactor: 0.78, // ~55-60k business regardless of tier baseline
      taxesBase: 200,
    };
  }
  if (naOrOce && destRegion === "MiddleEast") {
    // Qatar Qsuites via AAdvantage — fixed partner pricing, world-class biz.
    return {
      program: "American AAdvantage",
      airline: "Qatar Airways (Qsuites)",
      alliance: "Oneworld",
      fuelSurcharge: "none",
      milesFactor: 0.95,
      taxesBase: 75,
    };
  }
  if (naOrOce && destRegion === "Europe" && cabin === "business") {
    // Off-peak Iberia business via Avios — as low as ~34k one-way.
    return {
      program: "Iberia Plus (Avios)",
      airline: "Iberia",
      alliance: "Oneworld",
      fuelSurcharge: "low",
      milesFactor: 0.62,
      taxesBase: 180,
    };
  }
  return null;
}

// ─── Date helpers ────────────────────────────────────────────────────────────

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return isoDate;
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// ─── Builders ────────────────────────────────────────────────────────────────

function buildOption(
  rng: Rng,
  tpl: Template & { airline?: string },
  query: AwardSpaceQuery,
  tier: Tier,
  destRegion: Region
): AwardOption {
  const baseMiles = BUSINESS_MILES_BY_TIER[tier] * CABIN_MILES_MULT[query.cabin];
  const miles = roundTo(baseMiles * tpl.milesFactor * between(rng, 0.92, 1.12), 500);
  const taxes = roundTo(tpl.taxesBase * between(rng, 0.85, 1.25), 5);
  const dayOffset = Math.floor(between(rng, -2, 4)); // -2..+3 around the anchor
  const seats = 1 + Math.floor(rng() * 6); // 1-6 partner seats

  return {
    program: tpl.program,
    airline: tpl.airline ?? airlineFor(tpl.alliance, destRegion),
    alliance: tpl.alliance,
    cabin: query.cabin,
    date: addDays(query.date, dayOffset),
    milesRequired: miles,
    taxesFeesUSD: taxes,
    seatsRemaining: seats,
    fuelSurcharge: tpl.fuelSurcharge,
  };
}

export const mockAwardDataSource: AwardDataSource = {
  async searchAwardSpace(query: AwardSpaceQuery): Promise<AwardOption[]> {
    const origin = query.origin.toUpperCase();
    const destination = query.destination.toUpperCase();
    const rng = mulberry32(
      hashString(`${origin}|${destination}|${query.date}|${query.cabin}`)
    );

    const originRegion = regionOf(origin);
    const destRegion = regionOf(destination);
    const tier = haulTier(originRegion, destRegion);

    // Blend all three alliance pools, seeded-shuffle, take a few.
    const pool = [...STAR_POOL, ...ONEWORLD_POOL, ...SKYTEAM_POOL]
      .map((t) => ({ t, k: rng() }))
      .sort((a, b) => a.k - b.k)
      .map((x) => x.t);

    const count = 2 + Math.floor(rng() * 2); // 2-3 generic options
    const chosen: (Template & { airline?: string })[] = pool.slice(0, count);

    const spot = sweetSpotFor(originRegion, destRegion, query.cabin);
    if (spot) chosen.unshift(spot);

    // Dedupe by program, cap at 4.
    const seen = new Set<string>();
    const options: AwardOption[] = [];
    for (const tpl of chosen) {
      if (seen.has(tpl.program)) continue;
      seen.add(tpl.program);
      options.push(buildOption(rng, tpl, query, tier, destRegion));
      if (options.length >= 4) break;
    }

    options.sort((a, b) => a.milesRequired - b.milesRequired);
    return options;
  },

  async getCashPrice(query: CashPriceQuery): Promise<CashPriceResult> {
    const origin = query.origin.toUpperCase();
    const destination = query.destination.toUpperCase();
    const rng = mulberry32(
      hashString(`${origin}|${destination}|${query.date}|${query.cabin}|cash`)
    );

    const originRegion = regionOf(origin);
    const destRegion = regionOf(destination);
    const tier = haulTier(originRegion, destRegion);

    const base = ECON_CASH_BY_TIER[tier] * CABIN_CASH_MULT[query.cabin];
    const price = roundTo(base * between(rng, 0.85, 1.2), 5);
    const carrier = pick(rng, [
      airlineFor("Star Alliance", destRegion),
      airlineFor("Oneworld", destRegion),
      airlineFor("SkyTeam", destRegion),
    ]);

    return {
      cashPriceUSD: price,
      currency: "USD",
      carrier,
      refundable: rng() > 0.7,
    };
  },
};
