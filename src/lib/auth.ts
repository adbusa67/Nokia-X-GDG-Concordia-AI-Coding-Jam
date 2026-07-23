import { User } from "../types/user";
import { defaultUsers } from "../data/defaultUsers";
import { getItem, setItem, removeItem, KEYS } from "./storage";

// ─── Reads ────────────────────────────────────────────────────────────────

/** Users registered at runtime (persisted in localStorage). */
function getExtraUsers(): User[] {
  return getItem<User[]>(KEYS.usersExtra) ?? [];
}

/** defaultUsers + runtime-registered users, merged. */
export function getAllUsers(): User[] {
  return [...defaultUsers, ...getExtraUsers()];
}

// ─── Registration ───────────────────────────────────────────────────────────

type RegisterInput = { email: string; password: string; username: string };
type RegisterResult =
  | { ok: true; user: User }
  | { ok: false; error: string };

export function registerUser(input: RegisterInput): RegisterResult {
  const email = input.email.trim();
  const username = input.username.trim();
  const password = input.password;

  if (!email || !email.includes("@")) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  if (password.length < 6) {
    return { ok: false, error: "Password must be at least 6 characters." };
  }
  if (username.length < 2) {
    return { ok: false, error: "Username must be at least 2 characters." };
  }

  const emailExists = getAllUsers().some(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );
  if (emailExists) {
    return { ok: false, error: "An account with this email already exists." };
  }

  const user: User = {
    id: "u" + Date.now(),
    email,
    password,
    username,
    avatarUrl: "https://i.pravatar.cc/150?u=" + encodeURIComponent(email),
    amexPoints: 0,
    aeroplanPoints: 0,
    wallet: [],
    homeAirports: [],
    preferences: { cabin: "economy", flexibleDates: false, preferredAirlines: [] },
    updatedAt: new Date().toISOString(),
  };

  const extras = getExtraUsers();
  extras.push(user);
  setItem(KEYS.usersExtra, extras);

  return { ok: true, user };
}

// ─── Login / session ─────────────────────────────────────────────────────────

type LoginInput = { email: string; password: string };

export function loginUser(input: LoginInput): User | null {
  const email = input.email.trim().toLowerCase();
  const match = getAllUsers().find(
    (u) => u.email.toLowerCase() === email && u.password === input.password
  );
  return match ?? null;
}

export function saveSession(user: User): void {
  setItem(KEYS.session, user);
}

export function getSession(): User | null {
  return getItem<User>(KEYS.session);
}

export function logout(): void {
  removeItem(KEYS.session);
}

// ─── Point balance updates ────────────────────────────────────────────────────

/**
 * Update the convenience Amex/Aeroplan balances for a user, keep the matching
 * wallet entries in sync, refresh updatedAt, and mirror the change into the
 * active session when it's the same user. Returns the updated user (or null).
 */
export function updateUserPoints(
  userId: string,
  amexPoints: number,
  aeroplanPoints: number
): User | null {
  const apply = (u: User): User => {
    const wallet = syncWallet(u.wallet, amexPoints, aeroplanPoints);
    return {
      ...u,
      amexPoints,
      aeroplanPoints,
      wallet,
      updatedAt: new Date().toISOString(),
    };
  };

  // Runtime-registered users can be persisted back to pp_users_extra.
  const extras = getExtraUsers();
  const extraIdx = extras.findIndex((u) => u.id === userId);
  if (extraIdx !== -1) {
    const updated = apply(extras[extraIdx]);
    extras[extraIdx] = updated;
    setItem(KEYS.usersExtra, extras);
    syncSession(updated);
    return updated;
  }

  // Default (hardcoded) users can't be mutated at their source, but their
  // edits live on through the session snapshot (and any prior extras copy).
  const base = defaultUsers.find((u) => u.id === userId);
  if (base) {
    const updated = apply(base);
    syncSession(updated);
    return updated;
  }

  return null;
}

/** Ensure Amex + Aeroplan wallet entries reflect the convenience fields. */
function syncWallet(
  wallet: User["wallet"],
  amexPoints: number,
  aeroplanPoints: number
): User["wallet"] {
  const next = wallet.map((w) => ({ ...w }));

  const upsert = (
    program: string,
    type: "credit_card" | "airline" | "hotel",
    balance: number
  ) => {
    const idx = next.findIndex(
      (w) => w.program.toLowerCase() === program.toLowerCase()
    );
    if (idx !== -1) next[idx] = { ...next[idx], balance };
    else next.push({ program, type, balance });
  };

  upsert("Amex Membership Rewards", "credit_card", amexPoints);
  upsert("Air Canada Aeroplan", "airline", aeroplanPoints);
  return next;
}

function syncSession(user: User): void {
  const session = getSession();
  if (session && session.id === user.id) {
    saveSession(user);
  }
}
