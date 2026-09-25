import { useLayoutEffect, useRef, type RefObject } from "react";

/** Animate content-driven height changes without animating the available viewport. */
export function useQuestionPanelHeightMotion(
  panelRef: RefObject<HTMLElement>,
  questionKey: string | undefined,
  revealAnswer: boolean,
) {
  const measureRef = useRef<(() => void) | null>(null);
  const enabled = Boolean(questionKey);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    const workspace = panel?.parentElement;
    if (!enabled || !panel || !workspace) return;

    const preference = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    let lastHeight = panel.getBoundingClientRect().height;
    let workspaceBounds = workspace.getBoundingClientRect();
    let motion: Animation | null = null;
    let active = true;
    const stopAndMeasure = () => {
      motion?.cancel();
      motion = null;
      lastHeight = panel.getBoundingClientRect().height;
      workspaceBounds = workspace.getBoundingClientRect();
    };
    const measure = () => {
      const from = motion ? panel.getBoundingClientRect().height : lastHeight;
      motion?.cancel();
      motion = null;
      const to = panel.getBoundingClientRect().height;
      lastHeight = to;
      if (window.innerWidth < 768 || !preference || preference.matches || !panel.animate || Math.abs(to - from) < 1) return;

      const animation = panel.animate([{ height: `${from}px` }, { height: `${to}px` }], {
        duration: 140,
        easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
      });
      motion = animation;
      void animation.finished.then(() => {
        if (!active || motion !== animation) return;
        motion = null;
        // Catch content that changed while its observer was ignored during motion.
        measure();
      }, () => {});
    };
    measureRef.current = measure;

    // Observe intrinsic content, never the height that this animation changes.
    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(() => {
      const nextBounds = workspace.getBoundingClientRect();
      if (Math.abs(nextBounds.width - workspaceBounds.width) >= 1 || Math.abs(nextBounds.height - workspaceBounds.height) >= 1) {
        stopAndMeasure();
      } else if (!motion) {
        measure();
      }
    }) : null;
    observer?.observe(workspace);
    for (const content of [
      panel.querySelector(".cbt-question-toolbar"),
      panel.querySelector(".cbt-question-content")?.firstElementChild,
      panel.querySelector(".cbt-navigation"),
    ]) {
      if (content) observer?.observe(content);
    }

    const viewport = window.visualViewport;
    window.addEventListener("resize", stopAndMeasure);
    viewport?.addEventListener("resize", stopAndMeasure);
    viewport?.addEventListener("scroll", stopAndMeasure);
    const onPreferenceChange = () => { if (preference?.matches) stopAndMeasure(); };
    if (preference?.addEventListener) preference.addEventListener("change", onPreferenceChange);
    else preference?.addListener?.(onPreferenceChange);

    return () => {
      active = false;
      motion?.cancel();
      observer?.disconnect();
      window.removeEventListener("resize", stopAndMeasure);
      viewport?.removeEventListener("resize", stopAndMeasure);
      viewport?.removeEventListener("scroll", stopAndMeasure);
      if (preference?.removeEventListener) preference.removeEventListener("change", onPreferenceChange);
      else preference?.removeListener?.(onPreferenceChange);
      measureRef.current = null;
    };
  }, [enabled, panelRef]);

  useLayoutEffect(() => { measureRef.current?.(); }, [questionKey, revealAnswer]);
}
