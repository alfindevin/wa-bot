export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const supabasePublicKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isDemoMode =
  process.env.NEXT_PUBLIC_DEMO_MODE === "true" ||
  !supabaseUrl ||
  !supabasePublicKey;

export const hasSupabaseServerEnv = Boolean(
  supabaseUrl && process.env.SUPABASE_SECRET_KEY,
);

export function getMissingSupabasePublicEnv() {
  return [
    !supabaseUrl ? "NEXT_PUBLIC_SUPABASE_URL" : null,
    !supabasePublicKey ? "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY atau NEXT_PUBLIC_SUPABASE_ANON_KEY" : null,
  ].filter(Boolean).join(", ");
}
