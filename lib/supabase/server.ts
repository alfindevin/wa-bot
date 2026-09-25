import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getMissingSupabasePublicEnv, supabasePublicKey, supabaseUrl } from "@/lib/env";

export async function createClient() {
  const cookieStore = await cookies();
  if (!supabaseUrl || !supabasePublicKey) {
    throw new Error(`Supabase belum dikonfigurasi. Env yang belum terbaca: ${getMissingSupabasePublicEnv()}.`);
  }

  return createServerClient(supabaseUrl, supabasePublicKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // A Server Component cannot set cookies; proxy.ts refreshes them.
        }
      },
    },
  });
}
