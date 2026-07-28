import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAccount: vi.fn(),
  getCurrentSession: vi.fn(),
  listMarketplaceProducts: vi.fn(),
  onAuthStateChange: vi.fn(),
}));

vi.mock("../lib/premiumApi", () => ({
  getAccount: mocks.getAccount,
  getPremiumErrorMessage: () => "계정 정보를 불러오지 못했습니다.",
  getCurrentSession: mocks.getCurrentSession,
  isPremiumBackendConfigured: true,
  listMarketplaceProducts: mocks.listMarketplaceProducts,
  onAuthStateChange: mocks.onAuthStateChange,
  purchaseProduct: vi.fn(),
  redeemPromotionCode: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  signUp: vi.fn(),
}));

afterEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe("account session recovery", () => {
  it("keeps the Auth subscription active when the initial account request fails", async () => {
    let authCallback:
      | ((event: AuthChangeEvent, session: Session | null) => void)
      | undefined;
    mocks.onAuthStateChange.mockImplementation((callback) => {
      authCallback = callback;
      return vi.fn();
    });
    mocks.getCurrentSession.mockResolvedValue({ access_token: "token" });
    mocks.listMarketplaceProducts.mockResolvedValue([]);
    mocks.getAccount
      .mockRejectedValueOnce(new Error("initial request failed"))
      .mockResolvedValueOnce({
        userId: "00000000-0000-4000-8000-000000000001",
        email: "learner@example.com",
        profile: {
          display_name: "학습자",
          created_at: "2026-07-28T00:00:00.000Z",
          updated_at: "2026-07-28T00:00:00.000Z",
        },
        entitlement: null,
        entitlements: [],
        purchases: [],
      });

    const { useAccountStore } = await import("./useAccountStore");
    await useAccountStore.getState().initialize();

    expect(mocks.onAuthStateChange).toHaveBeenCalledTimes(1);
    expect(useAccountStore.getState().initialized).toBe(true);
    expect(useAccountStore.getState().isSignedIn).toBe(false);

    authCallback?.("TOKEN_REFRESHED", { access_token: "fresh-token" } as Session);

    await vi.waitFor(() => {
      expect(useAccountStore.getState().isSignedIn).toBe(true);
    });
    expect(useAccountStore.getState().email).toBe("learner@example.com");
  });
});
