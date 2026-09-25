import type { ReactNode } from "react";
import { getAnswerParts, isCorrectAnswer } from "../../lib/answer";
import type { ParsedQuestion } from "../../types/test";
import { QuestionPassages } from "../study/QuestionPassages";
import { LegalReferenceContent } from "../ui/LegalReferenceContent";
import { RichTextContent } from "../ui/RichTextContent";
import { ChoiceReviewList } from "./ChoiceReviewList";

/** Shared presentation only; each review page owns navigation and note persistence. */
export function ReviewQuestionDetails({
  question,
  children,
}: {
  question: ParsedQuestion;
  children?: ReactNode;
}) {
  const isCorrect = isCorrectAnswer(question, question.my_answer);
  const myAnswer = getAnswerParts(question, question.my_answer);
  const correctAnswer = getAnswerParts(question, question.answer);

  return (
    <>
      <RichTextContent
        content={question.question}
        className={[
          "font-semibold dark:text-stone-100",
          question.choices
            ? "text-sm leading-6 md:text-base md:leading-7"
            : "text-base leading-7 md:text-lg md:leading-8",
        ].join(" ")}
      />
      <QuestionPassages boxes={question.boxes} compact={Boolean(question.choices)} />
      <ChoiceReviewList question={question} />

      <div className="mt-6 space-y-3">
        {!question.choices ? (
          <>
            <article className={[
              "app-study-option border p-4",
              isCorrect
                ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/20"
                : "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20",
            ].join(" ")}>
              <p className={["text-xs font-semibold", isCorrect ? "text-emerald-700 dark:text-emerald-500" : "text-red-700 dark:text-red-500"].join(" ")}>내가 고른 답</p>
              <div className={["mt-1 flex gap-2 text-sm", isCorrect ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"].join(" ")}>
                {myAnswer.circle ? <span className="shrink-0 font-bold">{myAnswer.circle}</span> : null}
                <span className="min-w-0 flex-1 break-words">{myAnswer.text}</span>
              </div>
            </article>
            {!isCorrect ? (
              <article className="app-study-option border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-950/20">
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-500">실제 정답</p>
                <div className="mt-1 flex gap-2 text-sm text-blue-700 dark:text-blue-300">
                  {correctAnswer.circle ? <span className="shrink-0 font-bold">{correctAnswer.circle}</span> : null}
                  <span className="min-w-0 flex-1 break-words">{correctAnswer.text}</span>
                </div>
              </article>
            ) : null}
          </>
        ) : null}
        {question.explanation ? (
          <article className="app-study-inset border p-4">
            <p className="text-xs font-semibold text-stone-600 dark:text-stone-400">해설</p>
            <LegalReferenceContent
              content={question.explanation}
              className="mt-1 text-sm text-stone-700 dark:text-stone-300"
            />
          </article>
        ) : null}
        {question.source ? (
          <article className="app-study-inset border p-4">
            <p className="text-xs font-semibold text-stone-600 dark:text-stone-400">출처</p>
            <p className="mt-1 text-sm text-stone-700 dark:text-stone-300">
              <LegalReferenceContent content={question.source} as="span" plainText />
            </p>
          </article>
        ) : null}
        {children}
      </div>
    </>
  );
}
