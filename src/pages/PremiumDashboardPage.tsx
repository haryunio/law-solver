import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { AppFooter } from "../components/ui/AppFooter";
import { DashboardHeaderTitle } from "../components/ui/DashboardHeaderTitle";
import { PremiumBadge } from "../components/ui/PremiumBadge";
import { ReturnLinkLabel } from "../components/ui/ReturnLinkLabel";
import { SubjectCardCover } from "../components/ui/SubjectCardCover";
import {
  premiumOrangeAccentColor,
  premiumOrangeCoverStyle,
} from "../lib/subjectCover";

const activeCourses = [
  {
    id: "bar-14-civil-law",
    title: "2025년도 제14회 변호사시험 민법",
    until: "2026. 8. 31.",
  },
] as const;

export function PremiumDashboardPage() {
  return (
    <div className="app-page px-4 py-8 transition-colors duration-300 md:px-6">
      <div className="mx-auto max-w-6xl">
        <DashboardHeaderTitle
          title="온라인 문제 풀이"
          logoTo="/home"
          logoLabel="홈으로 이동"
        >
          <Link
            to="/home"
            className="app-button-secondary rounded-xl px-3 py-2 text-center text-sm font-semibold sm:px-4"
          >
            <ReturnLinkLabel>홈으로</ReturnLinkLabel>
          </Link>
        </DashboardHeaderTitle>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Link
            to="/account?tab=packages"
            className="app-card app-subject-card group overflow-hidden rounded-2xl border transition hover:-translate-y-0.5 hover:shadow-[var(--app-shadow-hover)]"
            style={{ "--subject-accent": premiumOrangeAccentColor } as CSSProperties}
          >
            <SubjectCardCover
              title="과목 이용권 관리"
              coverStyle={premiumOrangeCoverStyle}
              titleLines={2}
            />
            <div className="flex h-[104px] items-center justify-between gap-3 p-4">
              <span className="text-sm font-semibold text-stone-700 dark:text-stone-300">이용권 관리 페이지로 이동</span>
              <span className="text-xl font-semibold text-red-500 transition-transform group-hover:translate-x-0.5 dark:text-red-400" aria-hidden="true">
                →
              </span>
            </div>
          </Link>

          {activeCourses.map((course) => (
            <article
              key={course.id}
              className="app-card app-subject-card group overflow-hidden rounded-2xl border transition hover:-translate-y-0.5 hover:shadow-[var(--app-shadow-hover)]"
              style={
                {
                  "--subject-accent": premiumOrangeAccentColor,
                } as CSSProperties
              }
            >
              <SubjectCardCover
                title={course.title}
                coverStyle={premiumOrangeCoverStyle}
                topRight={(
                  <PremiumBadge className="border-white/50 bg-white/85 text-amber-900" />
                )}
                titleLines={2}
              />
              <div className="h-[104px] p-4">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">이용 중</span>
                  <span className="text-stone-500">{course.until}까지</span>
                </div>
                <button
                  type="button"
                  disabled
                  className="app-button-primary mt-3 inline-flex h-11 w-full cursor-not-allowed items-center justify-center rounded-xl px-4 text-sm font-semibold opacity-70"
                >
                  문제 목록 목업
                </button>
              </div>
            </article>
          ))}
        </div>

        <AppFooter />
      </div>
    </div>
  );
}
