import type { Session } from "@supabase/supabase-js";
import { afterEach, describe, expect, it, vi } from "vitest";

const session = (accessToken: string, expiresAt: number): Session => ({
  access_token: accessToken,
  refresh_token: `${accessToken}-refresh`,
  expires_in: 3_600,
  expires_at: expiresAt,
  token_type: "bearer",
  user: {
    id: "00000000-0000-4000-8000-000000000001",
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: "2026-07-28T00:00:00.000Z",
  },
});

async function loadConfiguredApi() {
  vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "publishable-test-key");
  vi.resetModules();
  return import("./premiumApi");
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("Premium session recovery", () => {
  it("refreshes a nearly expired session before calling an Edge Function", async () => {
    const api = await loadConfiguredApi();
    const staleSession = session("stale-token", Math.floor(Date.now() / 1_000) + 10);
    const freshSession = session("fresh-token", Math.floor(Date.now() / 1_000) + 3_600);
    vi.spyOn(api.premiumSupabase!.auth, "getSession").mockResolvedValue({
      data: { session: staleSession },
      error: null,
    });
    const refresh = vi.spyOn(api.premiumSupabase!.auth, "refreshSession").mockResolvedValue({
      data: { session: freshSession, user: freshSession.user },
      error: null,
    });
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(api.listPremiumCourses()).resolves.toEqual([]);

    expect(refresh).toHaveBeenCalledTimes(1);
    const headers = fetchMock.mock.calls[0]?.[1]?.headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer fresh-token");
  });

  it("refreshes and retries once when a resumed tab receives a 401", async () => {
    const api = await loadConfiguredApi();
    const storedSession = session("stored-token", Math.floor(Date.now() / 1_000) + 3_600);
    const refreshedSession = session("refreshed-token", Math.floor(Date.now() / 1_000) + 3_600);
    vi.spyOn(api.premiumSupabase!.auth, "getSession").mockResolvedValue({
      data: { session: storedSession },
      error: null,
    });
    const refresh = vi.spyOn(api.premiumSupabase!.auth, "refreshSession").mockResolvedValue({
      data: { session: refreshedSession, user: refreshedSession.user },
      error: null,
    });
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ error: { code: "UNAUTHORIZED", message: "expired" } }),
          { status: 401, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(api.listPremiumCourses()).resolves.toEqual([]);

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const firstHeaders = fetchMock.mock.calls[0]?.[1]?.headers as Headers;
    const retryHeaders = fetchMock.mock.calls[1]?.[1]?.headers as Headers;
    expect(firstHeaders.get("Authorization")).toBe("Bearer stored-token");
    expect(retryHeaders.get("Authorization")).toBe("Bearer refreshed-token");
  });
});
