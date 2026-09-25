export type Tenant = {
  id: string;
  name: string;
  slug: string;
  business_profile: string;
  welcome_message: string;
  brand_color: string;
  monthly_limit: number;
  plan: string;
  bot_name: string;
  bot_tone: "friendly" | "professional" | "casual";
  handoff_whatsapp: string;
  lead_capture_enabled: boolean;
  quick_questions: string[];
  allow_public_widget?: boolean;
  billing_cycle_start?: string;
  channel_config?: {
    web?: { enabled?: boolean };
    whatsapp?: { enabled?: boolean; phone_number_id?: string; verify_token_set?: boolean };
    api?: { enabled?: boolean };
  };
};

export type FAQ = { id: string; question: string; answer: string; sort_order: number };
export type Product = { id: string; name: string; description: string; price: number; price_label: string; is_active: boolean };
export type KnowledgeEntry = { id: string; title: string; content: string };
export type ChatMessage = { id?: string; role: "user" | "assistant"; content: string; created_at?: string };

export type Conversation = {
  id: string;
  visitor_name: string | null;
  visitor_email?: string | null;
  visitor_phone?: string | null;
  channel: string;
  status?: "open" | "needs_human" | "resolved";
  created_at?: string;
  updated_at: string;
};

export type BusinessContext = {
  tenant: Tenant;
  faqs: FAQ[];
  products: Product[];
  knowledge: KnowledgeEntry[];
};

export type TenantChannel = {
  id: string;
  tenant_id: string;
  channel: "web" | "whatsapp" | "api";
  status: "active" | "draft" | "disabled";
  label: string;
  external_id: string | null;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};
