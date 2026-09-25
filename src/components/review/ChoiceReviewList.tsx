import { ParsedQuestion } from "../../types/test";
import { hasNoCorrectChoice, isCorrectAnswer } from "../../lib/answer";
import { RichTextContent } from "../ui/RichTextContent";
import { StudyChoiceNumber } from "../study/StudyChoiceNumber";

interface ChoiceReviewListProps {
  question: ParsedQuestion;
}

export function ChoiceReviewList({ question }: ChoiceReviewListProps) {
  if (!question.choices) return null;
  const noCorrectChoice = hasNoCorrectChoice(question);

  return (
    <section className="app-study-inset mt-5 border p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-xs font-semibold text-stone-600 dark:text-stone-400">문제 선지</h3>
        {noCorrectChoice ? <span className="app-study-tag bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">정답 없음</span> : null}
      </div>

      {noCorrectChoice ? <p className="mb-3 text-xs leading-5 text-stone-600 dark:text-stone-400">이 문항은 답을 고르지 않아도 정답으로 처리됩니다.</p> : null}

      <div className="space-y-2">
        {question.choices.map((choice, idx) => {
          const value = String(idx + 1);
          const isMine = question.my_answer === value;
          const isAnswer = !noCorrectChoice && isCorrectAnswer(question, value);
          const isAcceptedSelection = isMine && isCorrectAnswer(question, value);

          return (
            <div
              key={value}
              className={[
                "app-study-option grid grid-cols-[16px_minmax(0,1fr)] gap-x-2 gap-y-2 border px-3 py-2.5 text-xs leading-5 sm:grid-cols-[16px_minmax(0,1fr)_auto] md:text-sm md:leading-6",
                isAcceptedSelection
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-200"
                  : isAnswer
                    ? "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/20 dark:text-blue-200"
                    : isMine
                      ? "border-red-200 bg-red-50 text-red-900 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-200"
                      : "app-study-option-neutral text-stone-700 dark:text-stone-300",
              ].join(" ")}
            >
              <StudyChoiceNumber number={idx + 1} className="mt-0.5 md:mt-1" />
              <RichTextContent content={choice} className="min-w-0" />
              {isMine || isAnswer ? <span className="col-start-2 flex flex-wrap items-center gap-1 sm:col-start-3 sm:row-start-1 sm:self-start">
                {isMine ? (
                  <span className={`app-study-tag px-2 py-0.5 text-[11px] font-bold ${isAcceptedSelection
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                    : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300"}`}>
                    내 답
                  </span>
                ) : null}
                {isAnswer ? (
                  <span className="app-study-tag bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                    정답
                  </span>
                ) : null}
              </span> : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
