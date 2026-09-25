import { getAnswerToken, getQuestionAnswerToken, isCorrectAnswer } from "../../lib/answer";
import type { ParsedQuestion } from "../../types/test";

interface StudyOmrTableProps {
  questions: readonly ParsedQuestion[];
  currentIndex: number;
  mode: "solve" | "review";
  onSelect: (index: number) => void;
  getQuestionNumber?: (question: ParsedQuestion, index: number) => number | undefined;
  rowRef?: (index: number, node: HTMLButtonElement | null) => void;
  density?: "compact" | "comfortable";
  className?: string;
}

/** The caller owns scrolling, viewport constraints, and navigation side effects. */
export function StudyOmrTable({
  questions,
  currentIndex,
  mode,
  onSelect,
  getQuestionNumber,
  rowRef,
  density = "compact",
  className,
}: StudyOmrTableProps) {
  const isReview = mode === "review";
  const columns = isReview
    ? "grid-cols-[32px_minmax(0,1fr)_minmax(0,1fr)_16px]"
    : "grid-cols-[32px_minmax(0,1fr)_16px]";

  return (
    <div className={["app-study-omr border", className].filter(Boolean).join(" ")}>
      <div className={[
        "app-study-omr-heading sticky top-0 z-10 grid items-center gap-x-1 border-b px-2 py-1.5 text-[11px] font-semibold text-stone-600 dark:text-stone-400",
        columns,
      ].join(" ")}>
        <span>번호</span>
        <span className={isReview ? "text-center" : undefined}>내 답</span>
        {isReview ? <span className="text-center">정답</span> : null}
        <span className="sr-only">{isReview ? "오답 노트" : "책갈피"}</span>
      </div>
      {questions.map((question, index) => {
        const isCurrent = index === currentIndex;
        const answer = getAnswerToken(question.my_answer);
        const correctAnswer = isReview ? getQuestionAnswerToken(question) : null;
        const statusClassName = isCurrent
          ? "bg-red-600 text-white"
          : isReview && isCorrectAnswer(question, question.my_answer)
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
            : isReview || question.my_answer !== ""
              ? "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
              : "app-study-option-neutral text-stone-700 dark:text-stone-400";

        return (
          <button
            type="button"
            key={question.id}
            ref={rowRef ? (node) => rowRef(index, node) : undefined}
            aria-current={isCurrent ? "step" : undefined}
            onClick={() => onSelect(index)}
            className={[
              "app-study-omr-row grid w-full items-center gap-x-1 border-b px-2 text-left text-xs font-semibold last:border-b-0 focus-visible:relative focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-400",
              columns,
              density === "comfortable" ? "py-2" : "py-1.5",
              statusClassName,
            ].join(" ")}
          >
            <span>{getQuestionNumber?.(question, index) ?? index + 1}</span>
            <span className={["min-w-0 truncate", isReview ? "text-center" : ""].join(" ")} title={answer}>{answer}</span>
            {isReview ? <span className="min-w-0 truncate text-center" title={correctAnswer ?? undefined}>{correctAnswer}</span> : null}
            {isReview ? (
              <span className="flex items-center justify-center leading-none" title={question.wrong_note?.trim() ? "오답 노트 있음" : undefined}>
                {question.wrong_note?.trim() ? "•" : ""}
              </span>
            ) : (
              <span className="flex items-center justify-center text-[10px] text-amber-500 dark:text-amber-500/80" title={question.bookmark ? "책갈피" : undefined}>
                {question.bookmark ? "★" : ""}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
