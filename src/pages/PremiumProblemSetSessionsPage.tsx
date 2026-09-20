import { useCallback, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { PremiumAttemptListSkeleton } from "../components/premium/PremiumLoadingStates";
import { ButtonLoadingContent } from "../components/ui/AsyncLoading";
import { AppFooter } from "../components/ui/AppFooter";
import { DashboardHeaderTitle } from "../components/ui/DashboardHeaderTitle";
import { ReturnLinkLabel } from "../components/ui/ReturnLinkLabel";
import { Toast } from "../components/ui/Toast";
import { PremiumLoadError } from "../components/premium/PremiumLoadError";
import { usePremiumResource } from "../hooks/usePremiumResource";
import {
  createPremiumAttempt,
  getPremiumErrorMessage,
  listPremiumProblemSetAttempts,
  listPremiumProblemSets,
  type PremiumAttemptSummary,
} from "../lib/premiumApi";
import { SessionListItem } from "../components/session/SessionListItem";

const retryLabel = (attempt: PremiumAttemptSummary) => {
  if (attempt.retryMode === "all") return "전체 다시 풀기";
  if (attempt.retryMode === "incorrect") return "오답 풀기";
  if (attempt.retryMode === "bookmarked") return "책갈피 풀기";
  if (attempt.retryMode === "unanswered") return "미응답 풀기";
  return attempt.attemptNumber === 1 ? "첫 풀이" : "새로 풀기";
};

function AttemptListItem({ attempt }: { attempt: PremiumAttemptSummary }) {
  const completed = attempt.status === "submitted";
  return (
    <SessionListItem
      attemptNumber={attempt.attemptNumber}
      title={attempt.title}
      modeLabel={retryLabel(attempt)}
      completed={completed}
      orderMode={attempt.orderMode}
      createdAt={attempt.createdAt}
      solvedQuestions={attempt.solvedQuestions}
      totalQuestions={attempt.totalQuestions}
      elapsedSeconds={attempt.elapsedSeconds}
      scorePercent={attempt.scorePercent}
      destination={completed ? `/premium/results/${attempt.id}` : `/premium/attempts/${attempt.id}`}
      destinationState={completed ? undefined : { solveEntry: "resume" }}
    />
  );
}

export function PremiumProblemSetSessionsPage() {
  const { courseId, problemSetId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const routeTitle = (location.state as { problemSetTitle?: string } | null)?.problemSetTitle;
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    if (!courseId || !problemSetId) throw new Error("Missing problem set");
    const [problemSets, attempts] = await Promise.all([
      listPremiumProblemSets(courseId),
      listPremiumProblemSetAttempts(problemSetId),
    ]);
    const problemSet = problemSets.find((item) => item.id === problemSetId);
    if (!problemSet) throw new Error("Problem set unavailable");
    return { problemSet, attempts };
  }, [courseId, problemSetId]);
  const { data, error: loadError, isLoading, reload } = usePremiumResource(
    `${courseId}/${problemSetId}`,
    load,
    "풀이 세션을 불러오지 못했습니다. 다시 시도하거나 문제 목록에서 선택해 주세요.",
  );
  const problemSet = data?.problemSet;
  const attempts = data?.attempts ?? [];

  const coursePath = useMemo(() => `/premium/courses/${courseId ?? ""}`, [courseId]);

  const startNewAttempt = async () => {
    if (!problemSetId || !problemSet || isLoading || isStarting) return;
    setIsStarting(true);
    setError(null);
    try {
      const attempt = await createPremiumAttempt(problemSetId);
      navigate(`/premium/attempts/${attempt.id}`, { state: { solveEntry: "direct" } });
    } catch (cause) {
      setError(getPremiumErrorMessage(
        cause,
        "새 문제 풀이를 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      ));
      setIsStarting(false);
    }
  };

  return (
    <div className="app-page px-4 py-8 transition-colors duration-300 md:px-6">
      <Toast message={error} onDismiss={() => setError(null)} />
      <div className="mx-auto max-w-6xl">
        <DashboardHeaderTitle
          title={problemSet?.title ?? routeTitle ?? "풀이 세션"}
          sectionTitle="풀이 세션"
          logoTo={coursePath}
          logoLabel="문제 목록으로 이동"
        >
          <button
            type="button"
            onClick={() => void startNewAttempt()}
            disabled={!problemSet || isLoading || isStarting}
            className="app-button-primary app-button-primary-standalone rounded-xl px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 sm:px-4"
          >
            {isStarting
              ? <ButtonLoadingContent label="풀이 준비 중" />
              : "새로 문제 풀이 시작하기"}
          </button>
          <Link
            to={coursePath}
            className="app-button-secondary rounded-xl px-3 py-2 text-center text-sm font-semibold sm:px-4"
          >
            <ReturnLinkLabel>문제 목록으로</ReturnLinkLabel>
          </Link>
        </DashboardHeaderTitle>

        {isLoading ? (
          <PremiumAttemptListSkeleton />
        ) : loadError ? (
          <PremiumLoadError message={loadError} onRetry={reload} backTo={coursePath} />
        ) : attempts.length > 0 ? (
          <div className="app-content-stagger space-y-2.5">
            {attempts.map((attempt) => <AttemptListItem key={attempt.id} attempt={attempt} />)}
          </div>
        ) : (
          <div className="app-content-enter app-card rounded-2xl border border-dashed px-6 py-12 text-center">
            <p className="text-base font-bold text-stone-800 dark:text-stone-200">
              아직 풀이 세션이 없습니다.
            </p>
            <p className="mt-2 text-sm leading-6 text-stone-500 dark:text-stone-500">
              상단의 새로 문제 풀이 시작하기를 누르면 첫 번째 풀이 세션이 만들어집니다.
            </p>
          </div>
        )}

        <AppFooter />
      </div>
    </div>
  );
}
