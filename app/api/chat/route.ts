import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { demoBusiness } from "@/lib/demo-data";
import { generateReply } from "@/lib/ai/provider";
import { hasSupabaseServerEnv, isDemoMode } from "@/lib/env";
import type { BusinessContext, ChatMessage } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > 30000) return NextResponse.json({ error: "Permintaan terlalu besar." }, { status: 413 });
    const body = await request.json();
    const slug = String(body.slug || "").slice(0, 80);
    const sessionToken = String(body.sessionToken || "");
    const content = String(body.message || "").trim().slice(0, 1500);
    if (!/^[a-z0-9-]+$/.test(slug) || !/^[0-9a-f-]{36}$/i.test(sessionToken) || !content) return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 400 });

    if (isDemoMode && (!hasSupabaseServerEnv || slug === "demo")) {
      const safeHistory: ChatMessage[] = (Array.isArray(body.history) ? body.history.slice(-8) : []).filter((item: unknown): item is {role:string;content:string} => Boolean(item && typeof item === "object" && "role" in item && "content" in item && typeof (item as {content?:unknown}).content === "string")).map((item:{role:string;content:string})=>({role:item.role === "assistant" ? "assistant" : "user",content:item.content.slice(0,1500)}));
      const messages: ChatMessage[] = [...safeHistory, { role: "user", content }];
      const result = await generateReply({ context: demoBusiness, messages });
      return NextResponse.json({ reply: result.text, provider: result.provider, remaining: demoBusiness.tenant.monthly_limit - 128 });
    }

    const db = createAdminClient();
    const { data: tenant } = await db.from("tenants").select("id,name,slug,business_profile,welcome_message,brand_color,monthly_limit,plan,bot_name,bot_tone,handoff_whatsapp,lead_capture_enabled,quick_questions").eq("slug", slug).eq("is_active", true).single();
    if (!tenant) return NextResponse.json({ error: "Chatbot tidak ditemukan." }, { status: 404 });
    const forwardedIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
    const visitorKey = createHash("sha256").update(`${tenant.id}:${forwardedIp}:${sessionToken}`).digest("hex");
    const { data: rateResult, error: rateError } = await db.rpc("check_chat_rate_limit", { tenant_uuid: tenant.id, visitor_key_hash: visitorKey, max_requests: 20, window_seconds: 60 });
    if (rateError) throw rateError;
    const rate = Array.isArray(rateResult) ? rateResult[0] : rateResult;
    if (!rate?.allowed) return NextResponse.json({ error: "Terlalu banyak pesan. Tunggu sebentar lalu coba lagi." }, { status: 429 });
    const { data: usageResult, error: usageError } = await db.rpc("consume_tenant_message", { tenant_uuid: tenant.id });
    if (usageError) throw usageError;
    const usage = Array.isArray(usageResult) ? usageResult[0] : usageResult;
    if (!usage?.allowed) return NextResponse.json({ error: "Kuota pesan bulan ini sudah habis. Silakan hubungi admin bisnis." }, { status: 429 });

    const visitor = typeof body.visitor === "object" && body.visitor ? body.visitor : {};
    const visitorName = String(visitor.name || "").trim().slice(0, 100) || `Pengunjung #${sessionToken.slice(0,4).toUpperCase()}`;
    const visitorEmailRaw = String(visitor.email || "").trim().toLowerCase().slice(0, 254);
    const visitorPhoneRaw = String(visitor.phone || "").replace(/\D/g, "").slice(0, 20);
    const visitorEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(visitorEmailRaw) ? visitorEmailRaw : null;
    const visitorPhone = visitorPhoneRaw.length >= 8 ? visitorPhoneRaw : null;
    const { data: conversation, error: conversationError } = await db.from("conversations").upsert({ tenant_id: tenant.id, session_token: sessionToken, channel: "web", visitor_name: visitorName, visitor_email: visitorEmail, visitor_phone: visitorPhone, updated_at: new Date().toISOString() }, { onConflict: "tenant_id,session_token" }).select("id").single();
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
    if (generated.provider === "error-fallback") await db.from("conversations").update({ status: "needs_human" }).eq("id", conversation.id);
    return NextResponse.json({ reply: generated.text, provider: generated.provider, remaining: usage.remaining });
  } catch (error) {
    console.error("chat_api_error", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Layanan sedang bermasalah. Silakan coba lagi." }, { status: 500 });
  }
}
