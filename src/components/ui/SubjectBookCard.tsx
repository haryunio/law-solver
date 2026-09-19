import { Link } from "react-router-dom";
import { getSubjectDashboardPath } from "../../lib/subject";
import { getSubjectAccentColor, getSubjectCoverStyle } from "../../lib/subjectCover";
import type { SubjectCoverPalette } from "../../types/test";
import { BookCover, bookLinkClassName } from "./BookCover";

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
      className={bookLinkClassName}
    >
      <BookCover
        title={name}
        coverStyle={getSubjectCoverStyle(name, coverPalette)}
        accentColor={getSubjectAccentColor(coverPalette)}
        eyebrow={<>문제 <span className="tabular-nums">{total.toLocaleString("ko-KR")}</span>개</>}
      >
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
      </BookCover>
    </Link>
  );
}
