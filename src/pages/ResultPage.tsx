import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AppFooter } from "../components/ui/AppFooter";
import { DashboardHeaderTitle } from "../components/ui/DashboardHeaderTitle";
import { IconCloseButton } from "../components/ui/IconCloseButton";
import { ReturnLinkLabel } from "../components/ui/ReturnLinkLabel";
import { ThemeSelect } from "../components/ui/ThemeSelect";
import { getAnswerToken } from "../lib/answer";
import {
  RetryType,
  toAnalyticsQuestionType,
  trackEvent,
} from "../lib/analytics";
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
  OX: "border-red-100 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400",
  "5-choice":
    "border-orange-100 bg-orange-50 text-orange-700 dark:border-orange-900/50 dark:bg-orange-950/30 dark:text-orange-400",
  short:
    "border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400",
} as const;

const resultOrderModeLabel = {
  number: "번호 순서",
  "chapter-random": "챕터별 랜덤",
  random: "전체 랜덤",
} as const;

const solveOrderOptions = [
  { value: "number", label: "번호 순서대로 풀기" },
  { value: "chapter-random", label: "챕터별로 무작위 풀기" },
  { value: "random", label: "전체 무작위 풀기" },
];

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
      <div className="app-page p-6">
        <div className="app-card mx-auto max-w-2xl rounded-2xl border p-8 text-center">
          <p className="text-stone-700 dark:text-stone-300">세션을 찾을 수 없습니다.</p>
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
    const retryType: RetryType = options.onlyWrong
      ? "wrong"
      : options.onlyBookmark
        ? "bookmarked"
        : "all";

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

    trackEvent("retry_created", {
      retry_type: retryType,
      question_type: toAnalyticsQuestionType(session.type),
    });

    navigate(`/solve/${newSessionId}`, {
      state: {
        solveEntry:
          retryType === "wrong"
            ? "retry_wrong"
            : retryType === "bookmarked"
              ? "retry_bookmarked"
              : "retry_all",
      },
    });
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
      <div className="app-page p-6">
        <div className="app-card mx-auto max-w-2xl rounded-2xl border p-8 text-center">
          <p className="text-stone-700 dark:text-stone-300">아직 제출되지 않은 세션입니다.</p>
          <button
            onClick={() => navigate(`/solve/${session.id}`, { state: { solveEntry: "resume" } })}
            className="app-button-primary mt-4 rounded-lg px-4 py-2 text-sm font-semibold"
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
  const incorrectCount = session.questions.filter(
    (q) => q.my_answer && !isCorrectQuestion(q),
  ).length;
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
        current.wrong += question.my_answer && !isCorrect ? 1 : 0;
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
    <div className="app-page px-4 py-7 transition-colors duration-300 md:px-6 md:py-8">
      <div className="mx-auto max-w-6xl">
        <DashboardHeaderTitle
          title={session.title}
          sectionTitle="채점 결과"
          logoTo={subjectDashboardPath}
          logoLabel="문제 풀이 대시보드로 이동"
        >
          <button
            type="button"
            onClick={() => setIsDownloadModalOpen(true)}
            className="app-button-secondary rounded-xl px-3 py-2 text-sm font-semibold sm:px-4"
          >
            CSV 다운로드
          </button>
          <Link
            to={subjectDashboardPath}
            className="app-button-secondary rounded-xl px-3 py-2 text-center text-sm font-semibold sm:px-4"
          >
            <ReturnLinkLabel>문제 대시보드로</ReturnLinkLabel>
          </Link>
        </DashboardHeaderTitle>

        <div className="grid items-stretch gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <section className="app-card flex flex-col rounded-2xl border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={[
                    "rounded-full border px-2.5 py-1 text-[11px] font-bold",
                    resultTypeStyle[session.type],
                  ].join(" ")}
                >
                  {resultTypeLabel[session.type]}
                </span>
                <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-[11px] font-bold text-stone-600 dark:border-stone-700 dark:bg-stone-950/40 dark:text-stone-300">
                  {resultOrderModeLabel[session.order_mode ?? "number"]}
                </span>
              </div>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <article className="app-score-card flex min-h-[64px] items-center justify-between rounded-xl border px-3 py-2">
                <p className="text-xs font-medium text-red-700 dark:text-red-300">정답률</p>
                <p className="text-2xl font-bold tracking-tight text-red-600 dark:text-red-300">
                  {session.score}%
                </p>
              </article>
              <article className="app-neutral-box flex min-h-[64px] items-center justify-between rounded-xl px-3 py-2">
                <div>
                  <p className="text-xs font-medium text-stone-500 dark:text-stone-500">풀이 시간</p>
                  <p className="mt-1 text-sm font-bold tabular-nums text-stone-900 dark:text-stone-100">
                    {formatElapsedTime(session.elapsed_time)}
                  </p>
                </div>
                <div className="border-l border-stone-200 pl-2.5 text-right dark:border-stone-700">
                  <p className="text-[10px] text-stone-400 dark:text-stone-500">평균</p>
                  <p className="mt-1 text-xs font-semibold tabular-nums text-stone-700 dark:text-stone-300">
                    {formatElapsedTime(averageSecondsPerQuestion)}
                  </p>
                </div>
              </article>
            </div>

            <dl className="app-neutral-box mt-2 grid flex-1 grid-cols-5 divide-x divide-stone-200 overflow-hidden rounded-xl dark:divide-stone-700">
              {[
                ["전체", session.total_questions, "text-stone-900 dark:text-stone-100"],
                ["정답", correctCount, "text-emerald-700 dark:text-emerald-400"],
                ["오답", incorrectCount, "text-red-700 dark:text-red-400"],
                ["미응답", unansweredCount, "text-stone-700 dark:text-stone-300"],
                ["책갈피", bookmarkCount, "text-amber-700 dark:text-amber-400"],
              ].map(([label, value, valueClass]) => (
                <div key={label} className="flex min-w-0 flex-col justify-center px-1.5 py-1.5 text-center sm:px-2">
                  <dt className="truncate text-[10px] font-medium text-stone-500 dark:text-stone-500">
                    {label}
                  </dt>
                  <dd className={["mt-0.5 text-sm font-bold tabular-nums", valueClass].join(" ")}>
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="app-card flex flex-col rounded-2xl border p-3">
            <h2 className="mb-2 text-sm font-semibold text-stone-900 dark:text-stone-100">
              문제 확인
            </h2>
            <div className="grid min-h-0 flex-1 grid-rows-3 gap-2">
              <Link
                to={`/wrong/${session.id}`}
                className={[
                  "flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors duration-100",
                  wrongCount > 0
                    ? "app-button-primary"
                    : "pointer-events-none border-stone-200 bg-white text-stone-400 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-600",
                ].join(" ")}
              >
                <span>오답 확인</span>
                <span className="opacity-75">{wrongCount}</span>
              </Link>
              <Link
                to={`/review/${session.id}`}
                className="flex items-center justify-between rounded-xl border border-orange-200 bg-white px-3 py-2.5 text-sm font-semibold text-orange-700 transition-colors duration-100 hover:bg-orange-50 dark:border-orange-900/50 dark:bg-stone-900 dark:text-orange-400 dark:hover:bg-orange-950/25"
              >
                <span>전체 확인</span>
                <span className="opacity-75">{session.total_questions}</span>
              </Link>
              <Link
                to={`/review/${session.id}?onlyBookmarks=true`}
                className={[
                  "flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors duration-100",
                  bookmarkCount > 0
                    ? "border-amber-200 bg-white text-amber-700 hover:bg-amber-50 dark:border-amber-900/50 dark:bg-stone-900 dark:text-amber-400 dark:hover:bg-amber-950/25"
                    : "pointer-events-none border-stone-200 bg-white text-stone-400 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-600",
                ].join(" ")}
              >
                <span>책갈피 확인</span>
                <span className="opacity-75">{bookmarkCount}</span>
              </Link>
            </div>
          </section>

          <section className="app-card flex flex-col rounded-2xl border p-3">
            <h2 className="mb-2 text-sm font-semibold text-stone-900 dark:text-stone-100">
              다시 풀기
            </h2>
            <div className="grid min-h-0 flex-1 grid-rows-3 gap-2">
              <button
                type="button"
                onClick={handleOpenWrongRetry}
                disabled={wrongCount === 0}
                className="flex items-center rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-left text-sm font-semibold text-stone-700 transition-colors duration-100 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800"
              >
                오답 다시 풀기
              </button>
              <button
                type="button"
                onClick={handleOpenRetry}
                className="flex items-center rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-left text-sm font-semibold text-stone-700 transition-colors duration-100 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800"
              >
                전체 새로 풀기
              </button>
              <button
                type="button"
                onClick={handleOpenBookmarkRetry}
                disabled={bookmarkCount === 0}
                className="flex items-center rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-left text-sm font-semibold text-stone-700 transition-colors duration-100 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800"
              >
                책갈피 다시 풀기
              </button>
            </div>
          </section>
        </div>

        <section className="app-card mt-4 min-w-0 rounded-2xl border p-4 md:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100">상세 분석</h2>
                <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-500">
                  문항별 채점과 파트별 정답률을 확인하세요.
                </p>
              </div>
              <div className="flex w-full rounded-xl border border-stone-200 bg-stone-50 p-1 sm:w-[280px] dark:border-stone-800 dark:bg-stone-950">
                {[
                  ["omr", "OMR 채점표"],
                  ["chapter", "파트별 분석"],
                ].map(([tab, label]) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setResultTab(tab as ResultTab)}
                    className={[
                      "flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors duration-100",
                      resultTab === tab
                        ? "bg-white text-red-600 shadow-sm dark:bg-stone-900 dark:text-red-500"
                        : "text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200",
                    ].join(" ")}
                  >
                    {label}
                  </button>
                ))}
              </div>
          </div>

          {resultTab === "omr" ? (
            <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-800">
              <div className="min-w-[42rem]">
                <div className="grid grid-cols-[56px_minmax(140px,1.4fr)_1fr_1fr_.8fr] border-b border-stone-200 bg-stone-50 px-3 py-2.5 text-xs font-semibold text-stone-600 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-400">
                  <span>번호</span>
                  <span>파트</span>
                  <span>나의 답</span>
                  <span>정답</span>
                  <span>결과</span>
                </div>
                <div className="max-h-[58vh] overflow-y-auto">
                  {session.questions.map((question, idx) => {
                    const isCorrect = isCorrectQuestion(question);
                    const isUnanswered = !question.my_answer;
                    const myAnswerLabel = getAnswerToken(question.my_answer);
                    const answerLabel = getAnswerToken(question.answer);
                    const chapterLabel = question.chapter?.trim() || "—";
                    return (
                      <div
                        key={question.id}
                        className={[
                          "grid grid-cols-[56px_minmax(140px,1.4fr)_1fr_1fr_.8fr] border-b border-stone-100 px-3 py-2.5 text-sm last:border-b-0 dark:border-stone-800/50",
                          isCorrect
                            ? "bg-emerald-50/70 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400"
                            : isUnanswered
                              ? "bg-stone-50 text-stone-600 dark:bg-stone-950/40 dark:text-stone-400"
                              : "bg-red-50/70 text-red-800 dark:bg-red-950/20 dark:text-red-400",
                        ].join(" ")}
                      >
                        <span className="tabular-nums">{idx + 1}</span>
                        <span className="min-w-0 truncate pr-3" title={chapterLabel}>
                          {chapterLabel}
                        </span>
                        <span className="min-w-0 truncate" title={myAnswerLabel}>
                          {myAnswerLabel}
                        </span>
                        <span className="min-w-0 truncate" title={answerLabel}>
                          {answerLabel}
                        </span>
                        <span className="text-xs font-semibold">
                          {isCorrect ? "정답" : isUnanswered ? "미응답" : "오답"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
              <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-800">
                {chapterStats.length > 0 ? (
                  <div className="min-w-[38rem]">
                    <div className="grid grid-cols-[minmax(0,1.7fr)_0.7fr_0.7fr_0.7fr_0.7fr_0.8fr] gap-2 border-b border-stone-200 bg-stone-50 px-3 py-2.5 text-xs font-semibold text-stone-600 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-400">
                      <span>파트</span>
                      <span className="text-right">문제수</span>
                      <span className="text-right">정답</span>
                      <span className="text-right">오답</span>
                      <span className="text-right">미응답</span>
                      <span className="text-right">정답률</span>
                    </div>
                    <div className="max-h-[58vh] overflow-y-auto">
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
                            <span className="text-right tabular-nums">{stat.total}</span>
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
                  <div className="bg-stone-50 px-4 py-10 text-center dark:bg-stone-950">
                    <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">
                      파트별 분석에 사용할 챕터 정보가 없습니다.
                    </p>
                    <p className="mt-1 text-xs leading-5 text-stone-500 dark:text-stone-500">
                      CSV에 `챕터`, `chapter`, `단원`, `파트` 중 하나의 헤더를 추가하면 분석이 표시됩니다.
                    </p>
                  </div>
                )}
              </div>
            )}
        </section>

        <AppFooter />
      </div>

      {isRetryModalOpen ? (
        <div className="fixed inset-0 z-50">
          <button onClick={() => setIsRetryModalOpen(false)} className="app-modal-backdrop absolute inset-0" />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2">
            <form
              onSubmit={(e) => handleRetrySubmit(e)}
              className="app-modal-surface space-y-4 rounded-2xl border p-6"
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
                  className="app-control w-full rounded-lg px-3 py-2 text-sm"
                />
              </label>

              <div className="space-y-2">
                <span className="text-sm font-medium text-stone-700 dark:text-stone-300">풀이 순서</span>
                <ThemeSelect
                  value={retryOrderMode}
                  onChange={(value) => setRetryOrderMode(value as SolveOrder)}
                  options={solveOrderOptions}
                  ariaLabel="풀이 순서 선택"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="app-button-primary app-button-primary-standalone w-full rounded-lg py-2.5 text-sm font-semibold"
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
          <button onClick={() => setIsWrongRetryModalOpen(false)} className="app-modal-backdrop absolute inset-0" />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2">
            <form
              onSubmit={(e) => handleRetrySubmit(e, { onlyWrong: true })}
              className="app-modal-surface space-y-4 rounded-2xl border p-6"
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
                  className="app-control w-full rounded-lg px-3 py-2 text-sm"
                />
              </label>

              <div className="space-y-2">
                <span className="text-sm font-medium text-stone-700 dark:text-stone-300">풀이 순서</span>
                <ThemeSelect
                  value={retryOrderMode}
                  onChange={(value) => setRetryOrderMode(value as SolveOrder)}
                  options={solveOrderOptions}
                  ariaLabel="풀이 순서 선택"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="app-button-primary app-button-primary-standalone w-full rounded-lg py-2.5 text-sm font-semibold"
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
          <button onClick={() => setIsBookmarkRetryModalOpen(false)} className="app-modal-backdrop absolute inset-0" />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2">
            <form
              onSubmit={(e) => handleRetrySubmit(e, { onlyBookmark: true })}
              className="app-modal-surface space-y-4 rounded-2xl border p-6"
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
                  className="app-control w-full rounded-lg px-3 py-2 text-sm"
                />
              </label>

              <div className="space-y-2">
                <span className="text-sm font-medium text-stone-700 dark:text-stone-300">풀이 순서</span>
                <ThemeSelect
                  value={retryOrderMode}
                  onChange={(value) => setRetryOrderMode(value as SolveOrder)}
                  options={solveOrderOptions}
                  ariaLabel="풀이 순서 선택"
                />
              </div>

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
          <button onClick={() => setIsDownloadModalOpen(false)} className="app-modal-backdrop absolute inset-0" />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-sm -translate-x-1/2 -translate-y-1/2">
            <div className="app-modal-surface rounded-2xl border p-6">
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
