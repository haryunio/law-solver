import { useEffect } from "react";
import { useSettingsStore } from "../store/useSettingsStore";
import { useAccountStore } from "../store/useAccountStore";

export function ThemeWatcher() {
  const darkMode = useSettingsStore((state) => state.darkMode);
  const fontFamily = useSettingsStore((state) => state.fontFamily);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  useEffect(() => {
    const fonts = ["font-pretendard", "font-nanum-gothic", "font-nanum-myeongjo"];
    document.documentElement.classList.remove(...fonts);
    document.documentElement.classList.add(`font-${fontFamily}`);
  }, [fontFamily]);

  return null;
}

export function AccountWatcher() {
  const initialize = useAccountStore((state) => state.initialize);
  const refreshAccount = useAccountStore((state) => state.refreshAccount);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    let lastRecoveryAt = 0;
    const recoverVisibleSession = () => {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - lastRecoveryAt < 2_000) return;
      lastRecoveryAt = now;
      void refreshAccount({ silent: true });
    };

    document.addEventListener("visibilitychange", recoverVisibleSession);
    window.addEventListener("focus", recoverVisibleSession);
    window.addEventListener("online", recoverVisibleSession);
    return () => {
      document.removeEventListener("visibilitychange", recoverVisibleSession);
      window.removeEventListener("focus", recoverVisibleSession);
      window.removeEventListener("online", recoverVisibleSession);
    };
  }, [refreshAccount]);

  return null;
}

