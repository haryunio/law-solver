import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { premiumSupabase, requireClient } from "./client";
import { PremiumApiError } from "./errors";

const SESSION_REFRESH_LEEWAY_SECONDS = 60;

let sessionRefresh: Promise<Session> | null = null;

function shouldRefreshSession(session: Session): boolean {
  if (typeof session.expires_at !== "number") return false;
  return session.expires_at <= Math.floor(Date.now() / 1000) + SESSION_REFRESH_LEEWAY_SECONDS;
}

async function refreshCurrentSession(): Promise<Session> {
  if (sessionRefresh) return sessionRefresh;

  sessionRefresh = (async () => {
    const { data, error } = await requireClient().auth.refreshSession();
    if (error) {
      throw new PremiumApiError(error.message, "AUTH_SESSION_ERROR", error.status ?? 401);
    }
    if (!data.session) {
      throw new PremiumApiError("로그인이 필요합니다.", "AUTH_REQUIRED", 401);
    }
    return data.session;
  })();

  try {
    return await sessionRefresh;
  } finally {
    sessionRefresh = null;
  }
}

async function currentSession(): Promise<Session | null> {
  const { data, error } = await requireClient().auth.getSession();
  if (error) throw new PremiumApiError(error.message, "AUTH_SESSION_ERROR");
  if (!data.session) return null;
  return shouldRefreshSession(data.session) ? refreshCurrentSession() : data.session;
}

export async function accessToken(forceRefresh = false) {
  const session = forceRefresh ? await refreshCurrentSession() : await currentSession();
  if (!session) throw new PremiumApiError("로그인이 필요합니다.", "AUTH_REQUIRED", 401);
  return session.access_token;
}

export async function signUp(email: string, password: string, displayName: string) {
  const { data, error } = await requireClient().auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName.trim() || "학습자" } },
  });
  if (error) throw new PremiumApiError(error.message, "SIGNUP_FAILED");
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await requireClient().auth.signInWithPassword({ email, password });
  if (error) throw new PremiumApiError(error.message, "LOGIN_FAILED");
  return data;
}

export async function signOut() {
  const { error } = await requireClient().auth.signOut();
  if (error) throw new PremiumApiError(error.message, "LOGOUT_FAILED");
}

export async function getCurrentSession() {
  if (!premiumSupabase) return null;
  return currentSession();
}

export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void,
) {
  if (!premiumSupabase) return () => undefined;
  const { data } = premiumSupabase.auth.onAuthStateChange(callback);
  return () => data.subscription.unsubscribe();
}

