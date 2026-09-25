import { RichTextContent } from "../ui/RichTextContent";

const passageMarkers = ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];

/** Shared presentation only: preserve the original passage order and safe markup. */
export function QuestionPassages({ boxes, compact = false }: {
  boxes?: readonly string[];
  compact?: boolean;
}) {
  if (!boxes?.length) return null;
  return (
    <div className="app-study-inset mt-4 rounded-xl border p-4">
      <div className="space-y-2">
        {boxes.map((box, index) => (
          <div key={index} className={`flex gap-2 leading-relaxed ${compact ? "text-xs md:text-sm" : "text-sm md:text-base"}`}>
            <span className="shrink-0 font-bold">{passageMarkers[index] ?? index + 1}.</span>
            <RichTextContent content={box.replace(/^[ㄱ-ㅎ]\.\s*/, "")} className="min-w-0 flex-1 text-stone-800 dark:text-stone-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
