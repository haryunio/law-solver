import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProblemSortDirection, ProblemSortKey } from "../lib/problemSort";

export type FontFamily = "pretendard" | "nanum-gothic" | "nanum-myeongjo";

interface SettingsStore {
  darkMode: boolean;
  fontFamily: FontFamily;
  problemSortKey: ProblemSortKey;
  problemSortDirection: ProblemSortDirection;
  toggleDarkMode: () => void;
  setFontFamily: (font: FontFamily) => void;
  setProblemSortKey: (key: ProblemSortKey) => void;
  setProblemSortDirection: (direction: ProblemSortDirection) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      darkMode: false,
      fontFamily: "pretendard",
      problemSortKey: "created_at",
      problemSortDirection: "desc",
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
      setFontFamily: (font) => set({ fontFamily: font }),
      setProblemSortKey: (key) => set({ problemSortKey: key }),
      setProblemSortDirection: (direction) => set({ problemSortDirection: direction }),
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
        };
      },
    }
  )
);
