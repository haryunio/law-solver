import { useCallback } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { PremiumProblemGridSkeleton } from "../components/premium/PremiumLoadingStates";
import { ProblemSetCardMetadata } from "../components/session/ProblemSetCardMetadata";
import { AppFooter } from "../components/ui/AppFooter";
import { DashboardHeaderTitle } from "../components/ui/DashboardHeaderTitle";
import { PremiumBadge } from "../components/ui/PremiumBadge";
import { ReturnLinkLabel } from "../components/ui/ReturnLinkLabel";
import { PremiumLoadError } from "../components/premium/PremiumLoadError";
import { usePremiumResource } from "../hooks/usePremiumResource";
import {
  listPremiumCourses,
  listPremiumProblemSets,
  type PremiumQuestionType,
} from "../lib/premiumApi";
import type { TestType } from "../types/test";

const questionType: Record<PremiumQuestionType, TestType> = {
  ox: "OX",
  multiple_choice: "5-choice",
  short_answer: "short",
};

export function PremiumCoursePage() {
  const { courseId } = useParams();
  const location = useLocation();
  const routeTitle = (location.state as { courseTitle?: string } | null)?.courseTitle;
  const load = useCallback(async () => {
    if (!courseId) throw new Error("Missing course");
    const [courses, problemSets] = await Promise.all([listPremiumCourses(), listPremiumProblemSets(courseId)]);
    return { title: courses.find((course) => course.id === courseId)?.name, problemSets };
  }, [courseId]);
  const { data, error, isLoading, reload } = usePremiumResource(
    courseId ?? "",
    load,
    "문제 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
  );
  const title = data?.title ?? routeTitle ?? "온라인 문제 목록";
  const problemSets = data?.problemSets ?? [];

  return (
    <div className="app-page px-4 py-8 transition-colors duration-300 md:px-6">
      <div className="mx-auto max-w-6xl">
        <DashboardHeaderTitle
          title={title}
          sectionTitle="문제 목록"
          logoTo="/premium"
          logoLabel="온라인 과목 대시보드로 이동"
        >
          <Link
            to="/premium"
            className="app-button-secondary rounded-xl px-3 py-2 text-center text-sm font-semibold sm:px-4"
          >
            <ReturnLinkLabel>과목 목록으로</ReturnLinkLabel>
          </Link>
        </DashboardHeaderTitle>

        {isLoading ? (
          <PremiumProblemGridSkeleton />
        ) : error ? (
          <PremiumLoadError message={error} onRetry={reload} backTo="/premium" />
        ) : problemSets.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {problemSets.map((problemSet) => (
              <article
                key={problemSet.id}
                className="app-card app-problem-card flex min-w-0 flex-col overflow-hidden rounded-2xl border"
              >
                <div className="px-4 pb-3 pt-3.5">
                  <div className="mb-4 flex min-w-0 items-center justify-between gap-3">
                    <h2 title={problemSet.title} className="min-w-0 truncate text-base font-semibold leading-6 text-stone-900 dark:text-stone-100">
                      {problemSet.title}
                    </h2>
                    <PremiumBadge />
                  </div>
                  <ProblemSetCardMetadata type={questionType[problemSet.question_type]} questionCount={problemSet.question_count} sessionCount={problemSet.attempt_count} />
                </div>
                <Link
                  to={`/premium/courses/${courseId}/problem-sets/${problemSet.id}`}
                  state={{ problemSetTitle: problemSet.title }}
                  className="app-result-link mt-auto flex min-h-12 items-center justify-end gap-2 border-t px-4 py-2.5 text-sm font-semibold"
                >
                  풀이 세션 보기 <span aria-hidden="true">→</span>
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="app-card rounded-2xl border border-dashed p-10 text-center">
            <p className="text-base font-medium text-stone-700 dark:text-stone-300">
              공개된 문제가 없습니다.
            </p>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-500">
              문제가 등록되면 이곳에서 풀이를 시작할 수 있습니다.
            </p>
          </div>
        )}

        <AppFooter />
      </div>
    </div>
  );
}
