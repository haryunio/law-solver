import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { SolveOrder } from "../../types/test";
import { formatElapsedTime } from "../../lib/time";
import { formatTimestamp, TimestampTag } from "../ui/TimestampTag";

interface SessionListItemProps {
  attemptNumber: number;
  title: string;
  modeLabel?: string;
  completed: boolean;
  orderMode: SolveOrder;
  createdAt: string;
  lastPlayedAt?: string | null;
  solvedQuestions: number;
  totalQuestions: number;
  elapsedSeconds: number;
  scorePercent: number | null;
  destination: string;
  destinationState?: unknown;
  actions?: ReactNode;
}

const orderLabels: Record<SolveOrder, string> = {
  number: "번호 순서",
  "chapter-random": "챕터별 랜덤",
  random: "전체 랜덤",
};
const tagClassName = "app-radius-tag inline-flex h-6 items-center rounded-full border px-2 text-[11px] font-medium leading-4";
const neutralTagClassName = `${tagClassName} border-stone-200 bg-stone-50 text-stone-600 dark:border-stone-700 dark:bg-stone-950/40 dark:text-stone-300`;

export function SessionListItem({
  attemptNumber, title, modeLabel, completed, orderMode, createdAt, lastPlayedAt,
  solvedQuestions, totalQuestions, elapsedSeconds, scorePercent, destination,
  destinationState, actions,
}: SessionListItemProps) {
  const timestampTitle = [
    `생성 ${formatTimestamp(createdAt)}`,
    lastPlayedAt === null ? "마지막 풀이 기록 없음" : lastPlayedAt ? `마지막 풀이 ${formatTimestamp(lastPlayedAt)}` : null,
  ].filter(Boolean).join(" / ");

  return (
    <article className="app-card app-problem-card app-radius-card relative rounded-xl border px-3 py-4 sm:px-4 lg:flex lg:items-end lg:gap-2">
      <div className="min-w-0 flex-1 lg:flex lg:items-end lg:gap-4">
        <div className="grid min-h-14 min-w-0 flex-1 grid-cols-[56px_minmax(0,1fr)] grid-rows-[1fr_auto] items-center gap-x-3 gap-y-2">
          <span className="app-radius-inset row-span-2 inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-sm font-semibold tabular-nums text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400 lg:self-end">
            {attemptNumber}회차
          </span>
          <h2 title={title} className={`min-w-0 self-end truncate text-sm font-semibold leading-8 text-stone-900 dark:text-stone-100 lg:leading-5 ${actions ? "pr-11 lg:pr-0" : ""}`}>{title}</h2>
          <div className="col-start-2 flex min-w-0 flex-wrap items-center gap-1 self-end">
            {modeLabel ? <span className={neutralTagClassName}>{modeLabel}</span> : null}
            <span className={`${tagClassName} ${completed
              ? "border-blue-100 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-400"
              : "border-red-100 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400"}`}>
              {completed ? "채점 완료" : "풀이 중"}
            </span>
            <span className={neutralTagClassName}>{orderLabels[orderMode]}</span>
            <TimestampTag label={lastPlayedAt ? "마지막 풀이" : "생성"} value={lastPlayedAt || createdAt} title={timestampTitle} hideYearOnSmallScreens />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 lg:mt-0 lg:shrink-0">
          <dl className="grid min-w-0 flex-1 grid-cols-3 gap-1.5 lg:w-[270px]">
            {[
              ["진행", `${solvedQuestions}/${totalQuestions}`],
              ["시간", formatElapsedTime(elapsedSeconds)],
              ["점수", completed ? `${scorePercent ?? 0}%` : "미채점"],
            ].map(([label, value]) => (
              <div key={label} className="app-neutral-box app-radius-inset flex h-14 min-w-0 flex-col justify-center rounded-lg border px-1 sm:px-3">
                <dt className="text-[11px] leading-4 text-stone-500 dark:text-stone-400">{label}</dt>
                <dd className="mt-1 truncate text-xs font-semibold leading-4 tabular-nums text-stone-900 dark:text-stone-100 sm:text-sm" title={value}>{value}</dd>
              </div>
            ))}
          </dl>
          <Link
            to={destination}
            state={destinationState}
            className={`${completed ? "app-button-secondary" : "app-button-primary"} app-radius-control inline-flex h-14 w-24 shrink-0 items-center justify-center rounded-lg text-sm font-semibold sm:w-28`}
          >
            {completed ? "결과 확인" : "이어서 풀기"}
          </Link>
        </div>
      </div>
      {actions ? <div className="absolute right-3 top-4 sm:right-4 lg:static lg:shrink-0 lg:pb-3.5">{actions}</div> : null}
    </article>
  );
}
