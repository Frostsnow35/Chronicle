"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../database.types";

type BrowserClient = SupabaseClient<Database, "public", any>;

let singleton: BrowserClient | undefined;

export function createClient(): BrowserClient {
  if (!singleton) {
    singleton = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ) as unknown as BrowserClient;
  }
  return singleton;
}
