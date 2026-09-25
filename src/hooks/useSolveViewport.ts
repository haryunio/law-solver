import { useLayoutEffect, type RefObject } from "react";

const heightProperty = "--cbt-viewport-height";
const topProperty = "--cbt-viewport-top";

/** Keep the solve surface inside the visible area, including an open keyboard. */
export function useSolveViewport(ref: RefObject<HTMLDivElement>, enabled: boolean) {
  useLayoutEffect(() => {
    const surface = ref.current;
    if (!enabled || !surface) return;

    const root = document.documentElement;
    const viewport = window.visualViewport;
    const clearDimensions = () => {
      surface.style.removeProperty(heightProperty);
      surface.style.removeProperty(topProperty);
    };
    const setDimension = (property: string, value: number) => {
      const pixels = `${value}px`;
      if (surface.style.getPropertyValue(property) !== pixels) {
        surface.style.setProperty(property, pixels);
      }
    };
    const updateDimensions = () => {
      // Resizing the surface during pinch zoom would counteract the user's zoom.
      if (viewport && viewport.scale !== 1) return;

      setDimension(heightProperty, viewport?.height ?? window.innerHeight);
      setDimension(topProperty, viewport?.offsetTop ?? 0);
    };

    root.classList.add("cbt-viewport");
    updateDimensions();
    viewport?.addEventListener("resize", updateDimensions);
    viewport?.addEventListener("scroll", updateDimensions);
    window.addEventListener("resize", updateDimensions);

    return () => {
      viewport?.removeEventListener("resize", updateDimensions);
      viewport?.removeEventListener("scroll", updateDimensions);
      window.removeEventListener("resize", updateDimensions);
      clearDimensions();
      root.classList.remove("cbt-viewport");
    };
  }, [enabled, ref]);
}
