/**
 * Award-travel data source adapter.
 *
 * PointPilot's agent calls tools (searchAwardSpace, getCashPrice) instead of
 * guessing. Those tools resolve through the `AwardDataSource` below, so the
 * agent loop never knows whether the data came from a mock or a live API.
 *
 * Today the active source is a deterministic seeded mock (see ./mockData).
 * To go live, implement `seatsAeroDataSource` against the real seats.aero /
 * cash-fare APIs and point `activeDataSource` at it — nothing else changes.
 */

export type Cabin = "economy" | "premium" | "business" | "first";

export type AwardSpaceQuery = {
  origin: string; // IATA, e.g. "YYZ"
  destination: string; // IATA, e.g. "NRT"
  date: string; // YYYY-MM-DD (anchor date; results may span a few days around it)
  cabin: Cabin;
  passengers?: number; // default 1
};

export type AwardOption = {
  program: string; // booking program, e.g. "Virgin Atlantic Flying Club"
  airline: string; // metal flown, e.g. "ANA"
  alliance: "Star Alliance" | "Oneworld" | "SkyTeam" | "Non-alliance";
  cabin: Cabin;
  date: string; // YYYY-MM-DD the seats are actually available
  milesRequired: number; // per passenger, one-way
  taxesFeesUSD: number; // per passenger, paid in cash
  seatsRemaining: number; // partner award seats left at this level
  fuelSurcharge: "none" | "low" | "high";
};

export type CashPriceQuery = {
  origin: string;
  destination: string;
  date: string;
  cabin: Cabin;
  passengers?: number;
};

export type CashPriceResult = {
  cashPriceUSD: number; // per passenger, one-way, all-in
  currency: "USD";
  carrier: string; // representative operating carrier for the fare
  refundable: boolean;
};

export interface AwardDataSource {
  searchAwardSpace(query: AwardSpaceQuery): Promise<AwardOption[]>;
  getCashPrice(query: CashPriceQuery): Promise<CashPriceResult>;
}

import { mockAwardDataSource } from "./mockData";

/**
 * The data source the agent's tools resolve through.
 *
 * TODO(live): replace with `seatsAeroDataSource` once a keyed proxy exists.
 * A real implementation would fetch seats.aero for award space and a fare API
 * for cash prices, mapping their responses onto AwardOption / CashPriceResult.
 */
export const activeDataSource: AwardDataSource = mockAwardDataSource;
