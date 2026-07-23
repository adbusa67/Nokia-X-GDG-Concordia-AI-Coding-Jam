/**
 * Tool wiring for the PointPilot agent.
 *
 * Exposes the Gemini function declarations the model can call, plus a single
 * `executeTool` dispatcher that runs a call against the active data source
 * (seeded mock today, real API later). The agent loop in ../llm.ts owns the
 * request/response cycle; this module owns "what tools exist" and "how to run
 * one".
 */

import { activeDataSource, Cabin } from "./dataSource";

const CABIN_VALUES: Cabin[] = ["economy", "premium", "business", "first"];

// Gemini expects OpenAPI-ish schema types as UPPERCASE strings.
const searchAwardSpaceDeclaration = {
  name: "searchAwardSpace",
  description:
    "Search live award (points/miles) seat availability for a one-way flight. " +
    "Returns real bookable options with the program to book through, the airline " +
    "flown, miles required, cash taxes/fees, seats remaining, and fuel-surcharge " +
    "level. Call this BEFORE claiming any award availability.",
  parameters: {
    type: "OBJECT",
    properties: {
      origin: { type: "STRING", description: "Origin airport IATA code, e.g. YYZ." },
      destination: { type: "STRING", description: "Destination airport IATA code, e.g. NRT." },
      date: { type: "STRING", description: "Anchor departure date, YYYY-MM-DD. Results may span a few days around it." },
      cabin: { type: "STRING", enum: CABIN_VALUES, description: "Cabin class." },
      passengers: { type: "INTEGER", description: "Number of passengers (default 1)." },
    },
    required: ["origin", "destination", "date", "cabin"],
  },
};

const getCashPriceDeclaration = {
  name: "getCashPrice",
  description:
    "Look up the current cash price (USD, one-way, per passenger) for a flight. " +
    "Use this to compute a REAL cents-per-point (CPP) value instead of guessing.",
  parameters: {
    type: "OBJECT",
    properties: {
      origin: { type: "STRING", description: "Origin airport IATA code." },
      destination: { type: "STRING", description: "Destination airport IATA code." },
      date: { type: "STRING", description: "Departure date, YYYY-MM-DD." },
      cabin: { type: "STRING", enum: CABIN_VALUES, description: "Cabin class." },
      passengers: { type: "INTEGER", description: "Number of passengers (default 1)." },
    },
    required: ["origin", "destination", "date", "cabin"],
  },
};

/** Passed to Gemini as the `tools` field. */
export const GEMINI_TOOLS = [
  { functionDeclarations: [searchAwardSpaceDeclaration, getCashPriceDeclaration] },
];

export type ToolArgs = Record<string, unknown>;

function normalizeCabin(value: unknown): Cabin {
  return CABIN_VALUES.includes(value as Cabin) ? (value as Cabin) : "economy";
}

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function num(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Execute a tool call by name and return a plain object for the model's
 * `functionResponse`. Unknown tools resolve to an error payload rather than
 * throwing, so a hallucinated tool name can't break the loop.
 */
export async function executeTool(name: string, args: ToolArgs): Promise<object> {
  const query = {
    origin: str(args.origin),
    destination: str(args.destination),
    date: str(args.date),
    cabin: normalizeCabin(args.cabin),
    passengers: num(args.passengers, 1),
  };

  switch (name) {
    case "searchAwardSpace": {
      const options = await activeDataSource.searchAwardSpace(query);
      return { query, count: options.length, options };
    }
    case "getCashPrice": {
      const price = await activeDataSource.getCashPrice(query);
      return { query, ...price };
    }
    default:
      return { error: `Unknown tool "${name}".` };
  }
}
