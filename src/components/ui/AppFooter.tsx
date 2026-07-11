import { BrandMark } from "./BrandMark";
import { PrivacyPolicyLink } from "./PrivacyPolicyLink";

export function AppFooter() {
  return (
    <footer className="app-footer mt-12 border-t pt-6 text-center text-xs">
      <div className="flex items-center justify-center gap-2 font-semibold text-stone-700 dark:text-stone-300">
        <BrandMark size="small" />
        <span>Law Solver</span>
      </div>
      <div className="mt-3 flex flex-col items-center justify-center gap-1.5">
        <p>제작자: 경북대 로스쿨 17기 신하륜 {" - "}
          <a className="font-medium text-red-600 underline underline-offset-4 dark:text-red-400" href="mailto:haryun@knu.ac.kr">
            haryun@knu.ac.kr
          </a>
        </p>
        <div className="flex items-center gap-2">
          <span>CC BY-NC-ND ⓒ 2026 Haryun</span>
          <div className="border-l border-stone-300 pl-2 dark:border-stone-700">
            <PrivacyPolicyLink />
          </div>
        </div>
      </div>
    </footer>
  );
}
