import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProblemSortDirection, ProblemSortKey } from "../lib/problemSort";
import {
  DEFAULT_PRECEDENT_LINK_PROVIDER,
  normalizePrecedentLinkProvider,
  type PrecedentLinkProvider,
} from "../lib/precedentLinks";

export type FontFamily = "pretendard" | "noto-sans-kr" | "nanum-gothic" | "nanum-myeongjo";

interface SettingsStore {
  darkMode: boolean;
  fontFamily: FontFamily;
  problemSortKey: ProblemSortKey;
  problemSortDirection: ProblemSortDirection;
  precedentLinkProvider: PrecedentLinkProvider;
  toggleDarkMode: () => void;
  setFontFamily: (font: FontFamily) => void;
  setProblemSortKey: (key: ProblemSortKey) => void;
  setProblemSortDirection: (direction: ProblemSortDirection) => void;
  setPrecedentLinkProvider: (provider: PrecedentLinkProvider) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      darkMode: false,
      fontFamily: "pretendard",
      problemSortKey: "created_at",
      problemSortDirection: "desc",
      precedentLinkProvider: DEFAULT_PRECEDENT_LINK_PROVIDER,
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
      setFontFamily: (font) => set({ fontFamily: font }),
      setProblemSortKey: (key) => set({ problemSortKey: key }),
      setProblemSortDirection: (direction) => set({ problemSortDirection: direction }),
      setPrecedentLinkProvider: (provider) => set({ precedentLinkProvider: normalizePrecedentLinkProvider(provider) }),
    }),
    {
      name: "law-solver-settings",
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<SettingsStore>;
        return {
          ...current,
          ...saved,
          problemSortKey: saved.problemSortKey === "title" ? "title" : "created_at",
          problemSortDirection: saved.problemSortDirection === "asc" ? "asc" : "desc",
          precedentLinkProvider: normalizePrecedentLinkProvider(saved.precedentLinkProvider),
        };
      },
    }
  )
);
