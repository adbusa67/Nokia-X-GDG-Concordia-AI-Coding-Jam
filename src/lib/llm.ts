import { ChatMessage, User } from "../types/user";
import { POINT_PILOT_SYSTEM_PROMPT } from "./pointPilotPrompt";

/**
 * PointPilot LLM client.
 *
 * The browser NEVER sees a real model key. It talks to our tiny local backend
 * (server/index.mjs), which uses the Cursor Agent SDK (@cursor/sdk) with
 * CURSOR_API_KEY to reach api.cursor.com — the same mechanism ~/ws/infra-ai
 * uses. The backend speaks an OpenAI-compatible streaming API, so this client
 * is a plain fetch + SSE parser.
 *
 * This is the ONLY external network call in the app (aside from avatar images):
 * everything is proxied through the local backend to the Cursor API.
 *
 * Config comes from Vite env vars (see .env.example):
 *   VITE_LLM_API_KEY   — any non-empty value ("local"); real auth is server-side
 *   VITE_LLM_BASE_URL  — OpenAI-compatible base URL (default the local backend)
 *   VITE_LLM_MODEL     — model id passed through to the backend (default "auto")
 */

// ─── Provider config (swap here to change LLM backends) ──────────────────────
const API_KEY = (import.meta.env.VITE_LLM_API_KEY ?? "").trim();
const BASE_URL = (
  import.meta.env.VITE_LLM_BASE_URL?.trim() || "http://localhost:8787/v1"
).replace(/\/+$/, "");
const MODEL = import.meta.env.VITE_LLM_MODEL?.trim() || "auto";

/** True when the client is configured to talk to the backend. */
export function isLlmConfigured(): boolean {
  return API_KEY.length > 0;
}

/** Build the authoritative user-profile snapshot injected as ground truth. */
function buildProfileContext(user: User): string {
  const snapshot = {
    username: user.username,
    homeAirports: user.homeAirports,
    preferences: user.preferences,
    wallet: user.wallet.map((w) => ({
      program: w.program,
      type: w.type,
      balance: w.balance,
    })),
  };

  return [
    "USER PROFILE (authoritative — use these exact balances):",
    JSON.stringify(snapshot, null, 2),
    "",
    "Treat the balances and preferences above as ground truth. Only recommend",
    "strategies fundable by the currencies the user actually holds or can transfer",
    "to; if a path requires more, clearly label it as requiring additional points.",
  ].join("\n");
}

export type StreamOptions = {
  /** Called with each new chunk of text as it streams in. */
  onToken: (chunk: string) => void;
  /** Optional AbortSignal so the caller can cancel an in-flight response. */
  signal?: AbortSignal;
};

/**
 * Stream PointPilot's reply for the given conversation. The system prompt and a
 * fresh snapshot of the user's wallet/preferences are prepended automatically,
 * so `conversation` should be just the user/assistant turns (latest last).
 *
 * Resolves with the full assistant message once the stream ends. Throws on
 * network/auth/config errors.
 */
export async function streamChat(
  conversation: ChatMessage[],
  userProfile: User,
  { onToken, signal }: StreamOptions,
): Promise<string> {
  if (!isLlmConfigured()) {
    throw new Error(
      "PointPilot isn't connected yet. Copy .env.example to .env, add your " +
        "CURSOR_API_KEY, then run `npm run dev:all`.",
    );
  }

  const systemContent = `${POINT_PILOT_SYSTEM_PROMPT}\n\n${buildProfileContext(
    userProfile,
  )}`;

  const payload = [
    { role: "system", content: systemContent },
    ...conversation.map((m) => ({ role: m.role, content: m.content })),
  ];

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: payload,
      stream: true,
      temperature: 0.4,
    }),
    signal,
  });

  if (!res.ok || !res.body) {
    let detail = "";
    try {
      detail = await res.text();
    } catch {
      /* ignore */
    }
    throw new Error(
      `PointPilot request failed (${res.status} ${res.statusText}).${
        detail ? ` ${detail.slice(0, 300)}` : ""
      }`,
    );
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  // Parse Server-Sent Events: lines of `data: {json}` terminated by blank lines.
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    // Keep the last (possibly partial) line in the buffer.
    buffer = lines.pop() ?? "";

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || !line.startsWith("data:")) continue;

      const data = line.slice(5).trim();
      if (data === "[DONE]") return full;

      try {
        const json = JSON.parse(data);
        const delta: string | undefined = json?.choices?.[0]?.delta?.content;
        if (delta) {
          full += delta;
          onToken(delta);
        }
      } catch {
        // Ignore keep-alive / non-JSON lines.
      }
    }
  }

  return full;
}
