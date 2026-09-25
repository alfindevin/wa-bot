import { createBrowserClient } from "@supabase/ssr";
import { getMissingSupabasePublicEnv, supabasePublicKey, supabaseUrl } from "@/lib/env";

export function createClient() {
  if (!supabaseUrl || !supabasePublicKey) {
    throw new Error(`Supabase belum dikonfigurasi. Env yang belum terbaca: ${getMissingSupabasePublicEnv()}.`);
  }
  return createBrowserClient(supabaseUrl, supabasePublicKey);
}
