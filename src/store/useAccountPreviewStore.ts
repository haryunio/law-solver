import { create } from "zustand";

interface AccountPreviewStore {
  isSignedIn: boolean;
  displayName: string;
  isPremiumActive: boolean;
  packageIds: string[];
  signIn: (displayName?: string) => void;
  logout: () => void;
  togglePremium: () => void;
  togglePackage: (packageId: string) => void;
}

export const useAccountPreviewStore = create<AccountPreviewStore>((set) => ({
  isSignedIn: false,
  displayName: "학습자",
  isPremiumActive: false,
  packageIds: [],
  signIn: (displayName) =>
    set({
      isSignedIn: true,
      displayName: displayName?.trim() || "학습자",
    }),
  logout: () =>
    set({
      isSignedIn: false,
      displayName: "학습자",
      isPremiumActive: false,
      packageIds: [],
    }),
  togglePremium: () =>
    set((state) => ({
      isPremiumActive: !state.isPremiumActive,
    })),
  togglePackage: (packageId) =>
    set((state) => ({
      packageIds: state.packageIds.includes(packageId)
        ? state.packageIds.filter((id) => id !== packageId)
        : [...state.packageIds, packageId],
    })),
}));
