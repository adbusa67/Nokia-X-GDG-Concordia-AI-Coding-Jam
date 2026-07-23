import { ChatMessage, User } from "../types/user";
import { AWARD_PILOT_SYSTEM_PROMPT } from "./awardPilotPrompt";

/**
 * AwardPilot LLM client.
 *
 * This is the ONLY external network call in the app (aside from avatar images).
 * Swap providers by editing the single PROVIDER config block below.
 */

// ─── Provider config (swap here to change LLM providers) ─────────────────────
const MODEL = "gemini-1.5-flash";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const API_KEY = (import.meta.env.VITE_LLM_API_KEY ?? "").trim();

/** True when an API key is configured, i.e. the chat can actually send. */
export function hasApiKey(): boolean {
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

/**
 * Send the conversation to the LLM and return the assistant's reply text.
 * `messages` is the full prior conversation PLUS the new user message (last).
 * Throws on missing key or network/HTTP failure (the UI surfaces a friendly bubble).
 */
export async function sendChat(
  messages: ChatMessage[],
  userProfile: User
): Promise<string> {
  if (!hasApiKey()) {
    throw new Error("Add VITE_LLM_API_KEY to your .env file to enable AwardPilot.");
  }

  const systemInstruction = `${AWARD_PILOT_SYSTEM_PROMPT}\n\n${buildProfileContext(
    userProfile
  )}`;

  // Gemini expects roles "user" and "model".
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  let res: Response;
  try {
    res = await fetch(`${ENDPOINT}?key=${encodeURIComponent(API_KEY)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      }),
    });
  } catch {
    throw new Error(
      "Network error reaching AwardPilot. Check your connection and try again."
    );
  }

  if (!res.ok) {
    let detail = "";
    try {
      const err = await res.json();
      detail = err?.error?.message ? ` (${err.error.message})` : "";
    } catch {
      /* ignore parse errors */
    }
    throw new Error(`AwardPilot request failed: ${res.status}${detail}`);
  }

  let data: any;
  try {
    data = await res.json();
  } catch {
    throw new Error("AwardPilot returned an unreadable response. Please retry.");
  }

  const text: string | undefined =
    data?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p?.text ?? "")
      .join("") ?? undefined;

  if (!text || !text.trim()) {
    const blocked = data?.promptFeedback?.blockReason;
    if (blocked) {
      throw new Error(`AwardPilot could not answer that (${blocked}).`);
    }
    throw new Error("AwardPilot returned an empty response. Please try again.");
  }

  return text.trim();
}
