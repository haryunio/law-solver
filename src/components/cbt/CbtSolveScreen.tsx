import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAnswerToken } from "../../lib/answer";
import { downloadSessionCsv } from "../../lib/csv";
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
  const updateAnswer = useTestStore((state) => state.updateAnswer);
  const toggleBookmark = useTestStore((state) => state.toggleBookmark);
  const tickElapsedTime = useTestStore((state) => state.tickElapsedTime);
  const submitSession = useTestStore((state) => state.submitSession);

  const session = useMemo(() => sessions.find((item) => item.id === sessionId), [sessions, sessionId]);

  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isOmrOpen, setIsOmrOpen] = useState(false);
  const omrRefs = useMemo(() => new Map<number, HTMLButtonElement | null>(), []);

  useEffect(() => {
    setShowAnswer(false);
  }, [index]);

  useEffect(() => {
    const activeBtn = omrRefs.get(index);
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: "smooth", block: "nearest" });
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
    return <div className="rounded-xl border border-stone-200 bg-white p-6 text-stone-700">세션을 찾을 수 없습니다.</div>;
  }

  const current = session.questions[index];
  if (!current) {
    return <div className="rounded-xl border border-stone-200 bg-white p-6 text-stone-700">문항 데이터가 없습니다.</div>;
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

  const handleSubmit = () => {
    submitSession(session.id);
    onSubmitted?.(session.id);
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100 transition-colors duration-300">
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/95 backdrop-blur dark:border-stone-800 dark:bg-stone-900/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-6">
          <div className="min-w-0">
            <p className="text-xs font-medium text-stone-500 dark:text-stone-500">타이머</p>
            <p className="text-lg font-semibold tabular-nums text-red-600 dark:text-red-500">{formatElapsedTime(session.elapsed_time)}</p>
          </div>
          <div className="min-w-0 flex-1 px-2">
            <h1 className="truncate text-center text-sm font-semibold md:text-base dark:text-stone-100">{session.title}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => {
                if (window.confirm("풀이를 일시 중단하고 메인으로 나갈까요?")) {
                  navigate("/dashboard");
                }
              }}
              className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
            >
              일시 중단
            </button>
            <button
              onClick={handleSubmit}
              className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
            >
              제출 및 종료
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-4 md:grid-cols-[1fr_220px] md:px-6">
        <main className="max-h-[calc(100vh-140px)] overflow-y-auto rounded-2xl border border-stone-200 bg-white p-5 md:p-8 dark:border-stone-800 dark:bg-stone-900">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="mb-2 text-xs font-medium text-stone-500 dark:text-stone-500">
                {index + 1}번 / 총 {session.total_questions}문항
              </p>
              {current.chapter ? (
                <p className="inline-flex rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
                  챕터 · {current.chapter}
                </p>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAnswer((prev) => !prev)}
                title={showAnswer ? "정답 숨기기" : "정답/해설 보기"}
                className={[
                  "flex h-8 w-8 items-center justify-center rounded-full border text-sm transition",
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
                  "flex h-8 w-8 items-center justify-center rounded-full border text-sm transition",
                  current.bookmark
                    ? "border-amber-400 bg-amber-400 text-white"
                    : "border-stone-300 bg-white text-stone-500 hover:border-amber-500 hover:text-amber-500 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-400 dark:hover:border-amber-500 dark:hover:text-amber-500",
                ].join(" ")}
              >
                ★
              </button>
            </div>
          </div>
          <h2 className="text-base font-semibold leading-7 md:text-lg md:leading-8 dark:text-stone-100">{current.question}</h2>

          {current.boxes && current.boxes.length > 0 && (
            <div className="mt-4 rounded-xl border-2 border-stone-200 bg-stone-50/50 p-4 dark:border-stone-800 dark:bg-stone-900/50">
              <div className="space-y-2">
                {current.boxes.map((box, idx) => {
                  const symbols = ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
                  // 기존에 포함된 "ㄱ.", "ㄴ. " 등의 접두어 제거
                  const cleanBox = box.replace(/^[ㄱ-ㅎ]\.\s*/, "");
                  return (
                    <div key={idx} className="flex gap-2 text-sm md:text-base leading-relaxed">
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
                  className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base outline-none ring-red-200 transition focus:border-red-600 focus:ring-2 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:ring-red-900/50 dark:focus:border-red-600"
                  autoFocus
                />
              </div>
            ) : (
              options.map((option) => {
                const selected = current.my_answer === option.key;
                const isCorrect = showAnswer && String(current.answer) === option.key;

                return (
                  <button
                    key={option.key}
                    onClick={() => handleAnswer(option.key)}
                    className={[
                      "flex w-full items-start gap-2 rounded-xl border px-4 py-3 text-left transition",
                      selected
                        ? "border-red-600 bg-red-50 text-red-700 dark:border-red-600 dark:bg-red-950/30 dark:text-red-400"
                        : isCorrect
                          ? "border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
                          : "border-stone-300 bg-white text-stone-800 hover:border-red-300 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:border-stone-600",
                    ].join(" ")}
                  >
                    {option.circle && (
                      <span className="shrink-0 font-bold">{option.circle}</span>
                    )}
                    <span className="flex-1 font-medium">{option.text}</span>
                    {isCorrect && <span className="ml-auto shrink-0 text-xs font-bold text-blue-600 dark:text-blue-400">정답</span>}
                  </button>
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

          <div className="mt-8 flex items-center gap-2 border-t border-stone-200 pt-4 dark:border-stone-800">
            <button
              onClick={() => setIndex((prev) => Math.max(0, prev - 1))}
              disabled={index === 0}
              className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300"
            >
              이전 문제
            </button>
            <button
              onClick={goToNext}
              disabled={index >= session.total_questions - 1}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40 dark:bg-red-600"
            >
              다음 문제
            </button>

            <span className="ml-auto text-xs font-medium text-stone-500 dark:text-stone-500">
              진행률 {answeredCount}/{session.total_questions}
            </span>
          </div>
        </main>

        <aside className="hidden max-h-[calc(100vh-140px)] flex-col rounded-2xl border border-stone-200 bg-white p-4 md:flex dark:border-stone-800 dark:bg-stone-900">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold dark:text-stone-100">OMR</h3>
            <p className="text-xs text-stone-500 dark:text-stone-500">
              {answeredCount}/{session.total_questions}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto rounded-lg border border-stone-200 dark:border-stone-800">
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
            className="mt-4 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300"
          >
            CSV 다운로드
          </button>
        </aside>
      </div>

      <button
        onClick={() => setIsOmrOpen(true)}
        className="fixed bottom-5 right-4 z-20 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-lg md:hidden dark:bg-red-600"
      >
        OMR 열기
      </button>

      {isOmrOpen ? (
        <div className="fixed inset-0 z-30 md:hidden">
          <button onClick={() => setIsOmrOpen(false)} className="absolute inset-0 bg-black/35 dark:bg-black/60" />
          <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl bg-white p-4 shadow-2xl dark:bg-stone-900">
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
    </div>
  );
}
