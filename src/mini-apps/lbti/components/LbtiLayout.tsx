import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { BrandMark } from "../../../components/ui/BrandMark";
import { LandingFooter } from "../../../components/ui/LandingFooter";
import { useSettingsStore } from "../../../store/useSettingsStore";

export function LbtiLayout({ children }: { children: ReactNode }) {
  const { darkMode, toggleDarkMode } = useSettingsStore();
  const navClass = ({ isActive }: { isActive: boolean }) =>
    [
      "rounded-lg px-2.5 py-2 text-xs font-semibold transition sm:px-3 sm:text-sm",
      isActive
        ? "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300"
        : "text-stone-500 hover:text-red-600 dark:text-stone-400 dark:hover:text-red-400",
    ].join(" ");

  return (
    <div className="app-page flex min-h-screen flex-col">
      <header className="app-topbar sticky top-0 z-40 border-b">
        <nav className="mx-auto flex h-[68px] w-full max-w-6xl items-center gap-3 px-3 sm:px-6 lg:px-8" aria-label="LBTI 메뉴">
          <Link
            to="/apps"
            className="hidden shrink-0 text-sm font-semibold text-stone-500 transition hover:text-red-600 sm:inline-flex dark:text-stone-400 dark:hover:text-red-400"
          >
            ← 미니 앱
          </Link>
          <span className="hidden h-5 w-px bg-stone-200 sm:block dark:bg-stone-700" />
          <Link to="/apps/lbti" className="flex min-w-0 items-center gap-2" aria-label="LBTI 홈">
            <BrandMark size="small" />
            <span className="truncate text-sm font-bold tracking-tight sm:text-base">LBTI</span>
          </Link>

          <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
            <NavLink to="/apps/lbti/test" className={navClass}>테스트</NavLink>
            <NavLink to="/apps/lbti/types" className={navClass}>모든 유형</NavLink>
            <button
              type="button"
              onClick={toggleDarkMode}
              className="app-icon-button ml-1 flex h-9 w-9 items-center justify-center rounded-lg border text-base text-stone-600 dark:text-stone-300"
              aria-label={darkMode ? "라이트 모드로 전환" : "다크 모드로 전환"}
            >
              <span aria-hidden="true">{darkMode ? "☀" : "☾"}</span>
            </button>
          </div>
        </nav>
      </header>

      <div className="flex-1">{children}</div>
      <LandingFooter />
    </div>
  );
}
