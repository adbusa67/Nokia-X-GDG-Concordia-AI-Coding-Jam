/**
 * Tiny typed wrapper around localStorage. All persistence in PointPilot goes
 * through here. Parsing/serialization errors are swallowed and reported as
 * null / no-ops so the UI never crashes on corrupt data.
 */

export function getItem<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable — fail silently.
  }
}

export function removeItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // no-op
  }
}

// localStorage keys used across the app (single source of truth).
export const KEYS = {
  usersExtra: "pp_users_extra",
  session: "pp_session",
  chatPrefix: "pp_chat_",
} as const;

export const chatKey = (userId: string) => `${KEYS.chatPrefix}${userId}`;
