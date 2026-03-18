import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getAnswerToken } from "../lib/answer";
import { downloadSessionCsv } from "../lib/csv";
import { getCorrectCount, getWrongQuestions, isCorrectQuestion } from "../lib/session";
import { formatElapsedTime } from "../lib/time";
import { useTestStore } from "../store/useTestStore";
import { ParsedQuestion, SolveOrder } from "../types/test";

export function ResultPage() {
  const { sessionId = "" } = useParams();
  const navigate = useNavigate();
  const session = useTestStore((state) => state.sessions.find((item) => item.id === sessionId));
  const createSession = useTestStore((state) => state.createSession);

  const [isRetryModalOpen, setIsRetryModalOpen] = useState(false);
  const [retryTitle, setRetryTitle] = useState("");
  const [retryOrderMode, setRetryOrderMode] = useState<SolveOrder>("number");

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

  const handleOpenRetry = () => {
    setRetryTitle(`${session.title} (새로 풀기)`);
    setRetryOrderMode(session.order_mode ?? "number");
    setIsRetryModalOpen(true);
  };

  const handleRetrySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!retryTitle.trim()) return;

    // 기존 문제들에서 유저 답안만 초기화
    const resetQuestions: ParsedQuestion[] = session.questions.map((q) => ({
      ...q,
      my_answer: "",
    }));

    const newSessionId = createSession({
      title: retryTitle.trim(),
      type: session.type,
      orderMode: retryOrderMode,
      questions: resetQuestions,
    });

    navigate(`/solve/${newSessionId}`);
  };

  if (session.status !== "completed") {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center">
          <p className="text-stone-700">아직 제출되지 않은 세션입니다.</p>
          <button
            onClick={() => navigate(`/solve/${session.id}`)}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white"
          >
            이어서 풀기
          </button>
        </div>
      </div>
    );
  }

  const correctCount = getCorrectCount(session.questions);
  const wrongCount = getWrongQuestions(session).length;

  return (
    <div className="min-h-screen px-4 py-8 md:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-red-600">채점 결과</p>
          <h1 className="mt-1 text-2xl font-semibold text-stone-900">{session.title}</h1>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
            <article className="rounded-xl border border-stone-200 bg-stone-50 p-4">
              <p className="text-xs text-stone-500">총 소요 시간</p>
              <p className="mt-1 text-lg font-semibold text-stone-900">{formatElapsedTime(session.elapsed_time)}</p>
            </article>
            <article className="rounded-xl border border-stone-200 bg-stone-50 p-4">
              <p className="text-xs text-stone-500">정답률</p>
              <p className="mt-1 text-lg font-semibold text-red-600">{session.score}%</p>
            </article>
            <article className="rounded-xl border border-stone-200 bg-stone-50 p-4">
              <p className="text-xs text-stone-500">정답 개수</p>
              <p className="mt-1 text-lg font-semibold text-stone-900">
                {correctCount} / {session.total_questions}
              </p>
            </article>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              to={`/wrong/${session.id}`}
              className={[
                "rounded-lg px-4 py-2 text-sm font-semibold",
                wrongCount > 0 ? "bg-red-600 text-white" : "bg-stone-200 text-stone-500 pointer-events-none",
              ].join(" ")}
            >
              오답 확인하기
            </Link>
            <button
              onClick={handleOpenRetry}
              className="rounded-lg border border-red-600 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
            >
              새로 풀기
            </button>
            <button
              onClick={() => downloadSessionCsv(session)}
              className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700"
            >
              CSV로 다운로드
            </button>
            <Link
              to="/dashboard"
              className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700"
            >
              메인으로
            </Link>
          </div>

          <div className="mt-6">
            <h2 className="mb-2 text-sm font-semibold text-stone-700">OMR 채점표</h2>
            <div className="overflow-hidden rounded-xl border border-stone-200">
              <div className="grid grid-cols-[1fr_1fr_1fr] border-b border-stone-200 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-600">
                <span>문제번호</span>
                <span>나의 답</span>
                <span>정답</span>
              </div>
              <div className="max-h-[48vh] overflow-y-auto">
                {session.questions.map((question, idx) => {
                  const isCorrect = isCorrectQuestion(question);
                  return (
                    <div
                      key={question.id}
                      className={[
                        "grid grid-cols-[1fr_1fr_1fr] border-b border-stone-100 px-3 py-2 text-sm text-stone-700 last:border-b-0",
                        isCorrect ? "bg-emerald-50" : "bg-red-50",
                      ].join(" ")}
                    >
                      <span>{idx + 1}</span>
                      <span>{getAnswerToken(question.my_answer)}</span>
                      <span>{getAnswerToken(question.answer)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isRetryModalOpen ? (
        <div className="fixed inset-0 z-50">
          <button onClick={() => setIsRetryModalOpen(false)} className="absolute inset-0 bg-black/35" />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2">
            <form
              onSubmit={handleRetrySubmit}
              className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-stone-900">새로 풀기 설정</h2>
                <button
                  type="button"
                  onClick={() => setIsRetryModalOpen(false)}
                  className="text-stone-400 hover:text-stone-600"
                >
                  X
                </button>
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-stone-700">새 세션 제목</span>
                <input
                  autoFocus
                  value={retryTitle}
                  onChange={(e) => setRetryTitle(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none ring-red-200 transition focus:ring-2"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-stone-700">풀이 순서</span>
                <select
                  value={retryOrderMode}
                  onChange={(e) => setRetryOrderMode(e.target.value as SolveOrder)}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none ring-red-200 transition focus:ring-2"
                >
                  <option value="number">번호 순서대로 풀기</option>
                  <option value="chapter-random">챕터별로 무작위 풀기</option>
                  <option value="random">전체 무작위 풀기</option>
                </select>
              </label>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
                >
                  풀이 시작하기
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
