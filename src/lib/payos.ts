import PayOS from "@payos/node";

export const payos = new PayOS(
  process.env.PAYOS_CLIENT_ID!,
  process.env.PAYOS_API_KEY!,
  process.env.PAYOS_CHECKSUM_KEY!
);

export const PLANS = {
  monthly:   { label: "VIP 1 thang",   price: 37000,  days: 30,  coins: 0 },
  quarterly: { label: "VIP 3 thang",   price: 99000, days: 90,  coins: 0 },
  biannual:  { label: "VIP 6 thang",   price: 169000, days: 180, coins: 0 },
  yearly:    { label: "VIP 12 thang",  price: 289000, days: 365, coins: 0 },
} as const;

export type PlanKey = keyof typeof PLANS;
