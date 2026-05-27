import { create } from "zustand";
import { persist } from "zustand/middleware";

export type FontFamily = "pretendard" | "nanum-gothic" | "nanum-myeongjo";

interface SettingsStore {
  darkMode: boolean;
  fontFamily: FontFamily;
  toggleDarkMode: () => void;
  setFontFamily: (font: FontFamily) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      darkMode: false,
      fontFamily: "pretendard",
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
      setFontFamily: (font) => set({ fontFamily: font }),
    }),
    {
      name: "law-solver-settings",
    }
  )
);
