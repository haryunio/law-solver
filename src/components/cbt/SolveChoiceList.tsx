import { hasNoCorrectChoice, isCorrectAnswer } from "../../lib/answer";
import type { ParsedQuestion, TestType } from "../../types/test";
import { StudyChoiceNumber } from "../study/StudyChoiceNumber";
import { RichTextContent } from "../ui/RichTextContent";

const OX_OPTIONS = [
  { key: "O", number: null, text: "O" },
  { key: "X", number: null, text: "X" },
];

interface SolveChoiceListProps {
  question: ParsedQuestion;
  type: TestType;
  showAnswer: boolean;
  showNext: boolean;
  onAnswer: (answer: string) => void;
  onInlineNext: () => void;
}

export function SolveChoiceList({
  question,
  type,
  showAnswer,
  showNext,
  onAnswer,
  onInlineNext,
}: SolveChoiceListProps) {
  if (type === "short") return null;

  const options = type === "OX"
    ? OX_OPTIONS
    : (question.choices ?? []).map((choice, index) => ({
        key: String(index + 1),
        number: index + 1,
        text: choice,
      }));

  return (
    <>
      {options.map((option) => {
        const selected = question.my_answer === option.key;
        const correct = showAnswer && !hasNoCorrectChoice(question) && isCorrectAnswer(question, option.key);
        const acceptedSelection = showAnswer && selected && isCorrectAnswer(question, option.key);
        const inlineNext = type === "OX" && selected && !showAnswer && showNext;
        const answerBadge = correct ? (
          <span className={[
            "app-study-tag inline-flex shrink-0 justify-center px-1 py-0.5 text-xs font-bold leading-4 text-blue-600 dark:text-blue-400",
            option.number ? "col-start-2 row-start-2 self-start justify-self-start" : "",
          ].join(" ")}>
            정답
          </span>
        ) : null;

        return (
          <div key={option.key} className="relative">
            <button
              type="button"
              aria-pressed={selected}
              onClick={() => onAnswer(option.key)}
              className={[
                "app-study-option w-full items-start gap-x-2 border px-4 py-3 text-left",
                option.number ? "grid grid-cols-[16px_minmax(0,1fr)]" : "flex",
                option.number && correct ? "gap-y-1" : "",
                inlineNext ? "pr-32 md:pr-36" : "",
                type === "5-choice" ? "text-sm" : "text-base",
                acceptedSelection
                  ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:border-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                  : correct
                    ? "border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
                    : selected
                      ? "border-red-600 bg-red-50 text-red-700 dark:border-red-600 dark:bg-red-950/30 dark:text-red-400"
                      : "app-study-option-neutral text-stone-800 hover:border-red-300 hover:bg-red-50/40 dark:text-stone-300 dark:hover:border-red-900/70 dark:hover:bg-red-950/15",
              ].join(" ")}
            >
              {option.number ? (
                <StudyChoiceNumber number={option.number} className="col-start-1 row-start-1 mt-0.5" />
              ) : null}
              <RichTextContent
                as="span"
                content={option.text}
                className={[
                  "min-w-0 flex-1 font-medium",
                  option.number ? "col-start-2 row-start-1" : "",
                ].join(" ")}
              />
              {answerBadge}
            </button>
            {inlineNext ? (
              <button
                type="button"
                onClick={onInlineNext}
                className="app-button-primary app-study-control app-inline-next absolute bottom-2 right-2 top-2 inline-flex items-center px-3 text-xs font-bold"
              >
                다음 문제로
                <span className="ml-1 text-red-200" aria-hidden="true">›</span>
              </button>
            ) : null}
          </div>
        );
      })}
    </>
  );
}
