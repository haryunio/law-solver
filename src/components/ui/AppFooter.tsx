import { BrandMark } from "./BrandMark";

export function AppFooter() {
  return (
    <footer className="app-footer mt-12 border-t pt-6 text-center text-sm">
      <div className="flex items-center justify-center gap-2 font-semibold text-stone-700 dark:text-stone-300">
        <BrandMark size="small" />
        <span>Law Solver</span>
      </div>
      <p className="mt-3">제작자: 경북대 로스쿨 17기 신하륜</p>
      <p className="mt-1">
        <a className="font-medium text-red-600 underline underline-offset-4 dark:text-red-400" href="mailto:haryun@knu.ac.kr">
          haryun@knu.ac.kr
        </a>
      </p>
      <p className="mt-1">CC BY-NC-ND ⓒ 2026 Haryun</p>
    </footer>
  );
}
