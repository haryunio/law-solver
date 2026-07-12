import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { BrandMark } from "../../../components/ui/BrandMark";
import { LandingFooter } from "../../../components/ui/LandingFooter";
import { ReturnLinkLabel } from "../../../components/ui/ReturnLinkLabel";
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
      <header className="landing-nav-wrap">
        <nav className="landing-container flex h-[72px] items-center gap-3" aria-label="LBTI 메뉴">
          <div className="flex min-w-0 items-center gap-2.5">
            <Link to="/" className="flex min-w-0 items-center gap-2.5" aria-label="Law Solver 홈">
              <BrandMark className="landing-logo-mark" />
              <span className="truncate text-[17px] font-semibold tracking-[-0.015em]">Law Solver</span>
            </Link>
            <span className="h-5 w-px shrink-0 bg-stone-300 dark:bg-stone-700" aria-hidden="true" />
            <Link to="/apps/lbti" className="shrink-0 text-sm font-bold tracking-tight sm:text-base" aria-label="LBTI 홈">
              LBTI
            </Link>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1">
            <div className="hidden items-center gap-0.5 sm:flex sm:gap-1">
              <NavLink to="/apps/lbti/test" className={navClass}>LBTI 테스트</NavLink>
              <NavLink to="/apps/lbti/types" className={navClass}>LBTI 유형 보기</NavLink>
            </div>
            <button
              type="button"
              onClick={toggleDarkMode}
              className="landing-theme-button ml-1"
              aria-label={darkMode ? "라이트 모드로 전환" : "다크 모드로 전환"}
            >
              <span aria-hidden="true">{darkMode ? "☀" : "☾"}</span>
            </button>
            <Link to="/apps" className="app-button-secondary ml-1 rounded-lg px-3 py-2 text-xs font-bold sm:px-4 sm:text-sm">
              <ReturnLinkLabel>나가기</ReturnLinkLabel>
            </Link>
          </div>
        </nav>
      </header>

      <div className="flex-1">{children}</div>
      <LandingFooter />
    </div>
  );
}
