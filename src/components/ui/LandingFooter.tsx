import { BrandMark } from "./BrandMark";
import { PrivacyPolicyLink } from "./PrivacyPolicyLink";

export function LandingFooter() {
  return (
    <footer className="border-t border-stone-200 bg-white/60 dark:border-stone-800 dark:bg-stone-950/50">
      <div className="landing-container flex flex-col gap-4 py-7 text-xs text-stone-500 lg:flex-row lg:items-center lg:justify-between dark:text-stone-500">
        <div className="flex items-center gap-2 font-semibold text-stone-700 dark:text-stone-300">
          <BrandMark size="small" className="landing-logo-mark is-small" /> Law Solver
        </div>
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-end lg:gap-5 lg:text-right">
          <p>제작자: 경북대 로스쿨 17기 신하륜 - <a className="transition hover:text-red-600" href="mailto:haryun@knu.ac.kr">haryun@knu.ac.kr</a></p>
          <div className="flex items-center gap-2 lg:border-l lg:border-stone-300 lg:pl-5 lg:justify-end dark:lg:border-stone-700">
            <span>CC BY-NC-ND ⓒ 2026 Haryun</span>
            <div className="border-l border-stone-300 pl-2 dark:border-stone-700">
              <PrivacyPolicyLink />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
