import type { BusinessContext } from "@/lib/types";

export const demoBusiness: BusinessContext = {
  tenant: {
    id: "demo-tenant",
    name: "Kopi Senandika",
    slug: "demo",
    business_profile: "Kedai kopi lokal yang menyajikan kopi Nusantara, makanan ringan, dan tempat nyaman untuk bekerja.",
    welcome_message: "Halo! Aku Nara, asisten Kopi Senandika. Ada yang bisa kubantu? ☕",
    brand_color: "#6D5DFB",
    monthly_limit: 500,
    plan: "Starter",
    bot_name: "Nara",
    bot_tone: "friendly",
    handoff_whatsapp: "6281234567890",
    lead_capture_enabled: true,
    quick_questions: ["Apa saja produknya?", "Berapa harganya?", "Jam buka kapan?"],
    allow_public_widget: true,
    billing_cycle_start: "2026-09-01",
    channel_config: { web: { enabled: true }, whatsapp: { enabled: false } },
  },
  faqs: [
    { id: "f1", question: "Jam buka?", answer: "Setiap hari pukul 08.00–22.00 WIB.", sort_order: 1 },
    { id: "f2", question: "Ada Wi-Fi?", answer: "Ada, gratis untuk semua pelanggan.", sort_order: 2 },
    { id: "f3", question: "Bisa reservasi?", answer: "Bisa untuk maksimal 20 orang, minimal H-1.", sort_order: 3 },
  ],
  products: [
    { id: "p1", name: "Es Kopi Senandika", description: "Espresso, susu, dan gula aren", price: 22000, price_label: "Rp22.000", is_active: true },
    { id: "p2", name: "Manual Brew", description: "Biji kopi pilihan, V60", price: 28000, price_label: "Mulai Rp28.000", is_active: true },
    { id: "p3", name: "Croissant Butter", description: "Dipanggang setiap pagi", price: 18000, price_label: "Rp18.000", is_active: true },
  ],
  knowledge: [
    { id: "k1", title: "Lokasi dan parkir", content: "Jl. Cerita No. 8, Bandung. Parkir motor tersedia; mobil dapat parkir di gedung sebelah." },
    { id: "k2", title: "Pembayaran", content: "Menerima tunai, QRIS, kartu debit, dan transfer bank." },
  ],
};
