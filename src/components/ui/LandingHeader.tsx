import { Link } from "react-router-dom";
import { useSettingsStore } from "../../store/useSettingsStore";
import { BrandMark } from "./BrandMark";

interface LandingHeaderProps {
  activePage?: "home" | "mini-apps";
  onOpenCsvGuide?: () => void;
}

export function LandingHeader({ activePage = "home", onOpenCsvGuide }: LandingHeaderProps) {
  const { darkMode, toggleDarkMode } = useSettingsStore();
  const sectionPrefix = activePage === "home" ? "" : "/";

  return (
    <header className="landing-nav-wrap">
      <nav className="landing-container flex h-[72px] items-center justify-between" aria-label="주요 메뉴">
        <Link to="/" className="group flex items-center gap-2.5" aria-label="Law Solver 홈">
          <BrandMark className="landing-logo-mark" />
          <span className="text-[17px] font-semibold tracking-[-0.015em]">Law Solver</span>
        </Link>

        <div className="hidden items-center gap-7 text-sm font-medium text-stone-600 md:flex dark:text-stone-300">
          <a className="landing-nav-link" href={`${sectionPrefix}#how-it-works`}>사용 방법</a>
          <a className="landing-nav-link" href={`${sectionPrefix}#features`}>주요 기능</a>
          <Link
            className={`landing-nav-link ${activePage === "mini-apps" ? "text-red-600 dark:text-red-400" : ""}`}
            to="/apps"
            aria-current={activePage === "mini-apps" ? "page" : undefined}
          >
            미니 앱
          </Link>
          {onOpenCsvGuide ? (
            <button className="landing-nav-link" type="button" onClick={onOpenCsvGuide}>CSV 가이드</button>
          ) : (
            <Link className="landing-nav-link" to="/?guide=csv">CSV 가이드</Link>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleDarkMode}
            className="landing-theme-button"
            aria-label={darkMode ? "라이트 모드로 전환" : "다크 모드로 전환"}
          >
            <span aria-hidden="true">{darkMode ? "☀" : "☾"}</span>
          </button>
          <Link to="/home" className="landing-nav-cta">
            시작하기 <span aria-hidden="true">→</span>
          </Link>
        </div>
      </nav>
    </header>
  );
}
