import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChoiceReviewList } from "../components/review/ChoiceReviewList";
import { useSessionPageAdapter } from "../components/session/SessionPageContext";
import { AsyncTransitionOverlay } from "../components/ui/AsyncLoading";
import { OverflowTooltipTitle } from "../components/ui/OverflowTooltipTitle";
import { RichTextContent } from "../components/ui/RichTextContent";
import { ReturnLinkLabel } from "../components/ui/ReturnLinkLabel";
import { getAnswerParts, getAnswerToken } from "../lib/answer";
import {
  toAnalyticsQuestionType,
  trackEvent,
} from "../lib/analytics";
import { getWrongQuestions } from "../lib/session";
import { useTestStore } from "../store/useTestStore";

export function WrongAnswersPage() {
  const { sessionId = "" } = useParams();
  const navigate = useNavigate();
  const adapter = useSessionPageAdapter();
  const localSession = useTestStore((state) => state.sessions.find((item) => item.id === sessionId));
  const session = adapter?.session ?? localSession;
  const updateWrongNote = useTestStore((state) => state.updateWrongNote);
  
  const wrongQuestions = useMemo(() => (session ? getWrongQuestions(session) : []), [session]);
  const solveOrderMap = useMemo(
    () =>
      new Map(
        (session?.questions ?? []).map((question, idx) => [question.id, idx + 1]),
      ),
    [session?.questions],
  );

  const [index, setIndex] = useState(0);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [note, setNote] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const trackedReviewSessionRef = useRef<string | null>(null);
  const trackedReviewQuestionIdsRef = useRef(new Set<string>());
  const omrRefs = useMemo(() => new Map<number, HTMLButtonElement | null>(), []);

  const current = wrongQuestions[index];

  useEffect(() => {
    if (!session || session.status !== "completed" || !current) return;

    if (trackedReviewSessionRef.current !== session.id) {
      trackedReviewSessionRef.current = session.id;
      trackedReviewQuestionIdsRef.current.clear();
      trackEvent("review_started", {
        review_type: "wrong",
        question_type: toAnalyticsQuestionType(session.type),
      });
    }

    if (trackedReviewQuestionIdsRef.current.has(current.id)) return;
    trackedReviewQuestionIdsRef.current.add(current.id);
    trackEvent("review_question_viewed", {
      review_type: "wrong",
      question_type: toAnalyticsQuestionType(session.type),
    });
  }, [current, index, session, wrongQuestions.length]);

  // 문제 변경 시 노트 상태 불러오기
  useEffect(() => {
    if (current) {
      setNote(current.wrong_note || "");
    }
  }, [current]);

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 });
  }, [index]);

  useEffect(() => {
    const activeBtn = omrRefs.get(index);
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [index, omrRefs]);

  useEffect(() => {
    if (index > wrongQuestions.length - 1) {
      setIndex(Math.max(0, wrongQuestions.length - 1));
    }
  }, [index, wrongQuestions.length]);

  if (!session) {
    return (
      <div className="app-page p-6">
        <div className="app-card mx-auto max-w-2xl rounded-2xl border p-8 text-center">
          <p className="text-stone-700">문제 세션을 찾을 수 없습니다. 대시보드에서 다시 선택해 주세요.</p>
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
          <p className="text-stone-700">채점 완료 후 확인할 수 있습니다.</p>
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

  if (!wrongQuestions.length) {
    return (
      <div className="app-page p-6">
        <div className="app-card mx-auto max-w-2xl rounded-2xl border p-8 text-center">
          <p className="text-stone-700">오답이 없습니다.</p>
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

  if (!current) {
    return (
      <div className="app-page p-6">
        <div className="app-card mx-auto max-w-2xl rounded-2xl border p-8 text-center">
          <p className="text-stone-700">오답 데이터를 불러오지 못했습니다. 결과 화면에서 다시 열어 주세요.</p>
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
  const solveNo = solveOrderMap.get(current.id) ?? index + 1;

  const saveCurrentNote = async () => {
    if (session && current) {
      if (adapter?.saveWrongNote) {
        if (note === (current.wrong_note || "")) return;
        setIsSavingNote(true);
        try {
          await adapter.saveWrongNote(current.id, note);
        } finally {
          setIsSavingNote(false);
        }
      } else {
        updateWrongNote(session.id, current.id, note);
      }
    }
  };

  const goToResult = async () => {
    await saveCurrentNote();
    navigate(adapter?.resultPath(session.id) ?? `/result/${session.id}`);
  };

  const goToPrev = async () => {
    await saveCurrentNote();
    setIndex((prev) => Math.max(0, prev - 1));
  };

  const goToNext = async () => {
    await saveCurrentNote();
    setIndex((prev) => Math.min(wrongQuestions.length - 1, prev + 1));
  };

  const goToIndex = async (newIndex: number) => {
    await saveCurrentNote();
    setIndex(newIndex);
    setIsSheetOpen(false);
  };

  return (
    <div className="app-focus-page app-page text-stone-900 transition-colors duration-300 dark:text-stone-100">
      <header className="app-topbar sticky top-0 z-20 border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-2 md:px-6">
          <div className="min-w-0 flex-1">
            <OverflowTooltipTitle
              text={`${session.title} · 오답 확인하기`}
              className="text-xs font-semibold sm:text-sm dark:text-stone-100"
            />
          </div>
          <button
            onClick={() => void goToResult()}
            className="app-button-secondary shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold sm:px-3 sm:text-sm"
          >
            <ReturnLinkLabel>결과로</ReturnLinkLabel>
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 py-3 md:grid-cols-[1fr_220px] md:items-start md:px-6">
        <main className="app-card flex w-full max-h-[calc(100vh-112px)] flex-col overflow-hidden rounded-2xl border">
          <div className="shrink-0 p-5 pb-4 md:px-8 md:pt-8">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full border border-stone-200 bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600 dark:border-stone-800 dark:bg-stone-800 dark:text-stone-400">
              오답 {index + 1} / {wrongQuestions.length} · 풀이순번 {solveNo}번
            </span>
            {current.chapter ? (
              <span className="inline-flex max-w-full rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
                <span className="truncate">챕터 · {current.chapter}</span>
              </span>
            ) : null}
          </div>
          </div>
          <div ref={contentRef} className="min-h-0 flex-auto overflow-y-auto px-5 pb-6 md:px-8">
          <RichTextContent
            content={current.question}
            className={[
              "font-semibold dark:text-stone-100",
              current.choices
                ? "text-sm leading-6 md:text-base md:leading-7"
                : "text-base leading-7 md:text-lg md:leading-8",
            ].join(" ")}
          />

          {current.boxes && current.boxes.length > 0 && (
            <div className="mt-4 rounded-xl border-2 border-stone-200 bg-stone-50/50 p-4 dark:border-stone-800 dark:bg-stone-900/50">
              <div className="space-y-2">
                {current.boxes.map((box, idx) => {
                  const symbols = ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
                  const cleanBox = box.replace(/^[ㄱ-ㅎ]\.\s*/, "");
                  return (
                    <div
                      key={idx}
                      className={[
                        "flex gap-2 leading-relaxed",
                        current.choices ? "text-xs md:text-sm" : "text-sm md:text-base",
                      ].join(" ")}
                    >
                      <span className="font-bold shrink-0">{symbols[idx] ?? idx + 1}.</span>
                      <RichTextContent
                        content={cleanBox}
                        className="min-w-0 flex-1 text-stone-800 dark:text-stone-200"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <ChoiceReviewList question={current} />

          <div className="mt-6 space-y-3">
            {!current.choices ? (
              <>
                <article className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/20">
                  <p className="text-xs font-semibold text-red-700 dark:text-red-500">내가 고른 답</p>
                  <div className="mt-1 flex gap-2 text-sm text-red-700 dark:text-red-300">
                    {(() => {
                      const { circle, text } = getAnswerParts(current, current.my_answer);
                      return (
                        <>
                          {circle && <span className="shrink-0 font-bold">{circle}</span>}
                          <span className="flex-1">{text}</span>
                        </>
                      );
                    })()}
                  </div>
                </article>
                <article className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-950/20">
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-500">실제 정답</p>
                  <div className="mt-1 flex gap-2 text-sm text-blue-700 dark:text-blue-300">
                    {(() => {
                      const { circle, text } = getAnswerParts(current, current.answer);
                      return (
                        <>
                          {circle && <span className="shrink-0 font-bold">{circle}</span>}
                          <span className="flex-1">{text}</span>
                        </>
                      );
                    })()}
                  </div>
                </article>
              </>
            ) : null}
            {current.explanation ? (
              <article className="rounded-xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950/30">
                <p className="text-xs font-semibold text-stone-600 dark:text-stone-500">해설</p>
                <RichTextContent
                  content={current.explanation}
                  className="mt-1 text-sm text-stone-700 dark:text-stone-300"
                />
              </article>
            ) : null}
            {current.source ? (
              <article className="rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-800/50">
                <p className="text-xs font-semibold text-stone-600 dark:text-stone-500">출처</p>
                <p className="mt-1 text-sm text-stone-700 dark:text-stone-300">{current.source}</p>
              </article>
            ) : null}

            <article className="rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
              <p className="text-xs font-semibold text-stone-600 dark:text-stone-500">오답 노트</p>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="틀린 이유나 기억해야 할 점을 기록하세요 (페이지 이동 시 자동 저장)"
                className="app-control mt-2 min-h-[100px] w-full resize-none rounded-lg p-3 text-sm"
              />
            </article>
          </div>
          </div>

          <div className="app-focus-page grid shrink-0 grid-cols-[2fr_1fr_2fr] overflow-hidden border-t border-stone-200 md:grid-cols-2 dark:border-stone-800">
            <button
              onClick={() => void goToPrev()}
              disabled={index === 0}
              className="border-r border-stone-200 bg-stone-50 px-4 py-3 text-sm font-bold text-stone-800 shadow-[0_-1px_0_rgba(0,0,0,0.02)] transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-stone-800 dark:bg-stone-950/40 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              <span className="mr-1 text-stone-400 dark:text-stone-500">‹</span>
              이전 오답
            </button>
            <button
              type="button"
              onClick={() => setIsSheetOpen(true)}
              className="border-r border-stone-200 bg-white px-2 py-3 text-xs font-bold text-stone-600 shadow-[0_-1px_0_rgba(0,0,0,0.02)] transition hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 md:hidden"
            >
              OMR
            </button>
            <button
              onClick={() => void goToNext()}
              disabled={index === wrongQuestions.length - 1}
              className="app-button-primary px-4 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40 md:border-l"
            >
              다음 오답
              <span className="ml-1 text-red-200">›</span>
            </button>
          </div>
        </main>

        <aside className="app-card hidden max-h-[calc(100vh-112px)] flex-col rounded-2xl border p-4 md:flex md:self-start">
          <h3 className="mb-3 text-sm font-semibold dark:text-stone-100">오답 OMR</h3>
          <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-stone-200 dark:border-stone-800">
            <div className="sticky top-0 z-10 grid grid-cols-[32px_1fr_1fr_8px] border-b border-stone-200 bg-stone-50 px-2 py-1.5 text-[11px] font-semibold text-stone-600 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-400">
              <span>번호</span>
              <span className="text-center">내 답</span>
              <span className="text-center">정답</span>
              <span></span>
            </div>
            {wrongQuestions.map((question, qIdx) => (
              <button
                key={question.id}
                ref={(el) => omrRefs.set(qIdx, el)}
                onClick={() => void goToIndex(qIdx)}
                className={[
                  "grid w-full grid-cols-[32px_1fr_1fr_8px] border-b border-stone-200 px-2 py-1.5 text-left text-xs font-semibold last:border-b-0 dark:border-stone-800",
                  qIdx === index
                    ? "bg-red-600 text-white"
                    : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400",
                ].join(" ")}
              >
                <span>{solveOrderMap.get(question.id) ?? qIdx + 1}</span>
                <span className="text-center">{getAnswerToken(question.my_answer)}</span>
                <span className="text-center">{getAnswerToken(question.answer)}</span>
                <span className="flex items-center justify-center leading-none">{question.wrong_note?.trim() ? "•" : ""}</span>
              </button>
            ))}
          </div>
        </aside>
      </div>

      {isSheetOpen ? (
        <div className="fixed inset-0 z-30 md:hidden">
          <button onClick={() => setIsSheetOpen(false)} className="app-modal-backdrop absolute inset-0" />
          <div className="app-modal-surface absolute bottom-0 left-0 right-0 rounded-t-2xl border-t p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold dark:text-stone-100">오답 OMR 이동</h3>
              <button onClick={() => setIsSheetOpen(false)} className="text-sm text-stone-500 dark:text-stone-400">
                닫기
              </button>
            </div>
            <div className="max-h-[48vh] overflow-y-auto rounded-lg border border-stone-200 dark:border-stone-800">
              <div className="grid grid-cols-[32px_1fr_1fr_8px] border-b border-stone-200 bg-stone-50 px-2 py-1.5 text-[11px] font-semibold text-stone-600 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-400">
                <span>번호</span>
                <span className="text-center">내 답</span>
                <span className="text-center">정답</span>
                <span></span>
              </div>
              {wrongQuestions.map((question, qIdx) => (
                <button
                  key={question.id}
                  onClick={() => void goToIndex(qIdx)}
                  className={[
                    "grid w-full grid-cols-[32px_1fr_1fr_8px] border-b border-stone-200 px-2 py-2 text-left text-xs font-semibold last:border-b-0 dark:border-stone-800",
                    qIdx === index
                      ? "bg-red-600 text-white"
                      : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400",
                  ].join(" ")}
                >
                  <span>{solveOrderMap.get(question.id) ?? qIdx + 1}</span>
                  <span className="text-center">{getAnswerToken(question.my_answer)}</span>
                  <span className="text-center">{getAnswerToken(question.answer)}</span>
                  <span className="flex items-center justify-center leading-none">{question.wrong_note?.trim() ? "•" : ""}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {isSavingNote ? <AsyncTransitionOverlay label="오답 노트를 저장하는 중입니다" /> : null}
    </div>
  );
}
