import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { IconCloseButton } from "../components/ui/IconCloseButton";
import { OverflowTooltipTitle } from "../components/ui/OverflowTooltipTitle";
import { ReturnLinkLabel } from "../components/ui/ReturnLinkLabel";
import { getAnswerToken } from "../lib/answer";
import {
  buildSessionExportCsv,
  buildWrongNoteCsv,
  buildWrongQuestionsOnlyCsv,
  downloadCsvFile,
} from "../lib/csv";
import { getCorrectCount, getWrongQuestions, isCorrectQuestion } from "../lib/session";
import { getSubjectDashboardPath } from "../lib/subject";
import { formatElapsedTime } from "../lib/time";
import { useTestStore } from "../store/useTestStore";
import { ParsedQuestion, SolveOrder } from "../types/test";

type ResultTab = "omr" | "chapter";

const resultTypeLabel = {
  OX: "OX",
  "5-choice": "5지선다",
  short: "단답형",
} as const;

const resultTypeStyle = {
  OX: "border-blue-100 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-400",
  "5-choice":
    "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400",
  short:
    "border-purple-100 bg-purple-50 text-purple-700 dark:border-purple-900/50 dark:bg-purple-950/30 dark:text-purple-400",
} as const;

const resultOrderModeLabel = {
  number: "번호 순서",
  "chapter-random": "챕터별 랜덤",
  random: "전체 랜덤",
} as const;

export function ResultPage() {
  const { sessionId = "" } = useParams();
  const navigate = useNavigate();
  const session = useTestStore((state) => state.sessions.find((item) => item.id === sessionId));
  const sessionSubjectMap = useTestStore((state) => state.sessionSubjectMap);
  const createSession = useTestStore((state) => state.createSession);

  const [isRetryModalOpen, setIsRetryModalOpen] = useState(false);
  const [isWrongRetryModalOpen, setIsWrongRetryModalOpen] = useState(false);
  const [isBookmarkRetryModalOpen, setIsBookmarkRetryModalOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [retryTitle, setRetryTitle] = useState("");
  const [retryOrderMode, setRetryOrderMode] = useState<SolveOrder>("number");
  const [resultTab, setResultTab] = useState<ResultTab>("omr");

  if (!session) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center dark:border-stone-800 dark:bg-stone-900">
          <p className="text-stone-700 dark:text-stone-300">세션을 찾을 수 없습니다.</p>
          <Link
            to="/dashboard"
            className="mt-4 inline-flex rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white"
          >
            <ReturnLinkLabel variant="solid">메인으로</ReturnLinkLabel>
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

  const handleOpenWrongRetry = () => {
    setRetryTitle(`${session.title} (오답 풀기)`);
    setRetryOrderMode("number");
    setIsWrongRetryModalOpen(true);
  };

  const handleOpenBookmarkRetry = () => {
    setRetryTitle(`${session.title} (책갈피 문제 풀기)`);
    setRetryOrderMode("number");
    setIsBookmarkRetryModalOpen(true);
  };

  const handleRetrySubmit = (
    e: React.FormEvent,
    options: { onlyWrong?: boolean; onlyBookmark?: boolean } = {},
  ) => {
    e.preventDefault();
    if (!retryTitle.trim()) return;

    let sourceQuestions = session.questions;
    if (options.onlyWrong) {
      sourceQuestions = getWrongQuestions(session);
    } else if (options.onlyBookmark) {
      sourceQuestions = session.questions.filter((q) => q.bookmark);
    }

    const resetQuestions: ParsedQuestion[] = sourceQuestions.map((q) => ({
      ...q,
      my_answer: "",
      wrong_note: "", // 새 풀이에서는 오답 노트를 비움
      bookmark: false, // 새 풀이에서는 책갈피를 비움
    }));

    const newSessionId = createSession({
      title: retryTitle.trim(),
      type: session.type,
      orderMode: retryOrderMode,
      questions: resetQuestions,
      subjectId: sessionSubjectMap[session.id] ?? null,
    });

    navigate(`/solve/${newSessionId}`);
  };

  const handleDownloadAll = () => {
    const csv = buildSessionExportCsv(session);
    downloadCsvFile(csv, `${session.title.replace(/\s+/g, "_")}_전체_결과.csv`);
    setIsDownloadModalOpen(false);
  };

  const handleDownloadWrongOnly = () => {
    const csv = buildWrongQuestionsOnlyCsv(session);
    downloadCsvFile(csv, `${session.title.replace(/\s+/g, "_")}_오답_결과.csv`);
    setIsDownloadModalOpen(false);
  };

  const handleDownloadWrongNote = () => {
    const csv = buildWrongNoteCsv(session);
    downloadCsvFile(csv, `${session.title.replace(/\s+/g, "_")}_오답_노트.csv`);
    setIsDownloadModalOpen(false);
  };

  if (session.status !== "completed") {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center dark:border-stone-800 dark:bg-stone-900">
          <p className="text-stone-700 dark:text-stone-300">아직 제출되지 않은 세션입니다.</p>
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
  const unansweredCount = session.questions.filter((q) => !q.my_answer).length;
  const bookmarkCount = session.questions.filter((q) => q.bookmark).length;
  const averageSecondsPerQuestion =
    session.total_questions > 0
      ? Math.round(session.elapsed_time / session.total_questions)
      : 0;
  const subjectDashboardPath = getSubjectDashboardPath(sessionSubjectMap[session.id]);
  const chapterStats = Array.from(
    session.questions.reduce(
      (acc, question) => {
        const chapter = question.chapter?.trim();
        if (!chapter) return acc;

        const current = acc.get(chapter) ?? {
          chapter,
          total: 0,
          correct: 0,
          wrong: 0,
          unanswered: 0,
        };

        const isCorrect = isCorrectQuestion(question);
        current.total += 1;
        current.correct += isCorrect ? 1 : 0;
        current.wrong += isCorrect ? 0 : 1;
        current.unanswered += question.my_answer ? 0 : 1;
        acc.set(chapter, current);
        return acc;
      },
      new Map<
        string,
        {
          chapter: string;
          total: number;
          correct: number;
          wrong: number;
          unanswered: number;
        }
      >(),
    ).values(),
  );

  return (
    <div className="min-h-screen px-4 py-7 transition-colors duration-300 md:px-6 md:py-8 dark:bg-stone-950">
      <div className="mx-auto max-w-3xl space-y-4">
        <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-red-600 dark:text-red-500">채점 결과</p>
                <span
                  className={[
                    "rounded-full border px-2.5 py-0.5 text-[11px] font-bold",
                    resultTypeStyle[session.type],
                  ].join(" ")}
                >
                  {resultTypeLabel[session.type]}
                </span>
                <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-0.5 text-[11px] font-bold text-stone-600 dark:border-stone-700 dark:bg-stone-950/40 dark:text-stone-300">
                  {resultOrderModeLabel[session.order_mode ?? "number"]}
                </span>
              </div>
              <div className="mt-1 min-w-0">
                <OverflowTooltipTitle
                  text={session.title}
                  className="text-xl font-bold leading-tight text-stone-900 md:text-2xl dark:text-stone-100"
                  tooltipClassName="max-w-md"
                />
              </div>
            </div>
            <Link
              to={subjectDashboardPath}
              className="shrink-0 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-600 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-400 dark:hover:bg-stone-700"
            >
              <ReturnLinkLabel>메인으로</ReturnLinkLabel>
            </Link>
          </div>

          <div className="mt-4 grid gap-2 md:grid-cols-4">
            <article className="rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 dark:border-red-900/50 dark:bg-red-950/20">
              <p className="text-[11px] font-medium text-red-700 dark:text-red-400">정답률</p>
              <p className="mt-0.5 text-2xl font-black tracking-tight text-red-600 dark:text-red-500">
                {session.score}%
              </p>
            </article>
            <article className="rounded-xl bg-stone-50 px-3 py-2.5 dark:bg-stone-950/40">
              <p className="text-[11px] font-medium text-stone-500 dark:text-stone-500">시간</p>
              <p className="mt-0.5 text-sm font-bold text-stone-900 dark:text-stone-100">
                {formatElapsedTime(session.elapsed_time)}
              </p>
              <p className="mt-0.5 text-[10px] font-light text-stone-400 dark:text-stone-500">
                문제당 {formatElapsedTime(averageSecondsPerQuestion)}
              </p>
            </article>
            <article className="rounded-xl bg-stone-50 px-3 py-2.5 dark:bg-stone-950/40">
              <p className="text-[11px] font-medium text-stone-500 dark:text-stone-500">정답 / 전체</p>
              <p className="mt-0.5 text-sm font-bold text-stone-900 dark:text-stone-100">
                {correctCount} / {session.total_questions}
              </p>
              <p className="mt-0.5 text-[10px] text-stone-400 dark:text-stone-500">오답 {wrongCount}개</p>
            </article>
            <article className="rounded-xl bg-stone-50 px-3 py-2.5 dark:bg-stone-950/40">
              <p className="text-[11px] font-medium text-stone-500 dark:text-stone-500">미응답 / 책갈피</p>
              <p className="mt-0.5 text-sm font-bold text-stone-900 dark:text-stone-100">
                {unansweredCount} / {bookmarkCount}
              </p>
              <p className="mt-0.5 text-[10px] text-stone-400 dark:text-stone-500">복기 대상</p>
            </article>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            <section className="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950/40">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-stone-400 dark:text-stone-500">
                확인하기
              </p>
              <div className="grid gap-2">
                <Link
                  to={`/wrong/${session.id}`}
                  className={[
                    "rounded-lg border px-3 py-2 text-sm font-bold transition",
                    wrongCount > 0
                      ? "border-red-600 bg-red-600 text-white shadow-sm hover:bg-red-700 dark:border-red-600 dark:bg-red-600 dark:hover:bg-red-700"
                      : "pointer-events-none border-stone-200 bg-white text-stone-400 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-600",
                  ].join(" ")}
                >
                  오답 확인하기
                  <span className="ml-1 text-xs font-medium opacity-70">({wrongCount})</span>
                </Link>
                <Link
                  to={`/review/${session.id}`}
                  className="rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm font-bold text-orange-700 transition hover:bg-orange-50 dark:border-orange-900/50 dark:bg-stone-900 dark:text-orange-400 dark:hover:bg-orange-950/25"
                >
                  모든 문제 확인하기
                  <span className="ml-1 text-xs font-medium opacity-70">({session.total_questions})</span>
                </Link>
                <Link
                  to={`/review/${session.id}?onlyBookmarks=true`}
                  className={[
                    "rounded-lg border px-3 py-2 text-sm font-bold transition",
                    bookmarkCount > 0
                      ? "border-amber-200 bg-white text-amber-700 hover:bg-amber-50 dark:border-amber-900/50 dark:bg-stone-900 dark:text-amber-400 dark:hover:bg-amber-950/25"
                      : "pointer-events-none border-stone-200 bg-white text-stone-400 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-600",
                  ].join(" ")}
                >
                  책갈피 확인하기
                  <span className="ml-1 text-xs font-medium opacity-70">({bookmarkCount})</span>
                </Link>
              </div>
            </section>

            <section className="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950/40">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-stone-400 dark:text-stone-500">
                다시 풀기
              </p>
              <div className="grid gap-2">
                <button
                  onClick={handleOpenWrongRetry}
                  disabled={wrongCount === 0}
                  className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-left text-sm font-bold text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800"
                >
                  오답 풀기
                </button>
                <button
                  onClick={handleOpenRetry}
                  className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-left text-sm font-bold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800"
                >
                  모든 문제 새로 풀기
                </button>
                <button
                  onClick={handleOpenBookmarkRetry}
                  disabled={bookmarkCount === 0}
                  className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-left text-sm font-bold text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800"
                >
                  책갈피 문제 풀기
                </button>
              </div>
            </section>

            <section className="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950/40">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-stone-400 dark:text-stone-500">
                기타 작업
              </p>
              <div className="grid gap-2">
                <button
                  onClick={() => setIsDownloadModalOpen(true)}
                  className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-left text-sm font-bold text-stone-700 transition hover:bg-orange-50 hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-orange-950/25 dark:hover:text-orange-400"
                >
                  CSV로 다운로드
                </button>
              </div>
            </section>
          </div>
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm md:p-5 dark:border-stone-800 dark:bg-stone-900">
          <div className="mb-4 flex rounded-xl border border-stone-200 bg-stone-50 p-1 dark:border-stone-800 dark:bg-stone-950">
            {[
              ["omr", "OMR 채점표"],
              ["chapter", "파트별 분석"],
            ].map(([tab, label]) => (
              <button
                key={tab}
                type="button"
                onClick={() => setResultTab(tab as ResultTab)}
                className={[
                  "flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition",
                  resultTab === tab
                    ? "bg-white text-red-600 shadow-sm dark:bg-stone-900 dark:text-red-500"
                    : "text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>

          {resultTab === "omr" ? (
            <div className="overflow-hidden rounded-xl border border-stone-200 dark:border-stone-800">
              <div className="grid grid-cols-[1fr_1fr_1fr] border-b border-stone-200 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-600 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-400">
                <span>문제번호</span>
                <span>나의 답</span>
                <span>정답</span>
              </div>
              <div className="max-h-[64vh] overflow-y-auto">
                {session.questions.map((question, idx) => {
                  const isCorrect = isCorrectQuestion(question);
                  return (
                    <div
                      key={question.id}
                      className={[
                        "grid grid-cols-[1fr_1fr_1fr] border-b border-stone-100 px-3 py-2 text-sm text-stone-700 last:border-b-0 dark:border-stone-800/50",
                        isCorrect
                          ? "bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400"
                          : "bg-red-50 dark:bg-red-950/20 dark:text-red-400",
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
          ) : (
            <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-800">
              {chapterStats.length > 0 ? (
                <div className="min-w-[38rem]">
                  <div className="grid grid-cols-[minmax(0,1.7fr)_0.7fr_0.7fr_0.7fr_0.7fr_0.8fr] gap-2 border-b border-stone-200 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-600 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-400">
                    <span>파트</span>
                    <span className="text-right">문제수</span>
                    <span className="text-right">정답</span>
                    <span className="text-right">오답</span>
                    <span className="text-right">미응답</span>
                    <span className="text-right">정답률</span>
                  </div>
                  <div className="max-h-[64vh] overflow-y-auto">
                    {chapterStats.map((stat) => {
                      const accuracy = Math.round((stat.correct / stat.total) * 100);
                      return (
                        <div
                          key={stat.chapter}
                          className="grid grid-cols-[minmax(0,1.7fr)_0.7fr_0.7fr_0.7fr_0.7fr_0.8fr] gap-2 border-b border-stone-100 px-3 py-2.5 text-sm text-stone-700 last:border-b-0 dark:border-stone-800/50 dark:text-stone-300"
                        >
                          <span className="min-w-0 truncate font-medium text-stone-900 dark:text-stone-100">
                            {stat.chapter}
                          </span>
                          <span className="text-right tabular-nums text-stone-700 dark:text-stone-300">
                            {stat.total}
                          </span>
                          <span className="text-right tabular-nums text-emerald-700 dark:text-emerald-400">
                            {stat.correct}
                          </span>
                          <span className="text-right tabular-nums text-red-700 dark:text-red-400">
                            {stat.wrong}
                          </span>
                          <span className="text-right tabular-nums text-stone-500 dark:text-stone-500">
                            {stat.unanswered}
                          </span>
                          <span className="text-right font-semibold tabular-nums text-red-600 dark:text-red-500">
                            {accuracy}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="bg-stone-50 px-4 py-8 text-center dark:bg-stone-950">
                  <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">
                    파트별 분석에 사용할 챕터 정보가 없습니다.
                  </p>
                  <p className="mt-1 text-xs text-stone-500 dark:text-stone-500">
                    CSV에 `챕터`, `chapter`, `단원`, `파트` 중 하나의 헤더를 추가하면 이곳에 분석이 표시됩니다.
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {isRetryModalOpen ? (
        <div className="fixed inset-0 z-50">
          <button onClick={() => setIsRetryModalOpen(false)} className="absolute inset-0 bg-black/35 dark:bg-black/60" />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2">
            <form
              onSubmit={(e) => handleRetrySubmit(e)}
              className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl dark:border-stone-800 dark:bg-stone-900"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">새로 풀기 설정</h2>
                <IconCloseButton onClick={() => setIsRetryModalOpen(false)} label="새로 풀기 설정 닫기" />
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-stone-700 dark:text-stone-300">새 세션 제목</span>
                <input
                  autoFocus
                  value={retryTitle}
                  onChange={(e) => setRetryTitle(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none ring-red-200 transition focus:ring-2 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:ring-red-900/50"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-stone-700 dark:text-stone-300">풀이 순서</span>
                <select
                  value={retryOrderMode}
                  onChange={(e) => setRetryOrderMode(e.target.value as SolveOrder)}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none ring-red-200 transition focus:ring-2 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:ring-red-900/50"
                >
                  <option value="number">번호 순서대로 풀기</option>
                  <option value="chapter-random">챕터별로 무작위 풀기</option>
                  <option value="random">전체 무작위 풀기</option>
                </select>
              </label>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
                >
                  풀이 시작하기
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isWrongRetryModalOpen ? (
        <div className="fixed inset-0 z-50">
          <button onClick={() => setIsWrongRetryModalOpen(false)} className="absolute inset-0 bg-black/35 dark:bg-black/60" />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2">
            <form
              onSubmit={(e) => handleRetrySubmit(e, { onlyWrong: true })}
              className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl dark:border-stone-800 dark:bg-stone-900"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">오답 풀기 설정</h2>
                <IconCloseButton onClick={() => setIsWrongRetryModalOpen(false)} label="오답 풀기 설정 닫기" />
              </div>

              <div className="rounded-xl bg-red-50 p-3 dark:bg-red-950/30 dark:border dark:border-red-900/50">
                <p className="text-xs font-semibold text-red-700 dark:text-red-400">오답 문항 수: {wrongCount}개</p>
                <p className="mt-0.5 text-[11px] text-red-600 dark:text-red-500">틀린 문제들만 모아 새로운 세션을 만듭니다.</p>
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-stone-700 dark:text-stone-300">세션 제목</span>
                <input
                  autoFocus
                  value={retryTitle}
                  onChange={(e) => setRetryTitle(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none ring-red-200 transition focus:ring-2 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:ring-red-900/50"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-stone-700 dark:text-stone-300">풀이 순서</span>
                <select
                  value={retryOrderMode}
                  onChange={(e) => setRetryOrderMode(e.target.value as SolveOrder)}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none ring-red-200 transition focus:ring-2 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:ring-red-900/50"
                >
                  <option value="number">번호 순서대로 풀기</option>
                  <option value="chapter-random">챕터별로 무작위 풀기</option>
                  <option value="random">전체 무작위 풀기</option>
                </select>
              </label>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
                >
                  오답 풀기 시작
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isBookmarkRetryModalOpen ? (
        <div className="fixed inset-0 z-50">
          <button onClick={() => setIsBookmarkRetryModalOpen(false)} className="absolute inset-0 bg-black/35 dark:bg-black/60" />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2">
            <form
              onSubmit={(e) => handleRetrySubmit(e, { onlyBookmark: true })}
              className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl dark:border-stone-800 dark:bg-stone-900"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">책갈피 문제 풀기 설정</h2>
                <IconCloseButton onClick={() => setIsBookmarkRetryModalOpen(false)} label="책갈피 문제 풀기 설정 닫기" />
              </div>

              <div className="rounded-xl bg-amber-50 p-3 dark:bg-amber-950/30 dark:border dark:border-amber-900/50">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">책갈피 문항 수: {bookmarkCount}개</p>
                <p className="mt-0.5 text-[11px] text-amber-600 dark:text-amber-500">책갈피한 문제들만 모아 새로운 세션을 만듭니다.</p>
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-stone-700 dark:text-stone-300">세션 제목</span>
                <input
                  autoFocus
                  value={retryTitle}
                  onChange={(e) => setRetryTitle(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none ring-red-200 transition focus:ring-2 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:ring-red-900/50"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-stone-700 dark:text-stone-300">풀이 순서</span>
                <select
                  value={retryOrderMode}
                  onChange={(e) => setRetryOrderMode(e.target.value as SolveOrder)}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none ring-red-200 transition focus:ring-2 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:ring-red-900/50"
                >
                  <option value="number">번호 순서대로 풀기</option>
                  <option value="chapter-random">챕터별로 무작위 풀기</option>
                  <option value="random">전체 무작위 풀기</option>
                </select>
              </label>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full rounded-lg bg-amber-500 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700"
                >
                  책갈피 문제 풀기 시작
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isDownloadModalOpen ? (
        <div className="fixed inset-0 z-50">
          <button onClick={() => setIsDownloadModalOpen(false)} className="absolute inset-0 bg-black/35 dark:bg-black/60" />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-sm -translate-x-1/2 -translate-y-1/2">
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl dark:border-stone-800 dark:bg-stone-900">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">CSV 다운로드 옵션</h2>
                <IconCloseButton onClick={() => setIsDownloadModalOpen(false)} label="CSV 다운로드 옵션 닫기" />
              </div>
              <div className="grid gap-3">
                <button
                  onClick={handleDownloadAll}
                  className="flex w-full flex-col items-center justify-center rounded-xl border border-stone-200 bg-white p-4 transition hover:bg-orange-50 dark:border-stone-800 dark:bg-stone-900 dark:hover:bg-orange-950/25"
                >
                  <span className="text-sm font-bold text-stone-800 dark:text-stone-200">전체 풀이 내용 다운로드</span>
                  <span className="text-xs text-stone-500 dark:text-stone-500">모든 문항과 내 답안, 오답 노트 포함</span>
                </button>
                <button
                  onClick={handleDownloadWrongOnly}
                  disabled={wrongCount === 0}
                  className="flex w-full flex-col items-center justify-center rounded-xl border border-stone-200 bg-white p-4 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-stone-800 dark:bg-stone-900 dark:hover:bg-orange-950/25"
                >
                  <span className="text-sm font-bold text-stone-800 dark:text-stone-200">오답만 다운로드</span>
                  <span className="text-xs text-stone-500 dark:text-stone-500">틀린 문항만 원본 양식으로 저장 (오답 노트 제외)</span>
                </button>
                <button
                  onClick={handleDownloadWrongNote}
                  disabled={wrongCount === 0}
                  className="flex w-full flex-col items-center justify-center rounded-xl border border-stone-200 bg-white p-4 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-stone-800 dark:bg-stone-900 dark:hover:bg-orange-950/25"
                >
                  <span className="text-sm font-bold text-stone-800 dark:text-stone-200">오답 노트 다운로드</span>
                  <span className="text-xs text-stone-500 dark:text-stone-500">오답과 오답 노트를 포함한 양식으로 저장</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

    </div>
  );
}
