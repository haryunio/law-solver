interface ReviewNavigationProps {
  index: number;
  total: number;
  wrongOnly?: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onOpenOmr: () => void;
}

export function ReviewNavigation({ index, total, wrongOnly = false, onPrevious, onNext, onOpenOmr }: ReviewNavigationProps) {
  const noun = wrongOnly ? "오답" : "문제";
  return (
    <nav aria-label="복습 문항 이동" className="app-study-divider grid shrink-0 grid-cols-[2fr_1fr_2fr] overflow-hidden border-t md:grid-cols-2">
      <button
        type="button"
        onClick={onPrevious}
        disabled={index === 0}
        className="app-study-navigation-secondary app-study-divider border-r px-4 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span className="mr-1 text-stone-400 dark:text-stone-500">‹</span>
        이전 {noun}
      </button>
      <button
        type="button"
        onClick={onOpenOmr}
        className="app-study-navigation-secondary app-study-divider border-r px-2 py-3 text-xs font-bold md:hidden"
      >
        OMR
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={index === total - 1}
        className="app-button-primary px-4 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40 md:border-l"
      >
        다음 {noun}
        <span className="ml-1 text-red-200">›</span>
      </button>
    </nav>
  );
}
