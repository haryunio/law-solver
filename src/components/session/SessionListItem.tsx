import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { SolveOrder } from "../../types/test";
import { formatElapsedTime } from "../../lib/time";

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

const dateFormatter = new Intl.DateTimeFormat("ko-KR", { dateStyle: "short", timeStyle: "short" });

export function formatSessionDate(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? dateFormatter.format(date) : "날짜 기록 없음";
}

export function SessionListItem({
  attemptNumber, title, modeLabel, completed, orderMode, createdAt, lastPlayedAt,
  solvedQuestions, totalQuestions, elapsedSeconds, scorePercent, destination,
  destinationState, actions,
}: SessionListItemProps) {
  return (
    <article className="app-card app-problem-card rounded-xl border px-4 py-4 sm:px-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="app-neutral-box inline-flex h-10 min-w-10 shrink-0 items-center justify-center rounded-lg px-2 text-xs font-semibold tabular-nums text-stone-600 dark:text-stone-300">
            {attemptNumber}회
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h2 title={title} className="line-clamp-2 min-w-0 break-keep text-sm font-semibold text-stone-900 [overflow-wrap:anywhere] dark:text-stone-100">{title}</h2>
              <span className={`shrink-0 text-xs font-medium ${completed ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400"}`}>
                {completed ? "채점 완료" : "풀이 중"}
              </span>
            </div>
            <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-stone-500 dark:text-stone-400">
              {modeLabel ? <span>{modeLabel}</span> : null}
              <span>{orderLabels[orderMode]}</span>
            </p>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] leading-4 text-stone-500 dark:text-stone-400">
              <span>생성 {formatSessionDate(createdAt)}</span>
              {lastPlayedAt !== undefined ? (
                <span>{lastPlayedAt ? `마지막 풀이 ${formatSessionDate(lastPlayedAt)}` : "마지막 풀이 기록 없음"}</span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 lg:shrink-0 lg:justify-end">
          <dl className="grid min-w-0 flex-1 grid-cols-3 gap-4 text-xs sm:min-w-[224px] lg:flex-none">
            <div><dt className="text-stone-500 dark:text-stone-400">진행</dt><dd className="mt-1 font-semibold tabular-nums">{solvedQuestions}/{totalQuestions}</dd></div>
            <div><dt className="text-stone-500 dark:text-stone-400">시간</dt><dd className="mt-1 font-semibold tabular-nums">{formatElapsedTime(elapsedSeconds)}</dd></div>
            <div><dt className="text-stone-500 dark:text-stone-400">점수</dt><dd className="mt-1 font-semibold tabular-nums">{completed ? `${scorePercent ?? 0}%` : "풀이 중"}</dd></div>
          </dl>
          <Link
            to={destination}
            state={destinationState}
            className={`${completed ? "app-button-secondary" : "app-button-primary"} shrink-0 rounded-lg px-4 py-2.5 text-center text-sm font-semibold`}
          >
            {completed ? "결과 확인" : "이어서 풀기"}
          </Link>
        </div>
      </div>
      {actions ? <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-stone-200/70 pt-2 dark:border-stone-700/70">{actions}</div> : null}
    </article>
  );
}
