import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { trackEvent } from "../../lib/analytics";
import { LbtiLayout } from "./components/LbtiLayout";
import { calculateLbtiResult, lbtiQuestions, lbtiScale, type LbtiAnswers } from "./lib/lbti";

export function LbtiTestPage() {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<LbtiAnswers>({});
  const question = lbtiQuestions[currentIndex]!;
  const selectedWeight = answers[question.id];
  const progress = Math.round(((currentIndex + 1) / lbtiQuestions.length) * 100);
  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentIndex]);

  const selectAnswer = (weight: number) => {
    setAnswers((current) => ({ ...current, [question.id]: weight }));
  };

  const goNext = () => {
    if (selectedWeight === undefined) return;
    if (currentIndex < lbtiQuestions.length - 1) {
      setCurrentIndex((current) => current + 1);
      return;
    }

    const result = calculateLbtiResult(answers);
    trackEvent("lbti_result_completed", {
      lbti_type: result.code,
    });
    navigate(`/apps/lbti/result/${result.code.toLowerCase()}`, {
      state: { axisScores: result.axisScores },
    });
  };

  return (
    <LbtiLayout>
      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="mb-7">
          <div className="flex items-center justify-between gap-4 text-sm">
            <p className="font-bold text-stone-800 dark:text-stone-200">
              <span className="text-red-600 dark:text-red-400">{currentIndex + 1}</span>
              <span className="text-stone-400"> / {lbtiQuestions.length}</span>
            </p>
            <p className="text-xs text-stone-400" aria-live="polite">{answeredCount}개 응답 완료</p>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800" aria-label={`진행률 ${progress}%`}>
            <div className="app-progress-gradient h-full rounded-full transition-[width] duration-200" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <section className="app-card rounded-[1.75rem] border p-5 sm:p-8 lg:p-10" aria-labelledby="lbti-question">
          <div className="mx-auto max-w-3xl">
            <p className="text-xs font-bold tracking-[0.15em] text-red-600 dark:text-red-400">QUESTION {String(currentIndex + 1).padStart(2, "0")}</p>
            <h1 id="lbti-question" className="mt-5 text-xl font-bold leading-[1.65] tracking-[-0.025em] text-stone-950 sm:text-2xl lg:text-[1.7rem] dark:text-stone-50">
              {question.prompt}
            </h1>

            <div className="mt-8 grid gap-3 sm:mt-10 sm:grid-cols-2" role="radiogroup" aria-label="응답 선택">
              {lbtiScale.map((option, optionIndex) => {
                const isSelected = selectedWeight === option.weight;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => selectAnswer(option.weight)}
                    className={[
                      "flex min-h-[68px] items-center gap-3 rounded-2xl border px-4 py-4 text-left text-sm font-bold transition sm:px-5 sm:text-base",
                      isSelected
                        ? "border-red-500 bg-red-50 text-red-700 shadow-[0_0_0_3px_rgba(239,68,68,0.12)] dark:bg-red-950/45 dark:text-red-300"
                        : "border-stone-200 bg-white text-stone-700 hover:border-red-300 hover:bg-red-50/50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:border-red-800 dark:hover:bg-red-950/20",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "grid h-8 w-8 shrink-0 place-items-center rounded-full border text-xs",
                        isSelected ? "border-red-500 bg-red-600 text-white" : "border-stone-300 text-stone-400 dark:border-stone-600",
                      ].join(" ")}
                      aria-hidden="true"
                    >
                      {optionIndex + 1}
                    </span>
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setCurrentIndex((current) => Math.max(0, current - 1))}
            disabled={currentIndex === 0}
            className="app-button-secondary rounded-xl px-5 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← 이전
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={selectedWeight === undefined}
            className="app-button-primary rounded-xl px-6 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40"
          >
            {currentIndex === lbtiQuestions.length - 1 ? "결과 확인하기" : "다음 문항 →"}
          </button>
        </div>
      </main>
    </LbtiLayout>
  );
}
