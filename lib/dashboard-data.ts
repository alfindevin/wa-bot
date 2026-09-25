import { redirect } from "next/navigation";
import { demoBusiness } from "@/lib/demo-data";
import { isDemoMode } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { BusinessContext } from "@/lib/types";

export type DashboardData = BusinessContext & {
  usage: number;
  conversationCount: number;
  messageCount: number;
  recentConversations: Array<{ id: string; visitor_name: string | null; channel: string; updated_at: string }>;
};

export async function getDashboardData(): Promise<DashboardData> {
  if (isDemoMode) return {
    ...demoBusiness,
    usage: 127,
    conversationCount: 43,
    messageCount: 286,
    recentConversations: [
      { id: "1", visitor_name: "Pengunjung #8F2A", channel: "web", updated_at: new Date().toISOString() },
      { id: "2", visitor_name: "Pengunjung #1C9B", channel: "web", updated_at: new Date(Date.now()-25*60*1000).toISOString() },
      { id: "3", visitor_name: "Pengunjung #72DD", channel: "web", updated_at: new Date(Date.now()-60*60*1000).toISOString() },
    ],
  };

  const supabase = await createClient();
  const { data: tenant } = await supabase.from("tenants").select("id,name,slug,business_profile,welcome_message,brand_color,monthly_limit,plan").order("created_at").limit(1).maybeSingle();
  if (!tenant) redirect("/onboarding");

  const month = new Date().toISOString().slice(0, 7) + "-01";
  const [faqs, products, knowledge, usage, conversations, messages, recent] = await Promise.all([
    supabase.from("faqs").select("id,question,answer,sort_order").eq("tenant_id", tenant.id).order("sort_order"),
    supabase.from("products").select("id,name,description,price,price_label,is_active").eq("tenant_id", tenant.id).order("created_at"),
    supabase.from("knowledge_entries").select("id,title,content").eq("tenant_id", tenant.id).order("created_at"),
    supabase.from("monthly_usage").select("message_count").eq("tenant_id", tenant.id).eq("month", month).maybeSingle(),
    supabase.from("conversations").select("id", { count: "exact", head: true }).eq("tenant_id", tenant.id),
    supabase.from("messages").select("id", { count: "exact", head: true }).eq("tenant_id", tenant.id),
    supabase.from("conversations").select("id,visitor_name,channel,updated_at").eq("tenant_id", tenant.id).order("updated_at", { ascending: false }).limit(5),
  ]);

  return {
    tenant,
    faqs: faqs.data || [], products: products.data || [], knowledge: knowledge.data || [],
    usage: usage.data?.message_count || 0,
    conversationCount: conversations.count || 0,
    messageCount: messages.count || 0,
    recentConversations: recent.data || [],
  };
}
