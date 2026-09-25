import { notFound } from "next/navigation";
import { ChatWidget } from "@/components/chat-widget";
import { createAdminClient } from "@/lib/supabase/admin";
import { demoBusiness } from "@/lib/demo-data";
import { hasSupabaseServerEnv, isDemoMode } from "@/lib/env";
import type { Tenant } from "@/lib/types";

export const metadata = { title: "Chatbot" };

export default async function EmbeddedChatPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let tenant: Tenant | null = null;
  if (isDemoMode && (!hasSupabaseServerEnv || slug === "demo")) tenant = demoBusiness.tenant;
  else {
    const db = createAdminClient();
    const { data } = await db.from("tenants").select("id,name,slug,business_profile,welcome_message,brand_color,monthly_limit,plan,bot_name,bot_tone,handoff_whatsapp,lead_capture_enabled,quick_questions").eq("slug",slug).eq("is_active",true).single();
    tenant = data;
  }
  if (!tenant) notFound();
  return <main className="embed-page"><ChatWidget tenant={tenant}/></main>;
}
