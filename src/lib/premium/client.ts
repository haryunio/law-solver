import { createClient } from "@supabase/supabase-js";
import { PremiumApiError } from "./errors";

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? "";
export const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ?? "";

export const isPremiumBackendConfigured = Boolean(supabaseUrl && publishableKey);
export const premiumSupabase = isPremiumBackendConfigured
  ? createClient(supabaseUrl, publishableKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;

export function requireClient() {
  if (!premiumSupabase) {
    throw new PremiumApiError(
      "로컬 Premium 서버 설정이 없습니다. VITE_SUPABASE_URL과 VITE_SUPABASE_PUBLISHABLE_KEY를 확인해 주세요.",
      "PREMIUM_NOT_CONFIGURED",
    );
  }
  return premiumSupabase;
}

