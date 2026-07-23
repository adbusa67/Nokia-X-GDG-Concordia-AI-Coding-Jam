export type PointsAccount = {
  program: string; // e.g. "Amex Membership Rewards", "Air Canada Aeroplan"
  type: "credit_card" | "airline" | "hotel";
  balance: number;
};

export type User = {
  id: string;
  email: string;
  password: string;
  username: string;
  avatarUrl: string;
  amexPoints: number; // convenience field, highlighted on dashboard
  aeroplanPoints: number; // convenience field, highlighted on dashboard
  wallet: PointsAccount[]; // full set of programs + balances the AI reads
  homeAirports: string[]; // e.g. ["YYZ"]
  preferences: {
    cabin: "economy" | "premium" | "business" | "first";
    flexibleDates: boolean;
    preferredAirlines: string[];
  };
  updatedAt: string; // ISO 8601 string
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};
