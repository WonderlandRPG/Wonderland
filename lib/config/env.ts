export function getSupabasePublicEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "",
  };
}

export function isSupabaseConfigured() {
  const { url, anonKey } = getSupabasePublicEnv();
  return Boolean(url && anonKey);
}
