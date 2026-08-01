import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BrandMark } from "../../components/ui/BrandMark";
import { LandingFooter } from "../../components/ui/LandingFooter";
import { ReturnLinkLabel } from "../../components/ui/ReturnLinkLabel";
import { useSettingsStore } from "../../store/useSettingsStore";
import { legalEthicsAnswers } from "./data";
import { gradeLegalEthicsAnswers, parseLegalEthicsAnswers } from "./grading";

const answerGroups = Array.from({ length: 4 }, (_, index) =>
  legalEthicsAnswers.slice(index * 10, index * 10 + 10),
);

export function LegalEthics17Page() {
  const { darkMode, toggleDarkMode } = useSettingsStore();
  const [answerInput, setAnswerInput] = useState("");
  const parsedAnswers = useMemo(() => parseLegalEthicsAnswers(answerInput), [answerInput]);
  const grade = useMemo(
    () => parsedAnswers.invalidDigits.length === 0
      ? gradeLegalEthicsAnswers(parsedAnswers.answers)
      : null,
    [parsedAnswers],
  );
  const hasTooManyAnswers = parsedAnswers.answers.length > legalEthicsAnswers.length;

  return (
    <div className="app-page flex min-h-screen flex-col">
      <header className="landing-nav-wrap">
        <nav className="landing-container flex h-[72px] items-center gap-3" aria-label="제17회 법조윤리시험 가답안 메뉴">
          <div className="flex min-w-0 items-center gap-2.5">
            <Link to="/" className="flex min-w-0 items-center gap-2.5" aria-label="Law Solver 홈">
              <BrandMark className="landing-logo-mark" />
              <span className="truncate text-[17px] font-semibold tracking-[-0.015em]">Law Solver</span>
            </Link>
            <span className="h-5 w-px shrink-0 bg-stone-300 dark:bg-stone-700" aria-hidden="true" />
            <span className="truncate text-sm font-bold tracking-tight sm:text-base">법조윤리 가답안</span>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={toggleDarkMode}
              className="landing-theme-button"
              aria-label={darkMode ? "라이트 모드로 전환" : "다크 모드로 전환"}
            >
              <span aria-hidden="true">{darkMode ? "☀" : "☾"}</span>
            </button>
            <Link to="/apps" className="app-button-secondary ml-1 rounded-lg px-3 py-2 text-xs font-bold sm:px-4 sm:text-sm">
              <ReturnLinkLabel>나가기</ReturnLinkLabel>
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        <section className="border-b border-stone-200/70 dark:border-stone-800/70">
          <div className="landing-container py-12 sm:py-16">
            <p className="landing-section-label">LEGAL ETHICS EXAM</p>
            <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-stone-950 sm:text-5xl dark:text-white">
              제17회 법조윤리시험 가답안
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-stone-600 sm:text-lg dark:text-stone-300">
              1번부터 40번까지의 가답안과 문항별 핵심 해설을 정리했습니다.
            </p>
            <p className="mt-3 text-sm leading-6 text-amber-700 dark:text-amber-300">
              자체 자료로 정리한 1차 가답안으로, 추후 발표되는 공식 정답과 다를 수 있습니다.
            </p>
          </div>
        </section>

        <section className="landing-container py-10 sm:py-14">
          <div className="app-card rounded-3xl border p-5 sm:p-7" aria-labelledby="auto-grade-title">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="landing-section-label">AUTO GRADING</p>
                <h2 id="auto-grade-title" className="mt-2 text-2xl font-black tracking-tight">자동채점</h2>
              </div>
              <span className={`text-sm font-bold ${parsedAnswers.answers.length === 40 && parsedAnswers.invalidDigits.length === 0 ? "text-red-600 dark:text-red-400" : "text-stone-400 dark:text-stone-500"}`}>
                {parsedAnswers.answers.length} / 40
              </span>
            </div>
            <label htmlFor="legal-ethics-answers" className="mt-5 block text-sm font-semibold text-stone-700 dark:text-stone-300">
              1번부터 순서대로 답안 입력
            </label>
            <textarea
              id="legal-ethics-answers"
              value={answerInput}
              onChange={(event) => setAnswerInput(event.target.value)}
              inputMode="numeric"
              rows={3}
              className="app-control mt-2 w-full resize-y rounded-xl px-4 py-3 text-lg font-semibold leading-8 tracking-[0.12em]"
              placeholder="예: 3 4 4 2 3 4 ..."
              spellCheck={false}
              aria-describedby="legal-ethics-answer-status"
            />
            <div id="legal-ethics-answer-status" className="mt-2 min-h-6 text-sm leading-6" aria-live="polite">
              {parsedAnswers.invalidDigits.length > 0 ? (
                <p className="text-red-600 dark:text-red-400">1~4가 아닌 숫자가 포함되어 있습니다.</p>
              ) : hasTooManyAnswers ? (
                <p className="text-red-600 dark:text-red-400">답안이 40개를 넘었습니다.</p>
              ) : parsedAnswers.answers.length > 0 && parsedAnswers.answers.length < 40 ? (
                <p className="text-stone-500 dark:text-stone-400">{40 - parsedAnswers.answers.length}개를 더 입력하면 자동으로 채점됩니다.</p>
              ) : null}
            </div>

            {grade && (
              <div className="mt-5 border-t border-stone-200 pt-5 dark:border-stone-800">
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <div className="app-neutral-box rounded-xl px-2 py-4 text-center sm:px-4">
                    <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">점수</p>
                    <p className="mt-1 text-xl font-black text-red-600 sm:text-2xl dark:text-red-400">{grade.score}점</p>
                  </div>
                  <div className="app-neutral-box rounded-xl px-2 py-4 text-center sm:px-4">
                    <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">정답</p>
                    <p className="mt-1 text-xl font-black sm:text-2xl">{grade.correctCount}개</p>
                  </div>
                  <div className="app-neutral-box rounded-xl px-2 py-4 text-center sm:px-4">
                    <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">오답</p>
                    <p className="mt-1 text-xl font-black sm:text-2xl">{grade.incorrectCount}개</p>
                  </div>
                </div>

                {grade.incorrectAnswers.length > 0 ? (
                  <div className="mt-5">
                    <h3 className="text-sm font-bold">틀린 문항</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {grade.incorrectAnswers.map((item) => (
                        <a
                          key={item.number}
                          href={`#explanation-${item.number}`}
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700 transition-colors hover:border-red-300 hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/70"
                        >
                          {item.number}번&nbsp; {item.submitted} → {item.correct}
                        </a>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="mt-5 text-sm font-bold text-emerald-700 dark:text-emerald-400">40문항을 모두 맞혔습니다.</p>
                )}

                <button
                  type="button"
                  onClick={() => setAnswerInput("")}
                  className="app-button-secondary mt-5 rounded-lg px-4 py-2 text-sm font-bold"
                >
                  입력 지우기
                </button>
              </div>
            )}
          </div>

          <div className="mt-14 flex items-end justify-between gap-4 sm:mt-16">
            <div>
              <p className="landing-section-label">QUICK ANSWERS</p>
              <h2 id="answer-table-title" className="mt-2 text-2xl font-black tracking-tight">가답안표</h2>
            </div>
            <span className="text-sm text-stone-400 dark:text-stone-500">총 40문항</span>
          </div>

          <div className="app-card mt-6 overflow-hidden rounded-2xl border">
            {answerGroups.map((group, groupIndex) => (
              <div key={groupIndex} className={groupIndex > 0 ? "border-t border-stone-200 dark:border-stone-800" : ""}>
                <div className="grid grid-cols-[52px_repeat(10,minmax(0,1fr))] bg-stone-50/80 text-center text-xs font-semibold text-stone-500 dark:bg-stone-900/60 dark:text-stone-400">
                  <span className="border-r border-stone-200 px-1 py-3 dark:border-stone-800">문항</span>
                  {group.map((item) => <span key={item.number} className="px-1 py-3">{item.number}</span>)}
                </div>
                <div className="grid grid-cols-[52px_repeat(10,minmax(0,1fr))] text-center">
                  <span className="border-r border-t border-stone-200 px-1 py-3 text-xs font-semibold text-stone-500 dark:border-stone-800 dark:text-stone-400">답</span>
                  {group.map((item) => (
                    <a
                      key={item.number}
                      href={`#explanation-${item.number}`}
                      className="border-t border-stone-200 px-1 py-3 text-xl font-black leading-none text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-500 sm:text-2xl dark:border-stone-800 dark:text-red-400 dark:hover:bg-red-950/40"
                      aria-label={`${item.number}번 해설로 이동`}
                    >
                      {item.answer}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-14 sm:mt-20" aria-labelledby="explanations-title">
            <p className="landing-section-label">EXPLANATIONS</p>
            <h2 id="explanations-title" className="mt-2 text-2xl font-black tracking-tight">문항별 해설</h2>
            <div className="mt-6 grid gap-4">
              {legalEthicsAnswers.map((item) => (
                <article id={`explanation-${item.number}`} key={item.number} className="app-card scroll-mt-24 rounded-2xl border p-5 sm:p-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-sm font-black text-red-700 dark:bg-red-950/50 dark:text-red-300">
                      {item.number}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold tracking-[0.08em] text-red-600 dark:text-red-400">정답 {item.answer}</p>
                      <h3 className="mt-0.5 text-base font-bold tracking-tight sm:text-lg">{item.topic}</h3>
                    </div>
                  </div>
                  <p className="mt-4 break-keep text-sm leading-7 text-stone-600 sm:text-[15px] dark:text-stone-300">{item.explanation}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
