import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { ReviewQuestionDetails } from "../components/review/ReviewQuestionDetails";
import { ReviewNavigation } from "../components/review/ReviewNavigation";
import { ReviewOmrSheet } from "../components/review/ReviewOmrSheet";
import { StudyOmrTable } from "../components/study/StudyOmrTable";
import { useSessionPageAdapter } from "../components/session/SessionPageContext";
import { OverflowTooltipTitle } from "../components/ui/OverflowTooltipTitle";
import { ReturnLinkLabel } from "../components/ui/ReturnLinkLabel";
import { isCorrectAnswer } from "../lib/answer";
import {
  ReviewType,
  toAnalyticsQuestionType,
  trackEvent,
} from "../lib/analytics";
import { useOfflineSession } from "../hooks/useOfflineSession";

export function ReviewAllPage() {
  const { sessionId = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const adapter = useSessionPageAdapter();
  const { session: localSession } = useOfflineSession(adapter ? "" : sessionId);
  const session = adapter?.session ?? localSession;

  const searchParams = new URLSearchParams(location.search);
  const onlyBookmarks = searchParams.get("onlyBookmarks") === "true";

  const questions = useMemo(() => {
    if (!session) return [];
    if (onlyBookmarks) {
      return session.questions.filter((q) => q.bookmark);
    }
    return session.questions;
  }, [session, onlyBookmarks]);

  const solveOrderMap = useMemo(
    () =>
      new Map(
        (session?.questions ?? []).map((question, idx) => [question.id, idx + 1]),
      ),
    [session?.questions],
  );

  const [index, setIndex] = useState(0);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const trackedReviewSessionRef = useRef<string | null>(null);
  const trackedReviewQuestionIdsRef = useRef(new Set<string>());
  const omrRefs = useMemo(() => new Map<number, HTMLButtonElement | null>(), []);

  const current = questions[index];
  const reviewType: ReviewType = onlyBookmarks ? "bookmarked" : "all";

  useEffect(() => {
    if (!session || session.status !== "completed" || !current) return;

    const reviewSessionKey = `${session.id}:${reviewType}`;
    if (trackedReviewSessionRef.current !== reviewSessionKey) {
      trackedReviewSessionRef.current = reviewSessionKey;
      trackedReviewQuestionIdsRef.current.clear();
      trackEvent("review_started", {
        review_type: reviewType,
        question_type: toAnalyticsQuestionType(session.type),
      });
    }

    if (trackedReviewQuestionIdsRef.current.has(current.id)) return;
    trackedReviewQuestionIdsRef.current.add(current.id);
    trackEvent("review_question_viewed", {
      review_type: reviewType,
      question_type: toAnalyticsQuestionType(session.type),
    });
  }, [current, index, questions.length, reviewType, session]);

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 });
  }, [index]);

  useEffect(() => {
    const activeBtn = omrRefs.get(index);
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [index, omrRefs]);

  if (!session) {
    return (
      <div className="app-page p-6">
        <div className="app-card mx-auto max-w-2xl rounded-2xl border p-8 text-center">
          <p className="text-stone-700 dark:text-stone-300">문제 세션을 찾을 수 없습니다. 대시보드에서 다시 선택해 주세요.</p>
          <Link
            to="/dashboard"
            className="app-button-primary mt-4 inline-flex rounded-lg px-4 py-2 text-sm font-semibold"
          >
            <ReturnLinkLabel variant="solid">메인으로</ReturnLinkLabel>
          </Link>
        </div>
      </div>
    );
  }

  if (session.status !== "completed") {
    return (
      <div className="app-page p-6">
        <div className="app-card mx-auto max-w-2xl rounded-2xl border p-8 text-center">
          <p className="text-stone-700 dark:text-stone-300">채점 완료 후 확인할 수 있습니다.</p>
          <button
            onClick={() => navigate(
              adapter ? adapter.solvePath(session.id) : `/solve/${session.id}`,
              { state: { solveEntry: "resume" } },
            )}
            className="app-button-primary mt-4 rounded-lg px-4 py-2 text-sm font-semibold"
          >
            풀이 화면으로
          </button>
        </div>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="app-page p-6">
        <div className="app-card mx-auto max-w-2xl rounded-2xl border p-8 text-center">
          <p className="text-stone-700 dark:text-stone-300">문제 데이터를 불러오지 못했습니다. 대시보드에서 다시 선택해 주세요.</p>
          <Link
            to={adapter?.resultPath(session.id) ?? `/result/${session.id}`}
            className="app-button-secondary mt-4 inline-flex rounded-lg px-4 py-2 text-sm font-semibold"
          >
            <ReturnLinkLabel>결과로 돌아가기</ReturnLinkLabel>
          </Link>
        </div>
      </div>
    );
  }

  const isCorrect = isCorrectAnswer(current, current.my_answer);

  return (
    <div className="app-focus-page app-study-page app-page text-stone-900 transition-colors duration-300 dark:text-stone-100">
      <header className="app-topbar sticky top-0 z-20 border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-2 md:px-6">
          <div className="min-w-0 flex-1">
            <OverflowTooltipTitle
              text={`${session.title} · ${onlyBookmarks ? "책갈피 문제 확인하기" : "모든 문제 확인하기"}`}
              className="text-xs font-semibold sm:text-sm dark:text-stone-100"
            />
          </div>
          <Link
            to={adapter?.resultPath(session.id) ?? `/result/${session.id}`}
            className="app-button-secondary app-study-control shrink-0 px-2.5 py-1.5 text-xs font-semibold sm:px-3 sm:text-sm"
          >
            <ReturnLinkLabel>결과로</ReturnLinkLabel>
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 py-3 md:grid-cols-[minmax(0,1fr)_220px] md:items-start md:px-6">
        <main className="app-card app-study-panel flex min-w-0 w-full max-h-[calc(100vh-112px)] flex-col overflow-hidden border supports-[height:100dvh]:max-h-[calc(100dvh-112px)]">
          <div className="shrink-0 p-5 pb-4 md:px-8 md:pt-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="app-study-tag inline-flex border border-stone-200 bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600 dark:border-stone-800 dark:bg-stone-800 dark:text-stone-400">
                  {onlyBookmarks ? "책갈피 " : "문제 "} {index + 1} / {questions.length}
                  {onlyBookmarks && (
                    <span className="ml-2 text-stone-400 dark:text-stone-600">
                      (원본 {solveOrderMap.get(current.id)}번)
                    </span>
                  )}
                </span>
                {current.chapter ? (
                  <span className="app-study-tag inline-flex max-w-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
                    <span className="truncate">챕터 · {current.chapter}</span>
                  </span>
                ) : null}
              </div>
              <span
                className={[
                  "app-study-tag shrink-0 px-2 py-1 text-xs font-bold",
                  isCorrect
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                    : "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400",
                ].join(" ")}
              >
                {isCorrect ? "정답" : "오답"}
              </span>
            </div>
          </div>
          <div ref={contentRef} className="min-h-0 flex-auto overflow-y-auto px-5 pb-6 md:px-8">
            <ReviewQuestionDetails question={current} />
          </div>

          <ReviewNavigation
            index={index}
            total={questions.length}
            onPrevious={() => setIndex((prev) => Math.max(0, prev - 1))}
            onNext={() => setIndex((prev) => Math.min(questions.length - 1, prev + 1))}
            onOpenOmr={() => setIsSheetOpen(true)}
          />
        </main>

        <aside className="app-card app-study-panel hidden max-h-[calc(100vh-112px)] flex-col border p-4 supports-[height:100dvh]:max-h-[calc(100dvh-112px)] md:flex md:self-start">
          <h3 className="mb-3 text-sm font-semibold dark:text-stone-100">{onlyBookmarks ? "책갈피" : "전체 문항"} OMR</h3>
          <StudyOmrTable
            questions={questions}
            currentIndex={index}
            mode="review"
            onSelect={setIndex}
            getQuestionNumber={(question, questionIndex) => solveOrderMap.get(question.id) ?? questionIndex + 1}
            rowRef={(questionIndex, node) => omrRefs.set(questionIndex, node)}
            className="min-h-0 flex-1 overflow-y-auto"
          />
        </aside>
      </div>

      <ReviewOmrSheet open={isSheetOpen} title="문항 이동" onClose={() => setIsSheetOpen(false)}>
        <StudyOmrTable
          questions={questions}
          currentIndex={index}
          mode="review"
          onSelect={(nextIndex) => {
            setIndex(nextIndex);
            setIsSheetOpen(false);
          }}
          getQuestionNumber={(question, questionIndex) => solveOrderMap.get(question.id) ?? questionIndex + 1}
          density="comfortable"
          className="max-h-[48vh] overflow-y-auto supports-[height:100dvh]:max-h-[48dvh]"
        />
      </ReviewOmrSheet>
    </div>
  );
}
