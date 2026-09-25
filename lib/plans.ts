export type PlanKey = "Free" | "Starter" | "Pro" | "Agency";

export const planCatalog: Array<{
  key: PlanKey;
  name: string;
  monthlyLimit: number;
  priceLabel: string;
  description: string;
  features: string[];
}> = [
  {
    key: "Free",
    name: "Free",
    monthlyLimit: 100,
    priceLabel: "Rp0 / bulan",
    description: "Untuk demo, validasi, dan bisnis pertama.",
    features: ["Web chatbot", "1 admin", "Lead capture dasar"],
  },
  {
    key: "Starter",
    name: "Starter",
    monthlyLimit: 500,
    priceLabel: "Rp100.000 / bulan",
    description: "Paket murah yang cocok untuk UMKM awal.",
    features: ["500 pesan AI", "Inbox leads", "Widget website"],
  },
  {
    key: "Pro",
    name: "Pro",
    monthlyLimit: 2000,
    priceLabel: "Rp250.000 / bulan",
    description: "Untuk bisnis yang mulai ramai chat.",
    features: ["2.000 pesan AI", "Prioritas handover", "WhatsApp-ready"],
  },
  {
    key: "Agency",
    name: "Agency",
    monthlyLimit: 10000,
    priceLabel: "Mulai Rp750.000 / bulan",
    description: "Untuk jual ulang ke banyak client.",
    features: ["Multi-tenant", "Setup client", "Kuota besar"],
  },
];

export function getPlan(plan?: string) {
  return planCatalog.find((item) => item.key === plan) || planCatalog[1];
}

export function usagePercent(usage: number, limit: number) {
  if (limit <= 0) return 100;
  return Math.min(100, Math.round((usage / limit) * 100));
}
