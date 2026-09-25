import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { demoBusiness } from "@/lib/demo-data";
import { generateReply } from "@/lib/ai/provider";
import { hasSupabaseServerEnv, isDemoMode } from "@/lib/env";
import type { BusinessContext, ChatMessage } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const slug = String(body.slug || "").slice(0, 80);
    const sessionToken = String(body.sessionToken || "");
    const content = String(body.message || "").trim().slice(0, 1500);
    if (!/^[a-z0-9-]+$/.test(slug) || !/^[0-9a-f-]{36}$/i.test(sessionToken) || !content) return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 400 });

    if (isDemoMode && (!hasSupabaseServerEnv || slug === "demo")) {
      const messages: ChatMessage[] = [...(Array.isArray(body.history) ? body.history.slice(-8) : []), { role: "user", content }];
      const result = await generateReply({ context: demoBusiness, messages });
      return NextResponse.json({ reply: result.text, provider: result.provider, remaining: demoBusiness.tenant.monthly_limit - 128 });
    }

    const db = createAdminClient();
    const { data: tenant } = await db.from("tenants").select("id,name,slug,business_profile,welcome_message,brand_color,monthly_limit,plan").eq("slug", slug).eq("is_active", true).single();
    if (!tenant) return NextResponse.json({ error: "Chatbot tidak ditemukan." }, { status: 404 });
    const { data: usageResult, error: usageError } = await db.rpc("consume_tenant_message", { tenant_uuid: tenant.id });
    if (usageError) throw usageError;
    const usage = Array.isArray(usageResult) ? usageResult[0] : usageResult;
    if (!usage?.allowed) return NextResponse.json({ error: "Kuota pesan bulan ini sudah habis. Silakan hubungi admin bisnis." }, { status: 429 });

    const { data: conversation, error: conversationError } = await db.from("conversations").upsert({ tenant_id: tenant.id, session_token: sessionToken, channel: "web", visitor_name: `Pengunjung #${sessionToken.slice(0,4).toUpperCase()}`, updated_at: new Date().toISOString() }, { onConflict: "tenant_id,session_token" }).select("id").single();
    if (conversationError) throw conversationError;
    await db.from("messages").insert({ tenant_id: tenant.id, conversation_id: conversation.id, role: "user", content });
    const [{ data: faqs }, { data: products }, { data: knowledge }, { data: history }] = await Promise.all([
      db.from("faqs").select("id,question,answer,sort_order").eq("tenant_id", tenant.id).order("sort_order"),
      db.from("products").select("id,name,description,price,price_label,is_active").eq("tenant_id", tenant.id).eq("is_active", true),
      db.from("knowledge_entries").select("id,title,content").eq("tenant_id", tenant.id),
      db.from("messages").select("role,content").eq("conversation_id", conversation.id).order("created_at", { ascending: false }).limit(10),
    ]);
    const context: BusinessContext = { tenant, faqs: faqs || [], products: products || [], knowledge: knowledge || [] };
    const messages = (history || []).reverse() as ChatMessage[];
    let generated;
    try { generated = await generateReply({ context, messages }); }
    catch { generated = { text: "Maaf, asisten sedang mengalami gangguan. Silakan coba lagi sebentar lagi.", provider: "error-fallback" }; }
    await db.from("messages").insert({ tenant_id: tenant.id, conversation_id: conversation.id, role: "assistant", content: generated.text, metadata: { provider: generated.provider } });
    return NextResponse.json({ reply: generated.text, provider: generated.provider, remaining: usage.remaining });
  } catch (error) {
    console.error("chat_api_error", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Layanan sedang bermasalah. Silakan coba lagi." }, { status: 500 });
  }
}
