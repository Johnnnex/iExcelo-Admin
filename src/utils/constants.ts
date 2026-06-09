export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

export const X_API_KEY = process.env.NEXT_PUBLIC_X_API_KEY || "";

export const CARD_SHADOW =
  "0 0 0 1px rgba(0,0,0,0.06), 0 5px 22px 0 rgba(0,0,0,0.04)";

export const GRANULARITY_OPTIONS = [
  { label: "Daily", value: "day" as const, hint: "This week" },
  { label: "Weekly", value: "week" as const, hint: "This month" },
  { label: "Monthly", value: "month" as const, hint: "This year" },
];
