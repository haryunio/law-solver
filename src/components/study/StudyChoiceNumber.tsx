/** Draw the marker independently of the selected font's circled-number glyphs. */
export function StudyChoiceNumber({ number, className = "" }: { number: number; className?: string }) {
  return (
    <span className={`inline-flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-full border border-current text-[10px] font-semibold leading-none tabular-nums ${className}`}>
      {number}
    </span>
  );
}
