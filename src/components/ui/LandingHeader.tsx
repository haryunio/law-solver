import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSettingsStore } from "../../store/useSettingsStore";
import { BrandMark } from "./BrandMark";
import { ThemeToggleButton } from "./ThemeToggleButton";

interface LandingHeaderProps {
  activePage?: "home" | "mini-apps";
  onOpenCsvGuide?: () => void;
}

export function LandingHeader({ activePage = "home", onOpenCsvGuide }: LandingHeaderProps) {
  const { darkMode, toggleDarkMode } = useSettingsStore();
  const [floating, setFloating] = useState(false);

  useEffect(() => {
    // Separate thresholds avoid flickering when scrolling near the boundary.
    const update = () => setFloating((current) => current ? window.scrollY > 16 : window.scrollY > 48);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return <LandingHeaderView activePage={activePage} onOpenCsvGuide={onOpenCsvGuide} darkMode={darkMode} onToggleTheme={toggleDarkMode} floating={floating} />;
}

/** The gallery controls appearance locally without changing saved settings. */
export function LandingHeaderView({ activePage = "home", onOpenCsvGuide, darkMode, onToggleTheme, floating = false, preview = false }: LandingHeaderProps & {
  darkMode: boolean;
  onToggleTheme: () => void;
  floating?: boolean;
  preview?: boolean;
}) {
  const sectionPrefix = activePage === "home" ? "" : "/";
  return (
    <>
    {!preview ? <div className="landing-nav-placeholder" aria-hidden="true" /> : null}
    <header className="landing-nav-wrap" data-floating={floating} style={preview ? { position: "relative", zIndex: "auto", paddingTop: 0 } : undefined}>
      <div className="landing-nav-surface">
      <nav className="landing-container landing-nav-inner flex items-center justify-between gap-3" aria-label="주요 메뉴">
        <Link to="/" className="landing-nav-brand group flex shrink-0 items-center gap-2.5" aria-label="Law Solver 홈">
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

        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggleButton darkMode={darkMode} onToggle={onToggleTheme} />
          <Link to="/home" className="landing-nav-cta">
            시작하기 <span aria-hidden="true">→</span>
          </Link>
        </div>
      </nav>
      </div>
    </header>
    </>
  );
}
