import { useLayoutEffect, useRef, type ReactNode } from "react";

/** Keep answer controls mounted and show the next question without waiting for motion. */
export function QuestionContentMotion({ questionKey, questionIndex, children, className }: {
  questionKey: string;
  questionIndex: number;
  children: ReactNode;
  className?: string;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const previousQuestion = useRef({ key: questionKey, index: questionIndex });

  useLayoutEffect(() => {
    const previous = previousQuestion.current;
    previousQuestion.current = { key: questionKey, index: questionIndex };
    if (previous.key === questionKey) return;

    const content = contentRef.current;
    if (!content || typeof content.animate !== "function" || typeof window.matchMedia !== "function") return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (preference.matches) return;

    const direction = questionIndex >= previous.index ? 1 : -1;
    const animation = content.animate([
      { opacity: 0.88, transform: `translateX(${direction * 4}px)` },
      { opacity: 1, transform: "none" },
    ], { duration: 120, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" });
    const stopWhenReduced = () => {
      if (preference.matches) animation.cancel();
    };

    if (typeof preference.addEventListener === "function") {
      preference.addEventListener("change", stopWhenReduced);
    } else {
      preference.addListener?.(stopWhenReduced);
    }

    return () => {
      animation.cancel();
      if (typeof preference.removeEventListener === "function") {
        preference.removeEventListener("change", stopWhenReduced);
      } else {
        preference.removeListener?.(stopWhenReduced);
      }
    };
  }, [questionKey, questionIndex]);

  return <div ref={contentRef} className={className}>{children}</div>;
}
