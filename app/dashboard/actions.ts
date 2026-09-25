"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/env";

async function tenantId() {
  const supabase = await createClient();
  const { data } = await supabase.from("tenants").select("id").order("created_at").limit(1).single();
  if (!data) throw new Error("Workspace tidak ditemukan.");
  return { supabase, id: data.id };
}

function done() { revalidatePath("/dashboard"); }

export async function updateBusiness(formData: FormData) {
  if (isDemoMode) return;
  const { supabase, id } = await tenantId();
  const brandColor = String(formData.get("brand_color") || "#6D5DFB");
  const { error } = await supabase.from("tenants").update({
    name: String(formData.get("name") || "").trim(),
    business_profile: String(formData.get("business_profile") || "").trim(),
    welcome_message: String(formData.get("welcome_message") || "").trim(),
    brand_color: /^#[0-9A-Fa-f]{6}$/.test(brandColor) ? brandColor : "#6D5DFB",
  }).eq("id", id);
  if (error) throw error; done();
}

export async function addFaq(formData: FormData) {
  if (isDemoMode) return;
  const { supabase, id } = await tenantId();
  const { error } = await supabase.from("faqs").insert({ tenant_id: id, question: String(formData.get("question")), answer: String(formData.get("answer")) });
  if (error) throw error; done();
}

export async function addProduct(formData: FormData) {
  if (isDemoMode) return;
  const { supabase, id } = await tenantId();
  const price = Number(formData.get("price") || 0);
  const { error } = await supabase.from("products").insert({ tenant_id: id, name: String(formData.get("name")), description: String(formData.get("description") || ""), price, price_label: String(formData.get("price_label") || "") || null });
  if (error) throw error; done();
}

export async function addKnowledge(formData: FormData) {
  if (isDemoMode) return;
  const { supabase, id } = await tenantId();
  const { error } = await supabase.from("knowledge_entries").insert({ tenant_id: id, title: String(formData.get("title")), content: String(formData.get("content")) });
  if (error) throw error; done();
}

export async function deleteItem(table: "faqs" | "products" | "knowledge_entries", id: string) {
  if (isDemoMode) return;
  const { supabase } = await tenantId();
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw error; done();
}

export async function signOut() {
  if (!isDemoMode) { const supabase = await createClient(); await supabase.auth.signOut(); }
  redirect("/");
}
