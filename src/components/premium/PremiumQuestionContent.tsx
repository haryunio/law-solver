import { RichTextContent } from "../ui/RichTextContent";
import type { PremiumQuestion } from "../../lib/premiumApi";

interface PremiumQuestionContentProps {
  question: PremiumQuestion;
}

export function PremiumQuestionContent({ question }: PremiumQuestionContentProps) {
  return (
    <>
      {question.chapter ? (
        <p className="mb-3 text-xs font-semibold text-stone-500 dark:text-stone-400">챕터 · {question.chapter}</p>
      ) : null}
      <RichTextContent
        content={question.prompt}
        className="text-[15px] font-semibold leading-7 text-stone-950 [word-break:keep-all] dark:text-stone-100 sm:text-base"
      />
      {question.boxes && question.boxes.length > 0 ? (
        <div className="mt-5 space-y-3">
          {question.boxes.map((box, index) => (
            <div key={`${question.id}-box-${index}`} className="app-subtle-surface rounded-xl border px-4 py-3">
              <RichTextContent content={box} className="text-sm leading-6 text-stone-800 [word-break:keep-all] dark:text-stone-200" />
            </div>
          ))}
        </div>
      ) : null}
      {question.source ? (
        <p className="mt-4 text-xs italic text-stone-500 dark:text-stone-400">출처: {question.source}</p>
      ) : null}
    </>
  );
}
