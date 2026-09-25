import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useSettingsStore } from "../../store/useSettingsStore";
import { BrandMark } from "./BrandMark";
import { ReturnLinkLabel } from "./ReturnLinkLabel";
import { ThemeToggleButton } from "./ThemeToggleButton";

interface MiniAppHeaderProps {
  title: string;
  titleTo?: string;
  label: string;
  children?: ReactNode;
}

export function MiniAppHeader(props: MiniAppHeaderProps) {
  const { darkMode, toggleDarkMode } = useSettingsStore();
  return <MiniAppHeaderView {...props} darkMode={darkMode} onToggleTheme={toggleDarkMode} />;
}

/** Pure view also used by the gallery without changing saved settings. */
export function MiniAppHeaderView({ title, titleTo, label, children, darkMode, onToggleTheme }: MiniAppHeaderProps & {
  darkMode: boolean;
  onToggleTheme: () => void;
}) {
  const titleClass = "min-w-0 truncate text-sm font-bold tracking-tight sm:text-base";
  return (
    <header className="mini-app-nav app-topbar sticky top-0 z-50 shrink-0 border-b">
      <nav aria-label={label} className="landing-container flex flex-col gap-2 py-3 sm:min-h-[72px] sm:flex-row sm:items-center sm:gap-3">
        <div className="flex min-w-0 items-center gap-2.5 sm:flex-1">
          <Link to="/" className="flex shrink-0 items-center gap-2" aria-label="Law Solver 홈">
            <BrandMark size="small" />
            <span className="whitespace-nowrap text-[15px] font-semibold tracking-[-0.015em]">Law Solver</span>
          </Link>
          <span className="h-5 w-px shrink-0 bg-stone-300 dark:bg-stone-700" aria-hidden="true" />
          {titleTo ? <Link to={titleTo} title={title} className={titleClass} aria-label={`${title} 홈`}>{title}</Link> : <span title={title} className={titleClass}>{title}</span>}
        </div>
        <div className="flex shrink-0 items-center justify-end gap-2">
          {children}
          <ThemeToggleButton darkMode={darkMode} onToggle={onToggleTheme} className="app-button-secondary flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg" />
          <Link to="/apps" className="app-button-secondary flex h-9 shrink-0 items-center rounded-xl px-3 text-xs font-bold sm:text-sm"><ReturnLinkLabel>나가기</ReturnLinkLabel></Link>
        </div>
      </nav>
    </header>
  );
}
