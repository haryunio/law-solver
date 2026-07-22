import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { PremiumProblemGridSkeleton } from "../components/premium/PremiumLoadingStates";
import { AppFooter } from "../components/ui/AppFooter";
import { DashboardHeaderTitle } from "../components/ui/DashboardHeaderTitle";
import { PremiumBadge } from "../components/ui/PremiumBadge";
import { ReturnLinkLabel } from "../components/ui/ReturnLinkLabel";
import { Toast } from "../components/ui/Toast";
import {
  getPremiumErrorMessage,
  listPremiumCourses,
  listPremiumProblemSets,
  type PremiumProblemSetSummary,
  type PremiumQuestionType,
} from "../lib/premiumApi";

const questionTypeLabel: Record<PremiumQuestionType, string> = {
  ox: "OX",
  multiple_choice: "5지선다",
  short_answer: "단답형",
};

const questionTypeStyle: Record<PremiumQuestionType, string> = {
  ox: "border-red-100 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400",
  multiple_choice: "border-orange-100 bg-orange-50 text-orange-700 dark:border-orange-900/50 dark:bg-orange-950/30 dark:text-orange-400",
  short_answer: "border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400",
};

export function PremiumCoursePage() {
  const { courseId } = useParams();
  const location = useLocation();
  const routeTitle = (location.state as { courseTitle?: string } | null)?.courseTitle;
  const [title, setTitle] = useState(routeTitle ?? "온라인 문제 목록");
  const [problemSets, setProblemSets] = useState<PremiumProblemSetSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [didLoadFail, setDidLoadFail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId) {
      setDidLoadFail(true);
      setError("과목 정보를 찾을 수 없습니다. 온라인 과목 목록에서 다시 선택해 주세요.");
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setDidLoadFail(false);
    void Promise.all([listPremiumCourses(), listPremiumProblemSets(courseId)])
      .then(([courses, sets]) => {
        if (cancelled) return;
        setTitle(courses.find((course) => course.id === courseId)?.name ?? "온라인 문제 목록");
        setProblemSets(sets);
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setDidLoadFail(true);
        setError(getPremiumErrorMessage(
          cause,
          "문제 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
        ));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [courseId]);

  return (
    <div className="app-page px-4 py-8 transition-colors duration-300 md:px-6">
      <Toast message={error} onDismiss={() => setError(null)} />
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
        ) : problemSets.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {problemSets.map((problemSet) => (
              <article
                key={problemSet.id}
                className="app-card app-problem-card flex min-w-0 flex-col overflow-hidden rounded-2xl border"
              >
                <div className="flex flex-1 flex-col p-5">
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold text-stone-950 dark:text-stone-100">
                      {problemSet.title}
                    </h2>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <PremiumBadge />
                      {problemSet.question_types.map((questionType) => (
                        <span
                          key={questionType}
                          className={[
                            "rounded-full border px-2.5 py-0.5 text-[11px] font-bold",
                            questionTypeStyle[questionType],
                          ].join(" ")}
                        >
                          {questionTypeLabel[questionType]}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                    <div className="app-neutral-box min-w-0 rounded-xl px-3 py-3">
                      <span className="block text-xs text-stone-500 dark:text-stone-400">전체 문항</span>
                      <strong className="mt-1 block text-stone-900 dark:text-stone-100">
                        {problemSet.question_count}문항
                      </strong>
                    </div>
                    <div className="app-neutral-box min-w-0 rounded-xl px-3 py-3">
                      <span className="block text-xs text-stone-500 dark:text-stone-400">풀이 세션</span>
                      <strong className="mt-1 block text-stone-900 dark:text-stone-100">
                        {problemSet.attempt_count}개
                      </strong>
                    </div>
                  </div>
                </div>
                <Link
                  to={`/premium/courses/${courseId}/problem-sets/${problemSet.id}`}
                  state={{ problemSetTitle: problemSet.title }}
                  className="app-result-link block border-t px-4 py-3 text-center text-sm font-bold shadow-[0_-1px_0_rgba(0,0,0,0.02)]"
                >
                  풀이 세션 보기
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="app-card rounded-2xl border border-dashed p-10 text-center">
            <p className="text-base font-medium text-stone-700 dark:text-stone-300">
              {didLoadFail ? "문제 목록을 표시하지 못했습니다." : "공개된 문제가 없습니다."}
            </p>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-500">
              {didLoadFail
                ? "과목 목록에서 다시 들어오거나 잠시 후 새로고침해 주세요."
                : "문제가 등록되면 이곳에서 풀이를 시작할 수 있습니다."}
            </p>
          </div>
        )}

        <AppFooter />
      </div>
    </div>
  );
}
