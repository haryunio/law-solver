import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getAnswerLabel, getAnswerToken } from "../lib/answer";
import { getWrongQuestions } from "../lib/session";
import { useTestStore } from "../store/useTestStore";

export function WrongAnswersPage() {
  const { sessionId = "" } = useParams();
  const navigate = useNavigate();
  const session = useTestStore((state) => state.sessions.find((item) => item.id === sessionId));
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
  const omrRefs = useMemo(() => new Map<number, HTMLButtonElement | null>(), []);

  const current = wrongQuestions[index];

  // 문제 변경 시 노트 상태 불러오기
  useEffect(() => {
    if (current) {
      setNote(current.wrong_note || "");
    }
  }, [current]);

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
      <div className="mx-auto max-w-2xl p-6">
        <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center">
          <p className="text-stone-700">세션을 찾을 수 없습니다.</p>
          <Link
            to="/dashboard"
            className="mt-4 inline-block rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white"
          >
            메인으로
          </Link>
        </div>
      </div>
    );
  }

  if (session.status !== "completed") {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center">
          <p className="text-stone-700">채점 완료 후 확인할 수 있습니다.</p>
          <button
            onClick={() => navigate(`/solve/${session.id}`)}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white"
          >
            풀이 화면으로
          </button>
        </div>
      </div>
    );
  }

  if (!wrongQuestions.length) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center">
          <p className="text-stone-700">오답이 없습니다.</p>
          <Link
            to={`/result/${session.id}`}
            className="mt-4 inline-block rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700"
          >
            결과로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center">
          <p className="text-stone-700">오답 데이터를 불러오지 못했습니다.</p>
          <Link
            to={`/result/${session.id}`}
            className="mt-4 inline-block rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700"
          >
            결과로 돌아가기
          </Link>
        </div>
      </div>
    );
  }
  const solveNo = solveOrderMap.get(current.id) ?? index + 1;

  const saveCurrentNote = () => {
    if (session && current) {
      updateWrongNote(session.id, current.id, note);
    }
  };

  const goToResult = () => {
    saveCurrentNote();
    navigate(`/result/${session.id}`);
  };

  const goToPrev = () => {
    saveCurrentNote();
    setIndex((prev) => Math.max(0, prev - 1));
  };

  const goToNext = () => {
    saveCurrentNote();
    setIndex((prev) => Math.min(wrongQuestions.length - 1, prev + 1));
  };

  const goToIndex = (newIndex: number) => {
    saveCurrentNote();
    setIndex(newIndex);
    setIsSheetOpen(false);
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100 transition-colors duration-300">
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/95 backdrop-blur dark:border-stone-800 dark:bg-stone-900/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-6">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-semibold md:text-base dark:text-stone-100" title={session.title}>
              {session.title} · 오답 확인하기
            </h1>
          </div>
          <button
            onClick={goToResult}
            className="shrink-0 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50 transition dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
          >
            결과로
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-4 md:grid-cols-[1fr_220px] md:px-6">
        <main className="max-h-[calc(100vh-100px)] overflow-y-auto rounded-2xl border border-stone-200 bg-white p-5 md:p-8 dark:border-stone-800 dark:bg-stone-900">
          <p className="mb-3 text-xs font-medium text-stone-500 dark:text-stone-500">
            오답 {index + 1} / {wrongQuestions.length} · 풀이순번 {solveNo}번
          </p>
          {current.chapter ? (
            <p className="mb-3 inline-flex rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
              챕터 · {current.chapter}
            </p>
          ) : null}
          <h2 className="text-base font-semibold leading-7 md:text-lg md:leading-8 dark:text-stone-100">{current.question}</h2>

          {current.boxes && current.boxes.length > 0 && (
            <div className="mt-4 rounded-xl border-2 border-stone-200 bg-stone-50/50 p-4 dark:border-stone-800 dark:bg-stone-900/50">
              <div className="space-y-2">
                {current.boxes.map((box, idx) => {
                  const symbols = ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
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
            <article className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/20">
              <p className="text-xs font-semibold text-red-700 dark:text-red-500">내가 고른 답</p>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">{getAnswerLabel(current, current.my_answer)}</p>
            </article>
            <article className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-950/20">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-500">실제 정답</p>
              <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">{getAnswerLabel(current, current.answer)}</p>
            </article>
            {current.explanation ? (
              <article className="rounded-xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950/30">
                <p className="text-xs font-semibold text-stone-600 dark:text-stone-500">해설</p>
                <p className="mt-1 text-sm text-stone-700 whitespace-pre-wrap dark:text-stone-300">{current.explanation}</p>
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
                className="mt-2 min-h-[100px] w-full resize-none rounded-lg border border-stone-200 bg-stone-50 p-3 text-sm text-stone-800 outline-none ring-red-200 transition focus:ring-2 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:ring-red-900/50 dark:focus:ring-2"
              />
            </article>
          </div>

          <div className="mt-8 flex flex-wrap gap-2 border-t border-stone-200 pt-4 dark:border-stone-800">
            <button
              onClick={goToPrev}
              disabled={index === 0}
              className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300"
            >
              이전 오답
            </button>
            <button
              onClick={goToNext}
              disabled={index === wrongQuestions.length - 1}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40 dark:bg-red-600"
            >
              다음 오답
            </button>
          </div>
        </main>

        <aside className="hidden max-h-[calc(100vh-100px)] flex-col rounded-2xl border border-stone-200 bg-white p-4 md:flex dark:border-stone-800 dark:bg-stone-900">
          <h3 className="mb-3 text-sm font-semibold dark:text-stone-100">오답 OMR</h3>
          <div className="flex-1 overflow-y-auto rounded-lg border border-stone-200 dark:border-stone-800">
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
                onClick={() => goToIndex(qIdx)}
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

      <button
        onClick={() => setIsSheetOpen(true)}
        className="fixed bottom-5 right-4 z-20 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-lg md:hidden dark:bg-red-600"
      >
        오답 목록
      </button>

      {isSheetOpen ? (
        <div className="fixed inset-0 z-30 md:hidden">
          <button onClick={() => setIsSheetOpen(false)} className="absolute inset-0 bg-black/35 dark:bg-black/60" />
          <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl bg-white p-4 shadow-2xl dark:bg-stone-900">
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
                  onClick={() => goToIndex(qIdx)}
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
    </div>
  );
}
