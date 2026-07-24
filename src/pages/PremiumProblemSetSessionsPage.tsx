import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { PremiumAttemptListSkeleton } from "../components/premium/PremiumLoadingStates";
import { ButtonLoadingContent } from "../components/ui/AsyncLoading";
import { AppFooter } from "../components/ui/AppFooter";
import { DashboardHeaderTitle } from "../components/ui/DashboardHeaderTitle";
import { ReturnLinkLabel } from "../components/ui/ReturnLinkLabel";
import { Toast } from "../components/ui/Toast";
import {
  createPremiumAttempt,
  getPremiumErrorMessage,
  listPremiumProblemSetAttempts,
  listPremiumProblemSets,
  type PremiumAttemptSummary,
  type PremiumProblemSetSummary,
} from "../lib/premiumApi";
import { formatElapsedTime } from "../lib/time";

const orderLabel = {
  number: "번호 순서",
  "chapter-random": "챕터별 랜덤",
  random: "전체 랜덤",
} as const;

const retryLabel = (attempt: PremiumAttemptSummary) => {
  if (attempt.retryMode === "all") return "전체 다시 풀기";
  if (attempt.retryMode === "incorrect") return "오답 풀기";
  if (attempt.retryMode === "bookmarked") return "책갈피 풀기";
  if (attempt.retryMode === "unanswered") return "미응답 풀기";
  return attempt.attemptNumber === 1 ? "첫 풀이" : "새로 풀기";
};

const attemptDateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function AttemptListItem({ attempt }: { attempt: PremiumAttemptSummary }) {
  const isCompleted = attempt.status === "submitted";
  const destination = isCompleted
    ? `/premium/results/${attempt.id}`
    : `/premium/attempts/${attempt.id}`;

  return (
    <article className="app-card app-problem-card rounded-2xl border px-4 py-3 sm:px-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="inline-flex h-9 shrink-0 items-center rounded-lg border border-red-100 bg-red-50 px-2.5 text-xs font-black text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
            {attempt.attemptNumber}회차
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <h2 className="truncate text-sm font-bold text-stone-900 dark:text-stone-100">
                {retryLabel(attempt)}
              </h2>
              <span className={[
                "rounded-full border px-2 py-0.5 text-[10px] font-bold",
                isCompleted
                  ? "border-blue-100 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-400"
                  : "border-red-100 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400",
              ].join(" ")}>
                {isCompleted ? "채점 완료" : "풀이 중"}
              </span>
              <span className="rounded-full border border-stone-200 bg-stone-50 px-2 py-0.5 text-[10px] font-bold text-stone-600 dark:border-stone-700 dark:bg-stone-950/40 dark:text-stone-300">
                {orderLabel[attempt.orderMode]}
              </span>
            </div>
            <p className="mt-1 truncate text-xs text-stone-400 dark:text-stone-500">
              {attemptDateFormatter.format(new Date(attempt.createdAt))}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs lg:w-[360px]">
          <div className="app-neutral-box rounded-lg px-2.5 py-2">
            <span className="block text-[10px] text-stone-500">진행</span>
            <strong className="mt-0.5 block text-stone-900 dark:text-stone-100">
              {attempt.solvedQuestions}/{attempt.totalQuestions}
            </strong>
          </div>
          <div className="app-neutral-box rounded-lg px-2.5 py-2">
            <span className="block text-[10px] text-stone-500">시간</span>
            <strong className="mt-0.5 block text-stone-900 dark:text-stone-100">
              {formatElapsedTime(attempt.elapsedSeconds)}
            </strong>
          </div>
          <div className="app-neutral-box rounded-lg px-2.5 py-2">
            <span className="block text-[10px] text-stone-500">점수</span>
            <strong className="mt-0.5 block text-stone-900 dark:text-stone-100">
              {isCompleted ? `${attempt.scorePercent ?? 0}%` : "풀이 중"}
            </strong>
          </div>
        </div>

        <Link
          to={destination}
          state={isCompleted ? undefined : { solveEntry: "resume" }}
          className={[
            "shrink-0 rounded-xl px-4 py-2.5 text-center text-sm font-bold lg:min-w-[116px]",
            isCompleted ? "app-button-secondary" : "app-button-primary",
          ].join(" ")}
        >
          {isCompleted ? "결과 확인" : "이어서 풀기"}
        </Link>
      </div>
    </article>
  );
}

export function PremiumProblemSetSessionsPage() {
  const { courseId, problemSetId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const routeTitle = (location.state as { problemSetTitle?: string } | null)?.problemSetTitle;
  const [problemSet, setProblemSet] = useState<PremiumProblemSetSummary | null>(null);
  const [attempts, setAttempts] = useState<PremiumAttemptSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId || !problemSetId) {
      setError("문제 정보를 찾을 수 없습니다. 문제 목록에서 다시 선택해 주세요.");
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    void Promise.all([
      listPremiumProblemSets(courseId),
      listPremiumProblemSetAttempts(problemSetId),
    ])
      .then(([problemSets, nextAttempts]) => {
        if (cancelled) return;
        setProblemSet(problemSets.find((item) => item.id === problemSetId) ?? null);
        setAttempts(nextAttempts);
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setError(getPremiumErrorMessage(
            cause,
            "풀이 세션을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
          ));
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [courseId, problemSetId]);

  const coursePath = useMemo(() => `/premium/courses/${courseId ?? ""}`, [courseId]);

  const startNewAttempt = async () => {
    if (!problemSetId || isStarting) return;
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
            disabled={!problemSet || isStarting}
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
        ) : attempts.length > 0 ? (
          <div className="space-y-2.5">
            {attempts.map((attempt) => <AttemptListItem key={attempt.id} attempt={attempt} />)}
          </div>
        ) : (
          <div className="app-card rounded-2xl border border-dashed px-6 py-12 text-center">
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
