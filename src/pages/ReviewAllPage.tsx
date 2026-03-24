import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getAnswerLabel, getAnswerToken } from "../lib/answer";
import { useTestStore } from "../store/useTestStore";

export function ReviewAllPage() {
  const { sessionId = "" } = useParams();
  const navigate = useNavigate();
  const session = useTestStore((state) => state.sessions.find((item) => item.id === sessionId));
  
  const questions = useMemo(() => session?.questions ?? [], [session]);

  const [index, setIndex] = useState(0);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const omrRefs = useMemo(() => new Map<number, HTMLButtonElement | null>(), []);

  useEffect(() => {
    const activeBtn = omrRefs.get(index);
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [index, omrRefs]);

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

  const current = questions[index];
  if (!current) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center">
          <p className="text-stone-700">데이터를 불러오지 못했습니다.</p>
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

  const isCorrect = current.my_answer === current.answer;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-6">
          <h1 className="truncate text-sm font-semibold md:text-base">{session.title} · 모든 문제 확인하기</h1>
          <Link
            to={`/result/${session.id}`}
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-700"
          >
            결과로
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-4 md:grid-cols-[1fr_220px] md:px-6">
        <main className="max-h-[calc(100vh-100px)] overflow-y-auto rounded-2xl border border-stone-200 bg-white p-5 md:p-8">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-medium text-stone-500">
              문제 {index + 1} / {questions.length}
            </p>
            <span
              className={[
                "rounded-full px-2 py-0.5 text-xs font-bold",
                isCorrect ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700",
              ].join(" ")}
            >
              {isCorrect ? "정답" : "오답"}
            </span>
          </div>
          {current.chapter ? (
            <p className="mb-3 inline-flex rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
              챕터 · {current.chapter}
            </p>
          ) : null}
          <h2 className="text-base font-semibold leading-7 md:text-lg md:leading-8">{current.question}</h2>

          <div className="mt-6 space-y-3">
            <article className={[
              "rounded-xl border p-4",
              isCorrect ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"
            ].join(" ")}>
              <p className={["text-xs font-semibold", isCorrect ? "text-emerald-700" : "text-red-700"].join(" ")}>내가 고른 답</p>
              <p className={["mt-1 text-sm", isCorrect ? "text-emerald-700" : "text-red-700"].join(" ")}>{getAnswerLabel(current, current.my_answer)}</p>
            </article>
            {!isCorrect && (
              <article className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <p className="text-xs font-semibold text-blue-700">실제 정답</p>
                <p className="mt-1 text-sm text-blue-700">{getAnswerLabel(current, current.answer)}</p>
              </article>
            )}
            {current.explanation ? (
              <article className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                <p className="text-xs font-semibold text-stone-600">해설</p>
                <p className="mt-1 text-sm text-stone-700 whitespace-pre-wrap">{current.explanation}</p>
              </article>
            ) : null}
            {current.source ? (
              <article className="rounded-xl border border-stone-200 bg-white p-4">
                <p className="text-xs font-semibold text-stone-600">출처</p>
                <p className="mt-1 text-sm text-stone-700">{current.source}</p>
              </article>
            ) : null}
          </div>

          <div className="mt-8 flex flex-wrap gap-2 border-t border-stone-200 pt-4">
            <button
              onClick={() => setIndex((prev) => Math.max(0, prev - 1))}
              disabled={index === 0}
              className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              이전 문제
            </button>
            <button
              onClick={() => setIndex((prev) => Math.min(questions.length - 1, prev + 1))}
              disabled={index === questions.length - 1}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              다음 문제
            </button>
          </div>
        </main>

        <aside className="hidden max-h-[calc(100vh-100px)] flex-col rounded-2xl border border-stone-200 bg-white p-4 md:flex">
          <h3 className="mb-3 text-sm font-semibold">전체 문항 OMR</h3>
          <div className="flex-1 overflow-y-auto rounded-lg border border-stone-200">
            <div className="sticky top-0 z-10 grid grid-cols-[32px_1fr_1fr_8px] border-b border-stone-200 bg-stone-50 px-2 py-1.5 text-[11px] font-semibold text-stone-600">
              <span>번호</span>
              <span className="text-center">내 답</span>
              <span className="text-center">정답</span>
              <span></span>
            </div>
            {questions.map((question, qIdx) => {
              const qIsCorrect = question.my_answer === question.answer;
              return (
                <button
                  key={question.id}
                  ref={(el) => omrRefs.set(qIdx, el)}
                  onClick={() => setIndex(qIdx)}
                  className={[
                    "grid w-full grid-cols-[32px_1fr_1fr_8px] border-b border-stone-200 px-2 py-1.5 text-left text-xs font-semibold last:border-b-0",
                    qIdx === index
                      ? "bg-red-600 text-white"
                      : qIsCorrect
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-50 text-red-700",
                  ].join(" ")}
                >
                  <span>{qIdx + 1}</span>
                  <span className="text-center">{getAnswerToken(question.my_answer)}</span>
                  <span className="text-center">{getAnswerToken(question.answer)}</span>
                  <span className="flex items-center justify-center leading-none">{question.wrong_note?.trim() ? "•" : ""}</span>
                </button>
              );
            })}
          </div>
        </aside>
      </div>

      <button
        onClick={() => setIsSheetOpen(true)}
        className="fixed bottom-5 right-4 z-20 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-lg md:hidden"
      >
        문항 목록
      </button>

      {isSheetOpen ? (
        <div className="fixed inset-0 z-30 md:hidden">
          <button onClick={() => setIsSheetOpen(false)} className="absolute inset-0 bg-black/35" />
          <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl bg-white p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">문항 이동</h3>
              <button onClick={() => setIsSheetOpen(false)} className="text-sm text-stone-500">
                닫기
              </button>
            </div>
            <div className="max-h-[48vh] overflow-y-auto rounded-lg border border-stone-200">
              <div className="grid grid-cols-[32px_1fr_1fr_8px] border-b border-stone-200 bg-stone-50 px-2 py-1.5 text-[11px] font-semibold text-stone-600">
                <span>번호</span>
                <span className="text-center">내 답</span>
                <span className="text-center">정답</span>
                <span></span>
              </div>
              {questions.map((question, qIdx) => {
                const qIsCorrect = question.my_answer === question.answer;
                return (
                  <button
                    key={question.id}
                    onClick={() => {
                      setIndex(qIdx);
                      setIsSheetOpen(false);
                    }}
                    className={[
                      "grid w-full grid-cols-[32px_1fr_1fr_8px] border-b border-stone-200 px-2 py-2 text-left text-xs font-semibold last:border-b-0",
                      qIdx === index
                        ? "bg-red-600 text-white"
                        : qIsCorrect
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700",
                    ].join(" ")}
                  >
                    <span>{qIdx + 1}</span>
                    <span className="text-center">{getAnswerToken(question.my_answer)}</span>
                    <span className="text-center">{getAnswerToken(question.answer)}</span>
                    <span className="flex items-center justify-center leading-none">{question.wrong_note?.trim() ? "•" : ""}</span>
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
