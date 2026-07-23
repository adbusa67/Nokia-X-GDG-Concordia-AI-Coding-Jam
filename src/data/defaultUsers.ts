import { User } from "../types/user";

export const defaultUsers: User[] = [
  {
    id: "u1",
    email: "demo@pointpilot.com",
    password: "demo123",
    username: "Demo User",
    avatarUrl: "https://i.pravatar.cc/150?u=demo",
    amexPoints: 128450,
    aeroplanPoints: 95200,
    wallet: [
      { program: "Amex Membership Rewards", type: "credit_card", balance: 128450 },
      { program: "Chase Ultimate Rewards", type: "credit_card", balance: 60000 },
      { program: "Air Canada Aeroplan", type: "airline", balance: 95200 },
      { program: "Marriott Bonvoy", type: "hotel", balance: 40000 },
    ],
    homeAirports: ["YYZ"],
    preferences: {
      cabin: "business",
      flexibleDates: true,
      preferredAirlines: ["Air Canada"],
    },
    updatedAt: "2026-07-23T12:00:00.000Z",
  },
  {
    id: "u2",
    email: "jane@pointpilot.com",
    password: "password",
    username: "Jane Doe",
    avatarUrl: "https://i.pravatar.cc/150?u=jane",
    amexPoints: 85000,
    aeroplanPoints: 120300,
    wallet: [
      { program: "Amex Membership Rewards", type: "credit_card", balance: 85000 },
      { program: "Air Canada Aeroplan", type: "airline", balance: 120300 },
    ],
    homeAirports: ["YVR"],
    preferences: {
      cabin: "economy",
      flexibleDates: false,
      preferredAirlines: [],
    },
    updatedAt: "2026-07-23T12:00:00.000Z",
  },
];
