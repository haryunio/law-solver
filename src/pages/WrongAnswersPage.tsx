import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getAnswerLabel } from "../lib/answer";
import { getWrongQuestions } from "../lib/session";
import { useTestStore } from "../store/useTestStore";

export function WrongAnswersPage() {
  const { sessionId = "" } = useParams();
  const navigate = useNavigate();
  const session = useTestStore((state) => state.sessions.find((item) => item.id === sessionId));
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

  const current = wrongQuestions[index];
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

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-6">
          <h1 className="truncate text-sm font-semibold md:text-base">{session.title} · 오답 노트</h1>
          <Link
            to={`/result/${session.id}`}
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-700"
          >
            결과로
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-4 md:grid-cols-[1fr_220px] md:px-6">
        <main className="rounded-2xl border border-stone-200 bg-white p-5 md:p-8">
          <p className="mb-3 text-xs font-medium text-stone-500">
            오답 {index + 1} / {wrongQuestions.length} · 풀이순번 {solveNo}번
          </p>
          {current.chapter ? (
            <p className="mb-3 inline-flex rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
              챕터 · {current.chapter}
            </p>
          ) : null}
          <h2 className="text-lg font-semibold leading-8 md:text-2xl md:leading-10">{current.question}</h2>

          <div className="mt-6 space-y-3">
            <article className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-xs font-semibold text-red-700">내가 고른 답</p>
              <p className="mt-1 text-sm text-red-700">{getAnswerLabel(current, current.my_answer)}</p>
            </article>
            <article className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-xs font-semibold text-blue-700">실제 정답</p>
              <p className="mt-1 text-sm text-blue-700">{getAnswerLabel(current, current.answer)}</p>
            </article>
            {current.explanation ? (
              <article className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                <p className="text-xs font-semibold text-stone-600">해설</p>
                <p className="mt-1 text-sm text-stone-700">{current.explanation}</p>
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
              이전 오답
            </button>
            <button
              onClick={() => setIndex((prev) => Math.min(wrongQuestions.length - 1, prev + 1))}
              disabled={index === wrongQuestions.length - 1}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              다음 오답
            </button>
          </div>
        </main>

        <aside className="hidden rounded-2xl border border-stone-200 bg-white p-4 md:block">
          <h3 className="mb-3 text-sm font-semibold">오답 번호</h3>
          <div className="grid grid-cols-5 gap-2">
            {wrongQuestions.map((question, qIdx) => (
              <button
                key={question.id}
                onClick={() => setIndex(qIdx)}
                className={[
                  "rounded-md border px-1 py-1.5 text-xs font-semibold",
                  qIdx === index
                    ? "border-red-600 bg-red-600 text-white"
                    : "border-stone-300 bg-white text-stone-700",
                ].join(" ")}
              >
                {solveOrderMap.get(question.id) ?? qIdx + 1}
              </button>
            ))}
          </div>
        </aside>
      </div>

      <button
        onClick={() => setIsSheetOpen(true)}
        className="fixed bottom-5 right-4 z-20 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-lg md:hidden"
      >
        오답 목록
      </button>

      {isSheetOpen ? (
        <div className="fixed inset-0 z-30 md:hidden">
          <button onClick={() => setIsSheetOpen(false)} className="absolute inset-0 bg-black/35" />
          <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl bg-white p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">오답 번호 이동</h3>
              <button onClick={() => setIsSheetOpen(false)} className="text-sm text-stone-500">
                닫기
              </button>
            </div>
            <div className="grid max-h-[48vh] grid-cols-6 gap-2 overflow-y-auto pb-3">
              {wrongQuestions.map((question, qIdx) => (
                <button
                  key={question.id}
                  onClick={() => {
                    setIndex(qIdx);
                    setIsSheetOpen(false);
                  }}
                  className={[
                    "rounded-md border px-2 py-2 text-xs font-semibold",
                    qIdx === index
                      ? "border-red-600 bg-red-600 text-white"
                      : "border-stone-300 bg-white text-stone-700",
                  ].join(" ")}
                >
                  {solveOrderMap.get(question.id) ?? qIdx + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
