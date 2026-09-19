import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { getSubjectDashboardPath } from "../../lib/subject";
import { getSubjectAccentColor, getSubjectCoverStyle } from "../../lib/subjectCover";
import type { SubjectCoverPalette } from "../../types/test";

interface SubjectBookCardProps {
  id: string;
  name: string;
  total: number;
  inProgress: number;
  completed: number;
  coverPalette?: SubjectCoverPalette;
}

export function SubjectBookCard({
  id,
  name,
  total,
  inProgress,
  completed,
  coverPalette = "warm",
}: SubjectBookCardProps) {
  return (
    <Link
      to={getSubjectDashboardPath(id)}
      className="app-card app-subject-card app-subject-book relative isolate flex h-56 min-w-0 overflow-hidden rounded-l-md rounded-r-xl border transition-[border-color,box-shadow] duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-500"
      style={{ "--subject-accent": getSubjectAccentColor(coverPalette) } as CSSProperties}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={getSubjectCoverStyle(name, coverPalette)}
      >
        <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(255,255,255,0.20),transparent_60%)] dark:bg-black/20" />
        <div className="absolute inset-y-0 left-0 w-2.5 border-r border-white/25 bg-black/10 shadow-[2px_0_4px_rgba(0,0,0,0.08)]" />
        <div className="absolute left-5 right-3 top-3 h-px bg-white/30" />
      </div>

      <div className="app-subject-book-label relative mb-[3px] ml-3 mr-[3px] mt-14 flex min-w-0 flex-1 flex-col rounded-br-lg rounded-tl-sm px-3 pb-3 pt-3">
        <p className="text-[11px] leading-4 text-stone-500 dark:text-stone-400">
          문제 <span className="tabular-nums">{total.toLocaleString("ko-KR")}</span>개
        </p>
        <h2
          title={name}
          className="mt-1.5 line-clamp-3 break-keep text-[17px] font-semibold leading-[22px] tracking-tight text-stone-900 [overflow-wrap:anywhere] dark:text-stone-100"
        >
          {name}
        </h2>

        <dl className="mt-auto grid grid-cols-2 gap-2 border-t border-stone-200/80 pt-2 dark:border-stone-700/70">
          <div className="min-w-0">
            <dt className="whitespace-nowrap text-[11px] leading-4 text-stone-500 dark:text-stone-400">풀이 중</dt>
            <dd className="text-sm font-semibold leading-5 tabular-nums text-red-600 dark:text-red-400">
              {inProgress.toLocaleString("ko-KR")}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="whitespace-nowrap text-[11px] leading-4 text-stone-500 dark:text-stone-400">채점 완료</dt>
            <dd className="text-sm font-semibold leading-5 tabular-nums text-blue-600 dark:text-blue-400">
              {completed.toLocaleString("ko-KR")}
            </dd>
          </div>
        </dl>
      </div>
    </Link>
  );
}
