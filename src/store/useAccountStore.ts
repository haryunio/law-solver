import { create } from "zustand";
import {
  getAccount,
  getPremiumErrorMessage,
  getCurrentSession,
  isPremiumBackendConfigured,
  listMarketplaceProducts,
  onAuthStateChange,
  purchaseProduct,
  redeemPromotionCode,
  signIn,
  signOut,
  signUp,
  type AccountData,
  type MarketplaceProduct,
  type PremiumEntitlement,
  type PremiumPurchase,
} from "../lib/premiumApi";

interface AccountStore {
  configured: boolean;
  initialized: boolean;
  isLoading: boolean;
  isSignedIn: boolean;
  displayName: string;
  email: string;
  entitlements: PremiumEntitlement[];
  isPremiumActive: boolean;
  packageIds: string[];
  purchases: PremiumPurchase[];
  marketplaceProducts: MarketplaceProduct[];
  notice: string | null;
  error: string | null;
  purchasingCode: string | null;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  purchase: (productCode: string) => Promise<void>;
  redeemPromotion: (productCode: string, promotionCode: string) => Promise<void>;
  refreshAccount: () => Promise<void>;
  refreshMarketplace: () => Promise<void>;
  clearFeedback: () => void;
}

const signedOutState = {
  isSignedIn: false,
  displayName: "학습자",
  email: "",
  entitlements: [] as PremiumEntitlement[],
  isPremiumActive: false,
  packageIds: [] as string[],
  purchases: [] as PremiumPurchase[],
};

const accountState = (account: AccountData) => {
  const active = account.entitlements.filter((entitlement) => entitlement.status === "active");
  return {
    isSignedIn: true,
    displayName: account.profile?.display_name || "학습자",
    email: account.email ?? "",
    entitlements: account.entitlements,
    isPremiumActive: active.some((entitlement) => entitlement.kind === "premium"),
    packageIds: active
      .filter((entitlement) => entitlement.kind === "course_pass" && entitlement.product_code)
      .map((entitlement) => entitlement.product_code as string),
    purchases: account.purchases ?? [],
  };
};

let unsubscribeAuth: (() => void) | null = null;
let initialization: Promise<void> | null = null;

export const useAccountStore = create<AccountStore>((set, get) => ({
  configured: isPremiumBackendConfigured,
  initialized: false,
  isLoading: false,
  ...signedOutState,
  notice: null,
  error: null,
  purchasingCode: null,
  marketplaceProducts: [],

  initialize: async () => {
    if (get().initialized) return;
    if (initialization) return initialization;
    initialization = (async () => {
      if (!isPremiumBackendConfigured) {
        set({ initialized: true });
        return;
      }
      set({ isLoading: true, error: null });
      try {
        const session = await getCurrentSession();
        const marketplaceProducts = await listMarketplaceProducts();
        set({ marketplaceProducts });
        if (session) {
          const account = await getAccount();
          set(accountState(account));
        } else {
          set(signedOutState);
        }
        if (!unsubscribeAuth) {
          unsubscribeAuth = onAuthStateChange((_event, nextSession) => {
            if (!nextSession) {
              set({ ...signedOutState, isLoading: false });
              return;
            }
            void get().refreshAccount();
          });
        }
      } catch (error) {
        set({
          error: getPremiumErrorMessage(
            error,
            "계정 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
          ),
        });
      } finally {
        set({ initialized: true, isLoading: false });
      }
    })();
    try {
      await initialization;
    } finally {
      initialization = null;
    }
  },

  refreshAccount: async () => {
    if (!isPremiumBackendConfigured) return;
    set({ isLoading: true, error: null });
    try {
      const session = await getCurrentSession();
      if (!session) {
        set(signedOutState);
        return;
      }
      set(accountState(await getAccount()));
    } catch (error) {
      set({
        error: getPremiumErrorMessage(
          error,
          "계정 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
        ),
      });
    } finally {
      set({ isLoading: false });
    }
  },

  refreshMarketplace: async () => {
    if (!isPremiumBackendConfigured) return;
    try {
      set({ marketplaceProducts: await listMarketplaceProducts() });
    } catch (error) {
      set({
        error: getPremiumErrorMessage(
          error,
          "판매 중인 상품을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
        ),
      });
    }
  },

  signIn: async (email, password) => {
    set({ isLoading: true, error: null, notice: null });
    try {
      await signIn(email, password);
      set(accountState(await getAccount()));
      set({ notice: "로그인했습니다." });
    } catch (error) {
      set({ error: getPremiumErrorMessage(error, "로그인하지 못했습니다. 다시 시도해 주세요.") });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  signUp: async (email, password, displayName) => {
    set({ isLoading: true, error: null, notice: null });
    try {
      const data = await signUp(email, password, displayName);
      if (data.session) {
        set(accountState(await getAccount()));
        set({ notice: "회원가입과 로그인을 완료했습니다." });
      } else {
        set({ notice: "확인 메일을 보냈습니다. 로컬 테스트 메일함에서 인증 링크를 열어 주세요." });
      }
    } catch (error) {
      set({
        error: getPremiumErrorMessage(
          error,
          "회원가입을 완료하지 못했습니다. 입력한 내용을 확인한 뒤 다시 시도해 주세요.",
        ),
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null, notice: null });
    try {
      await signOut();
      set({ ...signedOutState, notice: "로그아웃했습니다." });
    } catch (error) {
      set({
        error: getPremiumErrorMessage(
          error,
          "로그아웃하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        ),
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  purchase: async (productCode) => {
    set({ purchasingCode: productCode, error: null, notice: null });
    try {
      const extendsPremium = get().isPremiumActive && get().marketplaceProducts.some(
        (product) => product.code === productCode && product.kind === "premium",
      );
      await purchaseProduct(productCode);
      set(accountState(await getAccount()));
      set({ notice: extendsPremium ? "Premium 만료일 뒤로 이용 기간을 추가했습니다." : "결제를 승인하고 이용권을 발급했습니다." });
    } catch (error) {
      set({
        error: getPremiumErrorMessage(
          error,
          "결제를 완료하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        ),
      });
      throw error;
    } finally {
      set({ purchasingCode: null });
    }
  },

  redeemPromotion: async (productCode, promotionCode) => {
    set({ purchasingCode: productCode, error: null, notice: null });
    try {
      const extendsPremium = get().isPremiumActive && get().marketplaceProducts.some(
        (product) => product.code === productCode && product.kind === "premium",
      );
      await redeemPromotionCode(productCode, promotionCode);
      set(accountState(await getAccount()));
      set({ notice: extendsPremium ? "프로모션 코드가 적용되어 Premium 기간을 연장했습니다." : "프로모션 코드가 적용되어 이용권을 발급했습니다." });
    } catch (error) {
      set({
        error: getPremiumErrorMessage(
          error,
          "프로모션 코드를 적용하지 못했습니다. 입력한 코드를 확인해 주세요.",
        ),
      });
      throw error;
    } finally {
      set({ purchasingCode: null });
    }
  },

  clearFeedback: () => set({ error: null, notice: null }),
}));
