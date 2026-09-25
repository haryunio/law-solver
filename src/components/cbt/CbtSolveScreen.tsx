import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { OverflowTooltipTitle } from "../ui/OverflowTooltipTitle";
import { RichTextContent } from "../ui/RichTextContent";
import { QuestionPassages } from "../study/QuestionPassages";
import { StudyOmrTable } from "../study/StudyOmrTable";
import { SolveChoiceList } from "./SolveChoiceList";
import { LegalReferenceContent } from "../ui/LegalReferenceContent";
import { getQuestionAnswerToken, hasNoCorrectChoice } from "../../lib/answer";
import {
  QuestionNavigationMethod,
  SolveEntry,
  toAnalyticsQuestionType,
  trackEvent,
} from "../../lib/analytics";
import { downloadSessionCsv } from "../../lib/csv";
import { useOfflineSession } from "../../hooks/useOfflineSession";
import { useSolveViewport } from "../../hooks/useSolveViewport";
import { formatElapsedTime } from "../../lib/time";
import { useTestStore } from "../../store/useTestStore";
import { AnswerValue, TestSession } from "../../types/test";
import { OmrShortcutButton } from "./OmrShortcutButton";
import { MobileOmrSheet } from "./MobileOmrSheet";
import { QuestionContentMotion } from "./QuestionContentMotion";
import { useQuestionPanelHeightMotion } from "./useQuestionPanelHeightMotion";

interface CbtSolveScreenProps {
  sessionId: string;
  solveEntry?: SolveEntry;
  sessionOverride?: TestSession;
  onAnswerChange?: (questionId: string, answer: AnswerValue) => void;
  onBookmarkChange?: (questionId: string) => void;
  onElapsedTimeTick?: () => void;
  onQuestionLeave?: (questionId: string) => void;
  canRevealAnswer?: boolean;
  onAnswerRevealRequest?: (questionId: string) => boolean | Promise<boolean>;
  onPaused?: (sessionId: string) => void;
  onSubmitted?: (sessionId: string) => void;
  allowCsvDownload?: boolean;
}

export function CbtSolveScreen({
  sessionId,
  solveEntry = "direct",
  sessionOverride,
  onAnswerChange,
  onBookmarkChange,
  onElapsedTimeTick,
  onQuestionLeave,
  canRevealAnswer = true,
  onAnswerRevealRequest,
  onPaused,
  onSubmitted,
  allowCsvDownload = true,
}: CbtSolveScreenProps) {
  const navigate = useNavigate();
  const { session: storedSession, sessionsPath } = useOfflineSession(sessionOverride ? "" : sessionId);
  const markSessionPlayed = useTestStore((state) => state.markSessionPlayed);
  const updateAnswer = useTestStore((state) => state.updateAnswer);
  const toggleBookmark = useTestStore((state) => state.toggleBookmark);
  const tickElapsedTime = useTestStore((state) => state.tickElapsedTime);
  const submitSession = useTestStore((state) => state.submitSession);

  const session = sessionOverride ?? storedSession;

  useEffect(() => {
    if (!sessionOverride && storedSession?.status === "in-progress") markSessionPlayed(sessionId);
  }, [sessionId, sessionOverride, storedSession?.status, markSessionPlayed]);

  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isAnswerRevealLoading, setIsAnswerRevealLoading] = useState(false);
  const [isOmrOpen, setIsOmrOpen] = useState(false);
  const [isPauseDialogOpen, setIsPauseDialogOpen] = useState(false);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const questionPanelRef = useRef<HTMLElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  useSolveViewport(viewportRef, Boolean(session?.questions[index]));
  useQuestionPanelHeightMotion(
    questionPanelRef,
    session?.questions[index] ? `${session.id}:${session.questions[index]?.id}` : undefined,
    showAnswer,
  );
  const trackedSolveSessionRef = useRef<string | null>(null);
  const trackedQuestionIdsRef = useRef(new Set<string>());
  const activeQuestionIdRef = useRef<string | null>(null);
  const omrRefs = useMemo(() => new Map<number, HTMLButtonElement | null>(), []);

  useEffect(() => {
    if (
      !session ||
      session.status === "completed" ||
      trackedSolveSessionRef.current === session.id
    ) {
      return;
    }

    trackedSolveSessionRef.current = session.id;
    trackedQuestionIdsRef.current.clear();
    const effectiveSolveEntry =
      solveEntry === "direct" && session.solved_questions > 0 ? "resume" : solveEntry;
    trackEvent("solve_started", {
      question_type: toAnalyticsQuestionType(session.type),
      solve_entry: effectiveSolveEntry,
    });
  }, [session, solveEntry]);

  useLayoutEffect(() => {
    setShowAnswer(false);
    setIsAnswerRevealLoading(false);
    contentRef.current?.scrollTo({ top: 0 });
  }, [index]);

  useEffect(() => {
    const activeBtn = omrRefs.get(index);
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: "auto", block: "nearest" });
    }
  }, [index, omrRefs]);

  useEffect(() => {
    if (!session || session.status === "completed") return;
    const timer = window.setInterval(() => {
      if (sessionOverride) {
        onElapsedTimeTick?.();
      } else {
        tickElapsedTime(sessionId);
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [session?.status, sessionId, sessionOverride, onElapsedTimeTick, tickElapsedTime]);

  useEffect(() => {
    if (!session) return;
    if (index > session.questions.length - 1) {
      setIndex(Math.max(0, session.questions.length - 1));
    }
  }, [index, session]);

  if (!session) {
    return (
      <div className="app-page p-6">
        <div className="app-card mx-auto max-w-2xl rounded-2xl border p-8 text-center text-stone-700 dark:text-stone-300">
          문제를 찾을 수 없습니다. 대시보드에서 문제를 다시 선택해 주세요.
        </div>
      </div>
    );
  }

  const current = session.questions[index];
  if (!current) {
    return (
      <div className="app-page p-6">
        <div className="app-card mx-auto max-w-2xl rounded-2xl border p-8 text-center text-stone-700 dark:text-stone-300">
          문항 데이터가 없습니다.
        </div>
      </div>
    );
  }
  activeQuestionIdRef.current = current.id;

  const answeredCount = session.questions.filter((q) => q.my_answer !== "").length;
  const unansweredCount = session.questions.length - answeredCount;
  const subjectDashboardPath = sessionsPath;
  const questionPanelMinHeight =
    session.type === "OX"
      ? "md:min-h-[min(420px,100%)]"
      : session.type === "short"
        ? "md:min-h-[min(360px,100%)]"
        : "md:min-h-[min(560px,100%)]";
  const omrPanelHeightClass =
    session.type === "5-choice"
      ? "md:h-auto md:max-h-full md:self-start"
      : "md:h-full md:max-h-full";

  const handleAnswer = (answer: string) => {
    if (sessionOverride) {
      onAnswerChange?.(current.id, answer as AnswerValue);
      return;
    }
    updateAnswer(session.id, current.id, answer as AnswerValue);
  };

  const trackCurrentQuestion = (navigationMethod: QuestionNavigationMethod) => {
    if (current.my_answer === "" || trackedQuestionIdsRef.current.has(current.id)) return;

    trackedQuestionIdsRef.current.add(current.id);
    trackEvent("question_completed", {
      question_type: toAnalyticsQuestionType(session.type),
      navigation_method: navigationMethod,
    });
  };

  const goToQuestion = (nextIndex: number, navigationMethod: QuestionNavigationMethod) => {
    const boundedIndex = Math.max(0, Math.min(session.total_questions - 1, nextIndex));
    if (boundedIndex === index) return;
    onQuestionLeave?.(current.id);
    trackCurrentQuestion(navigationMethod);
    setIndex(boundedIndex);
  };

  const goToNext = (navigationMethod: QuestionNavigationMethod = "next_button") => {
    goToQuestion(index + 1, navigationMethod);
  };

  const handleShortSubmit = (e: React.KeyboardEvent) => {
    if (e.nativeEvent.isComposing) return; // 한글 조합 중일 때는 동작 방지
    if (e.key === "Enter") {
      goToNext("enter");
    }
  };

  const submitImmediately = () => {
    setIsSubmitDialogOpen(false);
    onQuestionLeave?.(current.id);
    trackCurrentQuestion("submit");
    trackEvent("solve_completed", {
      question_type: toAnalyticsQuestionType(session.type),
    });
    if (!sessionOverride) {
      submitSession(session.id);
    }
    onSubmitted?.(session.id);
  };

  const handleSubmit = () => {
    if (unansweredCount > 0) {
      setIsSubmitDialogOpen(true);
      return;
    }
    submitImmediately();
  };

  const pauseAndReturnToDashboard = () => {
    onQuestionLeave?.(current.id);
    trackCurrentQuestion("pause");
    trackEvent("solve_paused", {
      question_type: toAnalyticsQuestionType(session.type),
    });
    if (sessionOverride) {
      onPaused?.(session.id);
      return;
    }
    navigate(subjectDashboardPath);
  };

  return (
    <div ref={viewportRef} className="cbt-solve-page app-study-page app-focus-page app-page text-stone-900 dark:text-stone-100">
      <header className="cbt-header app-topbar sticky top-0 z-20 border-b">
        <div className="cbt-header-content mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-2 md:px-6">
          <div className="min-w-0">
            <p className="text-[10px] font-medium leading-none text-stone-500 dark:text-stone-400">타이머</p>
            <p className="mt-0.5 text-base font-semibold leading-tight tabular-nums text-red-600 dark:text-red-500">{formatElapsedTime(session.elapsed_time)}</p>
          </div>
          <div className="min-w-0 flex-1 px-2">
            <OverflowTooltipTitle
              text={session.title}
              className="text-center text-xs font-semibold sm:text-sm dark:text-stone-100"
              tooltipClassName="left-1/2 max-w-sm -translate-x-1/2"
            />
          </div>
          <div className="flex w-auto shrink-0 items-center justify-end gap-2">
            <button
              onClick={() => setIsPauseDialogOpen(true)}
              className="app-button-secondary app-study-control whitespace-nowrap rounded-xl px-2.5 py-1.5 text-xs font-semibold sm:px-3 sm:text-sm"
            >
              일시 중단
            </button>
            <button
              onClick={handleSubmit}
              className="app-button-primary app-study-control whitespace-nowrap rounded-xl px-2.5 py-1.5 text-xs font-semibold sm:px-3 sm:text-sm"
            >
              제출 및 종료
            </button>
          </div>
        </div>
      </header>

      <div className="cbt-workspace mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 py-3 md:grid-cols-[minmax(0,1fr)_220px] md:items-start md:px-6">
        <main
          ref={questionPanelRef}
          className={[
            "cbt-question-card app-study-panel app-card flex min-w-0 w-full max-h-full flex-col overflow-hidden rounded-2xl border",
            questionPanelMinHeight,
          ].join(" ")}
        >
          <div className="cbt-question-toolbar shrink-0 p-5 pb-4 md:px-8 md:pt-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="app-study-tag inline-flex rounded-lg border border-stone-200 bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600 dark:border-stone-800 dark:bg-stone-800 dark:text-stone-400">
                {index + 1}번 / 총 {session.total_questions}문항
              </span>
              {current.chapter ? (
                <span className="app-study-tag inline-flex max-w-full rounded-lg border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
                  <span className="truncate">챕터 · {current.chapter}</span>
                </span>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <OmrShortcutButton onClick={() => setIsOmrOpen(true)} expanded={isOmrOpen} className="md:hidden" />
              <button
                onClick={() => {
                  if (showAnswer) {
                    setShowAnswer(false);
                    return;
                  }
                  if (canRevealAnswer) {
                    setShowAnswer(true);
                  } else {
                    const requestedQuestionId = current.id;
                    setIsAnswerRevealLoading(true);
                    void Promise.resolve(onAnswerRevealRequest?.(requestedQuestionId) ?? false)
                      .then((canReveal) => {
                        if (canReveal && activeQuestionIdRef.current === requestedQuestionId) {
                          setShowAnswer(true);
                        }
                      })
                      .catch(() => undefined)
                      .finally(() => {
                        if (activeQuestionIdRef.current === requestedQuestionId) {
                          setIsAnswerRevealLoading(false);
                        }
                      });
                  }
                }}
                disabled={isAnswerRevealLoading}
                aria-expanded={showAnswer}
                aria-label={isAnswerRevealLoading ? "정답과 해설을 불러오는 중" : "?"}
                title={showAnswer ? "정답 숨기기" : "정답/해설 보기"}
                className={[
                  "flex h-8 w-8 items-center justify-center rounded-full border text-sm",
                  showAnswer
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-stone-300 bg-white text-stone-500 hover:border-blue-500 hover:text-blue-500 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-400 dark:hover:border-blue-500 dark:hover:text-blue-500",
                ].join(" ")}
              >
                {isAnswerRevealLoading
                  ? <span className="app-spinner app-spinner-sm" aria-hidden="true" />
                  : "?"}
              </button>
              <button
                onClick={() => {
                  if (sessionOverride) {
                    onBookmarkChange?.(current.id);
                  } else {
                    toggleBookmark(session.id, current.id);
                  }
                }}
                title={current.bookmark ? "책갈피 해제" : "책갈피 추가"}
                aria-pressed={Boolean(current.bookmark)}
                className={[
                  "flex h-8 w-8 items-center justify-center rounded-full border text-sm",
                  current.bookmark
                    ? "border-amber-400 bg-amber-400 text-white"
                    : "border-stone-300 bg-white text-stone-500 hover:border-amber-500 hover:text-amber-500 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-400 dark:hover:border-amber-500 dark:hover:text-amber-500",
                ].join(" ")}
              >
                ★
              </button>
            </div>
          </div>
          </div>
          <div ref={contentRef} className="cbt-question-content min-h-0 flex-auto overflow-y-auto px-5 pb-6 md:px-8">
            <QuestionContentMotion questionKey={`${session.id}:${current.id}`} questionIndex={index}>
              <RichTextContent
                content={current.question}
                className={[
                  "font-semibold dark:text-stone-100",
                  session.type === "5-choice"
                    ? "text-sm leading-6 md:text-base md:leading-7"
                    : "text-base leading-7 md:text-lg md:leading-8",
                ].join(" ")}
              />

              <QuestionPassages boxes={current.boxes} compact={session.type === "5-choice"} />

              <div className="mt-6 space-y-3">
                {session.type === "short" ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-stone-500 dark:text-stone-400">답안 입력</p>
                    <input
                      key={`short-input-${index}`}
                      type="text"
                      value={current.my_answer}
                      onChange={(e) => handleAnswer(e.target.value)}
                      onKeyDown={handleShortSubmit}
                      placeholder="정답을 입력하세요. (Enter를 누르면 다음 문항으로)"
                      className="app-control app-study-control w-full rounded-xl px-4 py-3 text-base"
                      autoFocus
                    />
                  </div>
                ) : (
                  <SolveChoiceList
                    question={current}
                    type={session.type}
                    showAnswer={showAnswer}
                    showNext={index < session.total_questions - 1}
                    onAnswer={handleAnswer}
                    onInlineNext={() => goToNext("inline_next")}
                  />
                )}
              </div>

              {showAnswer && (
                <div className="app-study-answer-panel mt-6 rounded-xl border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900/50 dark:bg-blue-950/20">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="app-study-tag rounded-lg bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white uppercase">
                      정답
                    </span>
                    <span className="text-sm font-bold text-blue-700 dark:text-blue-400">{getQuestionAnswerToken(current)}</span>
                  </div>
                  {hasNoCorrectChoice(current) ? <p className="mb-2 text-sm leading-6 text-blue-700 dark:text-blue-400">이 문항은 답을 고르지 않아도 정답으로 처리됩니다.</p> : null}
                  {current.explanation && (
                    <div className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
                      <p className="mb-1 font-semibold text-stone-900 dark:text-stone-100">해설</p>
                      <LegalReferenceContent content={current.explanation} />
                    </div>
                  )}
                  {current.source && (
                    <p className="mt-3 text-xs text-stone-500 italic dark:text-stone-400">
                      출처: <LegalReferenceContent content={current.source} as="span" plainText />
                    </p>
                  )}
                </div>
              )}
            </QuestionContentMotion>
          </div>

          <div className="cbt-navigation app-study-divider grid shrink-0 grid-cols-2 overflow-hidden border-t">
            <button
              onClick={() => goToQuestion(index - 1, "previous_button")}
              disabled={index === 0}
              className="app-study-navigation-secondary border-r px-4 py-3 text-sm font-bold text-stone-800 shadow-[0_-1px_0_rgba(0,0,0,0.02)] disabled:cursor-not-allowed disabled:opacity-40 dark:text-stone-200"
            >
              <span className="mr-1 text-stone-400 dark:text-stone-400">‹</span>
              이전 문제
            </button>
            <button
              onClick={() => goToNext("next_button")}
              disabled={index >= session.total_questions - 1}
              className="app-button-primary px-4 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40 md:border-l"
            >
              다음 문제
              <span className="ml-1 text-red-200">›</span>
            </button>
          </div>
        </main>

        <aside
          className={[
            "cbt-omr-card app-study-panel app-card hidden min-h-0 flex-col rounded-2xl border p-4 md:flex",
            omrPanelHeightClass,
          ].join(" ")}
        >
          <div className="mb-3 flex shrink-0 items-center justify-between">
            <h3 className="text-sm font-semibold dark:text-stone-100">OMR</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {answeredCount}/{session.total_questions}
            </p>
          </div>
          <StudyOmrTable
            questions={session.questions}
            currentIndex={index}
            mode="solve"
            onSelect={(nextIndex) => goToQuestion(nextIndex, "omr")}
            rowRef={(rowIndex, node) => { omrRefs.set(rowIndex, node); }}
            className="cbt-omr-content min-h-0 flex-1 overflow-y-auto"
          />
          {allowCsvDownload ? (
            <button
              onClick={() => downloadSessionCsv(session)}
              className="app-button-secondary app-study-control mt-4 w-full shrink-0 rounded-xl px-3 py-2 text-xs font-semibold"
            >
              CSV 다운로드
            </button>
          ) : null}
        </aside>
      </div>

      <MobileOmrSheet open={isOmrOpen} onClose={() => setIsOmrOpen(false)}>
        <StudyOmrTable
          questions={session.questions}
          currentIndex={index}
          mode="solve"
          density="comfortable"
          onSelect={(nextIndex) => {
            goToQuestion(nextIndex, "omr");
            setIsOmrOpen(false);
          }}
          className="max-h-[48vh] overflow-y-auto"
        />
      </MobileOmrSheet>

      {isPauseDialogOpen ? (
        <ConfirmDialog
          title="풀이를 일시 중단할까요?"
          description="현재까지 입력한 답과 경과 시간은 저장됩니다. 대시보드에서 이어서 풀 수 있습니다."
          confirmLabel="대시보드로 이동"
          cancelLabel="계속 풀기"
          onCancel={() => setIsPauseDialogOpen(false)}
          onConfirm={pauseAndReturnToDashboard}
        />
      ) : null}

      {isSubmitDialogOpen ? (
        <ConfirmDialog
          title="아직 풀지 않은 문제가 있습니다"
          description={`미응답 문항이 ${unansweredCount}개 남아 있습니다.\n그래도 제출하면 현재 답안 기준으로 채점됩니다.`}
          confirmLabel="제출 및 종료"
          cancelLabel="계속 풀기"
          variant="danger"
          onCancel={() => setIsSubmitDialogOpen(false)}
          onConfirm={submitImmediately}
        />
      ) : null}
    </div>
  );
}
