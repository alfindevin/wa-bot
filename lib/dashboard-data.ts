import { redirect } from "next/navigation";
import { demoBusiness } from "@/lib/demo-data";
import { isDemoMode } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { BusinessContext } from "@/lib/types";

export type DashboardData = BusinessContext & {
  usage: number;
  conversationCount: number;
  messageCount: number;
  recentConversations: Array<{ id: string; visitor_name: string | null; visitor_email?: string | null; visitor_phone?: string | null; channel: string; status?: "open" | "needs_human" | "resolved"; updated_at: string }>;
  analytics: { leadCount: number; needsHumanCount: number; topQuestions: Array<{ question: string; count: number }> };
};

export async function getDashboardData(): Promise<DashboardData> {
  if (isDemoMode) return {
    ...demoBusiness,
    usage: 127,
    conversationCount: 43,
    messageCount: 286,
    recentConversations: [
      { id: "1", visitor_name: "Dina", visitor_email: "dina@example.com", visitor_phone: "628123400001", channel: "web", status: "open", updated_at: new Date().toISOString() },
      { id: "2", visitor_name: "Rizky", visitor_phone: "628123400002", channel: "web", status: "needs_human", updated_at: new Date(Date.now()-25*60*1000).toISOString() },
      { id: "3", visitor_name: "Pengunjung #72DD", channel: "web", status: "resolved", updated_at: new Date(Date.now()-60*60*1000).toISOString() },
    ],
    analytics: { leadCount: 18, needsHumanCount: 3, topQuestions: [{ question: "Jam buka kapan?", count: 14 }, { question: "Berapa harga es kopi?", count: 9 }, { question: "Bisa reservasi?", count: 6 }] },
  };

  const supabase = await createClient();
  const { data: tenant } = await supabase.from("tenants").select("id,name,slug,business_profile,welcome_message,brand_color,monthly_limit,plan,bot_name,bot_tone,handoff_whatsapp,lead_capture_enabled,quick_questions").order("created_at").limit(1).maybeSingle();
  if (!tenant) redirect("/onboarding");

  const month = new Date().toISOString().slice(0, 7) + "-01";
  const [faqs, products, knowledge, usage, conversations, messages, recent, leads, needsHuman, userMessages] = await Promise.all([
    supabase.from("faqs").select("id,question,answer,sort_order").eq("tenant_id", tenant.id).order("sort_order"),
    supabase.from("products").select("id,name,description,price,price_label,is_active").eq("tenant_id", tenant.id).order("created_at"),
    supabase.from("knowledge_entries").select("id,title,content").eq("tenant_id", tenant.id).order("created_at"),
    supabase.from("monthly_usage").select("message_count").eq("tenant_id", tenant.id).eq("month", month).maybeSingle(),
    supabase.from("conversations").select("id", { count: "exact", head: true }).eq("tenant_id", tenant.id),
    supabase.from("messages").select("id", { count: "exact", head: true }).eq("tenant_id", tenant.id),
    supabase.from("conversations").select("id,visitor_name,visitor_email,visitor_phone,channel,status,updated_at").eq("tenant_id", tenant.id).order("updated_at", { ascending: false }).limit(5),
    supabase.from("conversations").select("id", { count: "exact", head: true }).eq("tenant_id", tenant.id).or("visitor_email.not.is.null,visitor_phone.not.is.null"),
    supabase.from("conversations").select("id", { count: "exact", head: true }).eq("tenant_id", tenant.id).eq("status", "needs_human"),
    supabase.from("messages").select("content").eq("tenant_id", tenant.id).eq("role", "user").order("created_at", { ascending: false }).limit(300),
  ]);

  const questionCounts = new Map<string, number>();
  for (const item of userMessages.data || []) {
    const question = item.content.trim().replace(/\s+/g, " ").slice(0, 120);
    if (question) questionCounts.set(question, (questionCounts.get(question) || 0) + 1);
  }
  const topQuestions = [...questionCounts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,5).map(([question,count])=>({question,count}));

  return {
    tenant,
    faqs: faqs.data || [], products: products.data || [], knowledge: knowledge.data || [],
    usage: usage.data?.message_count || 0,
    conversationCount: conversations.count || 0,
    messageCount: messages.count || 0,
    recentConversations: recent.data || [],
    analytics: { leadCount: leads.count || 0, needsHumanCount: needsHuman.count || 0, topQuestions },
  };
}
