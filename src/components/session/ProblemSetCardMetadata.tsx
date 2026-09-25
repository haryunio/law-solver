import type { TestType } from "../../types/test";

const typeLabel: Record<TestType, string> = { OX: "OX", "5-choice": "5지선다", short: "단답형" };
const typeStyle: Record<TestType, string> = {
  OX: "border-red-100 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400",
  "5-choice": "border-orange-100 bg-orange-50 text-orange-700 dark:border-orange-900/50 dark:bg-orange-950/30 dark:text-orange-400",
  short: "border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400",
};

interface ProblemSetCardMetadataProps {
  type: TestType;
  questionCount: number;
  sessionCount: number;
  inProgressCount: number;
}

export function ProblemSetCardMetadata({ type, questionCount, sessionCount, inProgressCount }: ProblemSetCardMetadataProps) {
  return (
    <dl className="grid grid-cols-3 gap-2 text-xs">
      <div className="app-neutral-box app-radius-inset flex h-11 min-w-0 flex-wrap content-center items-center justify-between gap-x-1 rounded-lg px-2">
        <dt className="shrink-0 text-[11px] text-stone-500 dark:text-stone-400">유형</dt>
        <dd className={`app-radius-tag ml-auto inline-flex h-6 items-center whitespace-nowrap rounded-full border px-2 text-[11px] font-semibold leading-none ${typeStyle[type]}`}>
          {typeLabel[type]}
        </dd>
      </div>
      <div className="app-neutral-box app-radius-inset flex h-11 min-w-0 flex-wrap content-center items-center justify-between gap-x-1 rounded-lg px-2">
        <dt className="shrink-0 text-[11px] text-stone-500 dark:text-stone-400">문항</dt>
        <dd className="ml-auto whitespace-nowrap font-semibold tabular-nums text-stone-900 dark:text-stone-100">{questionCount}</dd>
      </div>
      <div className="app-neutral-box app-radius-inset flex h-11 min-w-0 flex-wrap content-center items-center justify-between gap-x-1 rounded-lg px-2 leading-4 tabular-nums">
        <dt className="shrink-0 text-[11px] text-stone-500 dark:text-stone-400">세션</dt>
        <dd className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-x-1 text-right max-sm:contents">
          <span className="font-semibold text-stone-900 max-sm:ml-auto dark:text-stone-100">{sessionCount}</span>
          <span className="whitespace-nowrap text-[11px] font-normal text-stone-500 max-sm:basis-full dark:text-stone-400">({inProgressCount} 풀이 중)</span>
        </dd>
      </div>
    </dl>
  );
}
