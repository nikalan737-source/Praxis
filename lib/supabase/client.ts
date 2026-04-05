"use client";

import { createBrowserClient } from "@supabase/ssr";

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase auth is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local and restart the dev server."
    );
  }
  return { url, key };
}

let client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  const { url, key } = getSupabaseConfig();
  if (client) return client;
  client = createBrowserClient(url, key);
  return client;
}
