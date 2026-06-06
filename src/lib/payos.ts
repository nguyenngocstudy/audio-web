import PayOS from "@payos/node";

export const payos = new PayOS(
  process.env.PAYOS_CLIENT_ID!,
  process.env.PAYOS_API_KEY!,
  process.env.PAYOS_CHECKSUM_KEY!
);

export const PLANS = {
  monthly: { label: "VIP 1 tháng",  price: 49000,  days: 30,  coins: 0   },
  yearly:  { label: "VIP 1 năm",    price: 399000, days: 365, coins: 0   },
  coin100: { label: "100 coin",      price: 20000,  days: 0,   coins: 100 },
  coin500: { label: "500 coin",      price: 89000,  days: 0,   coins: 500 },
} as const;

export type PlanKey = keyof typeof PLANS;
