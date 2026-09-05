"use client";
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../database.types";
import { supabaseUrl, supabaseAnonKey } from "./env";

type BrowserClient = SupabaseClient<Database, "public", any>;
let singleton: BrowserClient | undefined;

export function createClient(): BrowserClient {
  if (!singleton) {
    singleton = createBrowserClient<Database>(
      supabaseUrl(),
      supabaseAnonKey()
    ) as unknown as BrowserClient;
  }
  return singleton;
}
