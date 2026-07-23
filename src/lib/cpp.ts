/**
 * Cents-per-point (CPP) extraction + valuation bands.
 *
 * PointPilot's system prompt (Section 4.3) asks the model to report a CPP for
 * each strategy. We scan the assistant's reply for the best CPP mentioned and
 * classify it into the same EXCELLENT / GOOD / FAIR / POOR bands, so the UI can
 * render an instant visual "value meter" instead of a wall of text.
 */

export type CppBandLabel = "EXCELLENT" | "GOOD" | "FAIR" | "POOR";

export type CppBand = {
  label: CppBandLabel;
  /** Hex accent used for text/marker/glow. */
  color: string;
  /** Tailwind classes for the band chip. */
  chip: string;
  blurb: string;
};

/**
 * Pull the best (highest) plausible CPP value from an assistant message.
 * Returns null when no CPP is detectable (e.g. a non-booking answer).
 */
export function extractTopCpp(text: string): number | null {
  if (!text) return null;

  const values: number[] = [];
  const push = (raw: string | undefined) => {
    if (!raw) return;
    const n = parseFloat(raw);
    // Realistic CPP range; filters out stray taxes/dates/percentages.
    if (Number.isFinite(n) && n >= 0.2 && n <= 6) values.push(n);
  };

  const patterns = [
    /(\d+(?:\.\d+)?)\s*¢/g, // "2.1¢"
    /(\d+(?:\.\d+)?)\s*(?:cpp|cents?[-\s]?per[-\s]?point)/gi, // "2.1 CPP"
    /(?:cpp|cents?[-\s]?per[-\s]?point)[^\d]{0,14}(\d+(?:\.\d+)?)/gi, // "CPP: 2.1"
  ];

  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) push(m[1]);
  }

  if (values.length === 0) return null;
  return Math.max(...values);
}

/** Classify a CPP value into its valuation band (mirrors prompt Section 4.3). */
export function cppBand(value: number): CppBand {
  if (value > 2.0) {
    return {
      label: "EXCELLENT",
      color: "#34d399",
      chip: "border-emerald-400/40 bg-emerald-400/15 text-emerald-300",
      blurb: "Outstanding redemption — book it.",
    };
  }
  if (value >= 1.5) {
    return {
      label: "GOOD",
      color: "#7C5CFF",
      chip: "border-pilot/40 bg-pilot/15 text-pilot",
      blurb: "Strong value for your points.",
    };
  }
  if (value >= 1.0) {
    return {
      label: "FAIR",
      color: "#fbbf24",
      chip: "border-amber-400/40 bg-amber-400/15 text-amber-300",
      blurb: "Reasonable, but compare with cash.",
    };
  }
  return {
    label: "POOR",
    color: "#f87171",
    chip: "border-red-400/40 bg-red-400/15 text-red-300",
    blurb: "Low value — paying cash may be better.",
  };
}
