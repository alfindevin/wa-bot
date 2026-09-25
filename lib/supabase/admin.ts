import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "@/lib/env";

export function createAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL atau SUPABASE_SECRET_KEY belum dikonfigurasi.");
  return createClient(supabaseUrl, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
