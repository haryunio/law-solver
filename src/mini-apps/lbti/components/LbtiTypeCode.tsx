import type { PoleCode, TypeCode } from "../lib/lbti";

const poleTone: Record<PoleCode, string> = {
  P: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/60 dark:text-red-300",
  T: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950/60 dark:text-orange-300",
  W: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-300",
  C: "border-lime-200 bg-lime-50 text-lime-800 dark:border-lime-900 dark:bg-lime-950/60 dark:text-lime-300",
  R: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300",
  O: "border-cyan-200 bg-cyan-50 text-cyan-800 dark:border-cyan-900 dark:bg-cyan-950/60 dark:text-cyan-300",
  S: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-300",
  D: "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900 dark:bg-violet-950/60 dark:text-violet-300",
};

export function LbtiTypeCode({ code, large = false }: { code: TypeCode; large?: boolean }) {
  return (
    <span className="inline-flex gap-1.5" aria-label={`LBTI 유형 ${code}`}>
      {[...code].map((letter, index) => (
        <span
          key={`${letter}-${index}`}
          aria-hidden="true"
          className={[
            "grid place-items-center rounded-xl border font-black shadow-sm",
            large ? "h-14 w-12 text-2xl sm:h-16 sm:w-14 sm:text-3xl" : "h-9 w-8 text-sm",
            poleTone[letter as PoleCode],
          ].join(" ")}
        >
          {letter}
        </span>
      ))}
    </span>
  );
}
