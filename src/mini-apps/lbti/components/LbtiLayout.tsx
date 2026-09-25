import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { MiniAppHeader } from "../../../components/ui/MiniAppHeader";
import { LandingFooter } from "../../../components/ui/LandingFooter";

export function LbtiLayout({ children }: { children: ReactNode }) {
  const navClass = ({ isActive }: { isActive: boolean }) =>
    [
      "rounded-lg px-2.5 py-2 text-xs font-semibold transition sm:px-3 sm:text-sm",
      isActive
        ? "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300"
        : "text-stone-500 hover:text-red-600 dark:text-stone-400 dark:hover:text-red-400",
    ].join(" ");

  return (
    <div className="app-page flex min-h-screen flex-col">
      <MiniAppHeader title="LBTI" titleTo="/apps/lbti" label="LBTI 메뉴">
        <div className="hidden items-center gap-0.5 sm:flex sm:gap-1">
          <NavLink to="/apps/lbti/test" className={navClass}>LBTI 테스트</NavLink>
          <NavLink to="/apps/lbti/types" className={navClass}>LBTI 유형 보기</NavLink>
        </div>
      </MiniAppHeader>

      <div className="flex-1">{children}</div>
      <LandingFooter />
    </div>
  );
}
