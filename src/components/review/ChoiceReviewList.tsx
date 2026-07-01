import { ParsedQuestion } from "../../types/test";

const choiceMarkers = ["①", "②", "③", "④", "⑤"];

interface ChoiceReviewListProps {
  question: ParsedQuestion;
}

export function ChoiceReviewList({ question }: ChoiceReviewListProps) {
  if (!question.choices) return null;

  return (
    <section className="mt-5 rounded-xl border border-stone-200 bg-stone-50/70 p-4 dark:border-stone-800 dark:bg-stone-950/30">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-xs font-semibold text-stone-600 dark:text-stone-500">문제 선지</h3>
      </div>

      <div className="space-y-2">
        {question.choices.map((choice, idx) => {
          const value = String(idx + 1);
          const isMine = question.my_answer === value;
          const isAnswer = question.answer === value;

          return (
            <div
              key={value}
              className={[
                "flex gap-3 rounded-lg border px-3 py-2.5 text-sm leading-6 transition",
                isMine && isAnswer
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-200"
                  : isAnswer
                    ? "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/20 dark:text-blue-200"
                    : isMine
                      ? "border-red-200 bg-red-50 text-red-900 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-200"
                      : "border-stone-200 bg-white text-stone-700 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300",
              ].join(" ")}
            >
              <span className="shrink-0 text-base font-bold leading-6">{choiceMarkers[idx]}</span>
              <span className="min-w-0 flex-1 whitespace-pre-wrap">{choice}</span>
              <span className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center">
                {isMine ? (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-700 dark:bg-red-950/50 dark:text-red-300">
                    내 답
                  </span>
                ) : null}
                {isAnswer ? (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                    정답
                  </span>
                ) : null}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
