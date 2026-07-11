import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { OverflowTooltipTitle } from "../ui/OverflowTooltipTitle";
import { getAnswerToken } from "../../lib/answer";
import { downloadSessionCsv } from "../../lib/csv";
import { getSubjectDashboardPath } from "../../lib/subject";
import { formatElapsedTime } from "../../lib/time";
import { useTestStore } from "../../store/useTestStore";
import { AnswerValue } from "../../types/test";

interface CbtSolveScreenProps {
  sessionId: string;
  onSubmitted?: (sessionId: string) => void;
}

export function CbtSolveScreen({ sessionId, onSubmitted }: CbtSolveScreenProps) {
  const navigate = useNavigate();
  const sessions = useTestStore((state) => state.sessions);
  const sessionSubjectMap = useTestStore((state) => state.sessionSubjectMap);
  const updateAnswer = useTestStore((state) => state.updateAnswer);
  const toggleBookmark = useTestStore((state) => state.toggleBookmark);
  const tickElapsedTime = useTestStore((state) => state.tickElapsedTime);
  const submitSession = useTestStore((state) => state.submitSession);

  const session = useMemo(() => sessions.find((item) => item.id === sessionId), [sessions, sessionId]);

  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isOmrOpen, setIsOmrOpen] = useState(false);
  const [isPauseDialogOpen, setIsPauseDialogOpen] = useState(false);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const omrRefs = useMemo(() => new Map<number, HTMLButtonElement | null>(), []);

  useEffect(() => {
    setShowAnswer(false);
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
    const timer = window.setInterval(() => tickElapsedTime(sessionId), 1000);
    return () => window.clearInterval(timer);
  }, [session?.status, sessionId, tickElapsedTime]);

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
          세션을 찾을 수 없습니다.
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

  const CIRCLED_NUMBERS = ["①", "②", "③", "④", "⑤"];

  const options =
    session.type === "OX"
      ? [
          { key: "O", circle: null, text: "O" },
          { key: "X", circle: null, text: "X" },
        ]
      : (current.choices ?? []).map((choice, idx) => ({
          key: String(idx + 1),
          circle: CIRCLED_NUMBERS[idx] ?? String(idx + 1),
          text: choice,
        }));

  const answeredCount = session.questions.filter((q) => q.my_answer !== "").length;
  const unansweredCount = session.questions.length - answeredCount;
  const subjectDashboardPath = getSubjectDashboardPath(sessionSubjectMap[session.id]);
  const questionPanelMinHeight =
    session.type === "OX"
      ? "md:min-h-[min(420px,calc(100vh-112px))]"
      : session.type === "short"
        ? "md:min-h-[min(360px,calc(100vh-112px))]"
        : "md:min-h-[min(560px,calc(100vh-112px))]";
  const omrPanelHeightClass =
    session.type === "5-choice"
      ? "md:h-auto md:max-h-[calc(100vh-112px)] md:self-start"
      : "md:h-[calc(100vh-112px)] md:max-h-[calc(100vh-112px)]";

  const handleAnswer = (answer: string) => {
    updateAnswer(session.id, current.id, answer as AnswerValue);
  };

  const goToNext = () => {
    setIndex((prev) => Math.min(session.total_questions - 1, prev + 1));
  };

  const handleShortSubmit = (e: React.KeyboardEvent) => {
    if (e.nativeEvent.isComposing) return; // 한글 조합 중일 때는 동작 방지
    if (e.key === "Enter") {
      goToNext();
    }
  };

  const submitImmediately = () => {
    setIsSubmitDialogOpen(false);
    submitSession(session.id);
    onSubmitted?.(session.id);
  };

  const handleSubmit = () => {
    if (unansweredCount > 0) {
      setIsSubmitDialogOpen(true);
      return;
    }
    submitImmediately();
  };

  return (
    <div className="app-focus-page app-page text-stone-900 dark:text-stone-100">
      <header className="app-topbar sticky top-0 z-20 border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-2 md:px-6">
          <div className="min-w-0">
            <p className="text-[10px] font-medium leading-none text-stone-500 dark:text-stone-500">타이머</p>
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
              className="app-button-secondary whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold sm:px-3 sm:text-sm"
            >
              일시 중단
            </button>
            <button
              onClick={handleSubmit}
              className="app-button-primary whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold sm:px-3 sm:text-sm"
            >
              제출 및 종료
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 py-3 md:grid-cols-[1fr_220px] md:items-start md:px-6">
        <main
          className={[
            "app-card flex w-full max-h-[calc(100vh-112px)] flex-col overflow-hidden rounded-2xl border",
            questionPanelMinHeight,
          ].join(" ")}
        >
          <div className="shrink-0 p-5 pb-4 md:px-8 md:pt-8">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="inline-flex rounded-full border border-stone-200 bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600 dark:border-stone-800 dark:bg-stone-800 dark:text-stone-400">
                {index + 1}번 / 총 {session.total_questions}문항
              </span>
              {current.chapter ? (
                <span className="inline-flex max-w-full rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
                  <span className="truncate">챕터 · {current.chapter}</span>
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAnswer((prev) => !prev)}
                title={showAnswer ? "정답 숨기기" : "정답/해설 보기"}
                className={[
                  "flex h-8 w-8 items-center justify-center rounded-full border text-sm",
                  showAnswer
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-stone-300 bg-white text-stone-500 hover:border-blue-500 hover:text-blue-500 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-400 dark:hover:border-blue-500 dark:hover:text-blue-500",
                ].join(" ")}
              >
                ?
              </button>
              <button
                onClick={() => toggleBookmark(session.id, current.id)}
                title={current.bookmark ? "책갈피 해제" : "책갈피 추가"}
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
          <div ref={contentRef} className="min-h-0 flex-auto overflow-y-auto px-5 pb-6 md:px-8">
          <h2
            className={[
              "font-semibold dark:text-stone-100",
              session.type === "5-choice"
                ? "text-sm leading-6 md:text-base md:leading-7"
                : "text-base leading-7 md:text-lg md:leading-8",
            ].join(" ")}
          >
            {current.question}
          </h2>

          {current.boxes && current.boxes.length > 0 && (
            <div className="mt-4 rounded-xl border-2 border-stone-200 bg-stone-50/50 p-4 dark:border-stone-800 dark:bg-stone-900/50">
              <div className="space-y-2">
                {current.boxes.map((box, idx) => {
                  const symbols = ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
                  // 기존에 포함된 "ㄱ.", "ㄴ. " 등의 접두어 제거
                  const cleanBox = box.replace(/^[ㄱ-ㅎ]\.\s*/, "");
                  return (
                    <div
                      key={idx}
                      className={[
                        "flex gap-2 leading-relaxed",
                        session.type === "5-choice" ? "text-xs md:text-sm" : "text-sm md:text-base",
                      ].join(" ")}
                    >
                      <span className="font-bold shrink-0">{symbols[idx] ?? idx + 1}.</span>
                      <span className="text-stone-800 dark:text-stone-200">{cleanBox}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-6 space-y-3">
            {session.type === "short" ? (
              <div className="space-y-2">
                <p className="text-xs font-medium text-stone-500 dark:text-stone-500">답안 입력</p>
                <input
                  key={`short-input-${index}`}
                  type="text"
                  value={current.my_answer}
                  onChange={(e) => handleAnswer(e.target.value)}
                  onKeyDown={handleShortSubmit}
                  placeholder="정답을 입력하세요. (Enter를 누르면 다음 문항으로)"
                  className="app-control w-full rounded-xl px-4 py-3 text-base"
                  autoFocus
                />
              </div>
            ) : (
              options.map((option) => {
                const selected = current.my_answer === option.key;
                const isCorrect = showAnswer && String(current.answer) === option.key;
                const showInlineNext =
                  session.type === "OX" && selected && !showAnswer && index < session.total_questions - 1;

                return (
                  <div key={option.key} className="relative">
                    <button
                      onClick={() => handleAnswer(option.key)}
                      className={[
                        "flex w-full items-start gap-2 rounded-xl border px-4 py-3 text-left",
                        showInlineNext ? "pr-32 md:pr-36" : "",
                        session.type === "5-choice" ? "text-sm md:text-sm" : "text-base",
                        isCorrect
                          ? "border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
                          : selected
                            ? "border-red-600 bg-red-50 text-red-700 dark:border-red-600 dark:bg-red-950/30 dark:text-red-400"
                            : "border-stone-300 bg-white text-stone-800 hover:border-red-300 hover:bg-red-50/40 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:border-red-900/70 dark:hover:bg-red-950/15",
                      ].join(" ")}
                    >
                      {option.circle && (
                        <span className="shrink-0 font-bold">{option.circle}</span>
                      )}
                      <span className="flex-1 font-medium">{option.text}</span>
                      {isCorrect && !showInlineNext && (
                        <span className="ml-auto shrink-0 text-xs font-bold text-blue-600 dark:text-blue-400">정답</span>
                      )}
                    </button>
                    {showInlineNext ? (
                      <button
                        type="button"
                        onClick={goToNext}
                        className="app-button-primary app-inline-next absolute bottom-2 right-2 top-2 inline-flex items-center rounded-lg px-3 text-xs font-bold"
                      >
                        다음 문제로
                        <span className="ml-1 text-red-200">›</span>
                      </button>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>

          {showAnswer && (
            <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900/50 dark:bg-blue-950/20">
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white uppercase">
                  정답
                </span>
                <span className="text-sm font-bold text-blue-700 dark:text-blue-400">{getAnswerToken(String(current.answer))}</span>
              </div>
              {current.explanation && (
                <div className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
                  <p className="mb-1 font-semibold text-stone-900 dark:text-stone-100">해설</p>
                  <p>{current.explanation}</p>
                </div>
              )}
              {current.source && (
                <p className="mt-3 text-xs text-stone-500 italic dark:text-stone-500">출처: {current.source}</p>
              )}
            </div>
          )}
          </div>

          <div className="grid shrink-0 grid-cols-[2fr_1fr_2fr] overflow-hidden border-t border-stone-200 md:grid-cols-2 dark:border-stone-800">
            <button
              onClick={() => setIndex((prev) => Math.max(0, prev - 1))}
              disabled={index === 0}
              className="border-r border-stone-200 bg-stone-50 px-4 py-3 text-sm font-bold text-stone-800 shadow-[0_-1px_0_rgba(0,0,0,0.02)] hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-stone-800 dark:bg-stone-950/40 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              <span className="mr-1 text-stone-400 dark:text-stone-500">‹</span>
              이전 문제
            </button>
            <button
              type="button"
              onClick={() => setIsOmrOpen(true)}
              className="border-r border-stone-200 bg-white px-2 py-3 text-xs font-bold text-stone-600 shadow-[0_-1px_0_rgba(0,0,0,0.02)] hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 md:hidden"
            >
              OMR
            </button>
            <button
              onClick={goToNext}
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
            "app-card hidden flex-col rounded-2xl border p-4 md:flex",
            omrPanelHeightClass,
          ].join(" ")}
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold dark:text-stone-100">OMR</h3>
            <p className="text-xs text-stone-500 dark:text-stone-500">
              {answeredCount}/{session.total_questions}
            </p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-stone-200 dark:border-stone-800">
            <div className="sticky top-0 z-10 grid grid-cols-[32px_1fr_1fr_16px] border-b border-stone-200 bg-stone-50 px-2 py-1.5 text-[11px] font-semibold text-stone-600 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-400">
              <span>번호</span>
              <span>내 답</span>
              <span></span>
            </div>
            {session.questions.map((question, qIndex) => {
              const isCurrent = qIndex === index;
              const isAnswered = question.my_answer !== "";
              return (
                <button
                  key={question.id}
                  ref={(el) => omrRefs.set(qIndex, el)}
                  onClick={() => setIndex(qIndex)}
                  className={[
                    "grid w-full grid-cols-[32px_1fr_1fr_16px] border-b border-stone-200 px-2 py-1.5 text-left text-xs font-semibold last:border-b-0 dark:border-stone-800",
                    isCurrent
                      ? "bg-red-600 text-white"
                      : isAnswered
                        ? "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
                        : "bg-white text-stone-700 dark:bg-stone-900 dark:text-stone-400",
                  ].join(" ")}
                >
                  <span>{qIndex + 1}</span>
                  <span className="truncate">{getAnswerToken(question.my_answer)}</span>
                  <span className="flex items-center justify-center text-[10px] text-amber-500 dark:text-amber-500/80">
                    {question.bookmark ? "★" : ""}
                  </span>
                </button>
              );
            })}
          </div>
          <button
            onClick={() => downloadSessionCsv(session)}
            className="app-button-secondary mt-4 w-full rounded-lg px-3 py-2 text-xs font-semibold"
          >
            CSV 다운로드
          </button>
        </aside>
      </div>

      {isOmrOpen ? (
        <div className="fixed inset-0 z-30 md:hidden">
          <button onClick={() => setIsOmrOpen(false)} className="app-modal-backdrop absolute inset-0" />
          <div className="app-modal-surface absolute bottom-0 left-0 right-0 rounded-t-2xl border-t p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold dark:text-stone-100">OMR 빠른 이동</h3>
              <button onClick={() => setIsOmrOpen(false)} className="text-sm text-stone-500 dark:text-stone-400">
                닫기
              </button>
            </div>
            <div className="max-h-[48vh] overflow-y-auto rounded-lg border border-stone-200 dark:border-stone-800">
              <div className="grid grid-cols-[32px_1fr_1fr_16px] border-b border-stone-200 bg-stone-50 px-2 py-1.5 text-[11px] font-semibold text-stone-600 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-400">
                <span>번호</span>
                <span>내 답</span>
                <span></span>
              </div>
              {session.questions.map((question, qIndex) => {
                const isCurrent = qIndex === index;
                const isAnswered = question.my_answer !== "";
                return (
                  <button
                    key={question.id}
                    onClick={() => {
                      setIndex(qIndex);
                      setIsOmrOpen(false);
                    }}
                    className={[
                      "grid w-full grid-cols-[32px_1fr_1fr_16px] border-b border-stone-200 px-2 py-2 text-left text-xs font-semibold last:border-b-0 dark:border-stone-800",
                      isCurrent
                        ? "bg-red-600 text-white"
                        : isAnswered
                          ? "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
                          : "bg-white text-stone-700 dark:bg-stone-900 dark:text-stone-400",
                    ].join(" ")}
                  >
                    <span>{qIndex + 1}</span>
                    <span className="truncate">{getAnswerToken(question.my_answer)}</span>
                    <span className="flex items-center justify-center text-[10px] text-amber-500 dark:text-amber-500/80">
                      {question.bookmark ? "★" : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {isPauseDialogOpen ? (
        <ConfirmDialog
          title="풀이를 일시 중단할까요?"
          description="현재까지 입력한 답과 경과 시간은 저장됩니다. 대시보드에서 이어서 풀 수 있습니다."
          confirmLabel="대시보드로 이동"
          cancelLabel="계속 풀기"
          onCancel={() => setIsPauseDialogOpen(false)}
          onConfirm={() => navigate(subjectDashboardPath)}
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
