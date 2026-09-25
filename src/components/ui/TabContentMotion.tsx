import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

/** Animate an existing panel without remounting forms or delaying tab changes. */
export function TabContentMotion({ activeIndex, children, className = "" }: {
  activeIndex: number;
  children: ReactNode;
  className?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [motion, setMotion] = useState({ index: activeIndex, direction: 0 });
  if (motion.index !== activeIndex) {
    setMotion({ index: activeIndex, direction: activeIndex > motion.index ? 1 : -1 });
  }

  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!motion.direction || !panel?.animate) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (preference.matches) return;
    const animation = panel.animate([
      { opacity: 0.85, transform: `translateX(${motion.direction * 8}px)` },
      { opacity: 1, transform: "none" },
    ], { duration: 160, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" });
    const stop = () => { if (preference.matches) animation.cancel(); };
    preference.addEventListener("change", stop);
    return () => {
      animation.cancel();
      preference.removeEventListener("change", stop);
    };
  }, [motion]);

  return <div ref={panelRef} className={className} data-tab-switched={motion.direction ? "true" : undefined}>{children}</div>;
}
