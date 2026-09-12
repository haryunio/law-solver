import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

/** Mount inside Suspense so anchors are resolved after the destination screen exists. */
export function RouteAnchorScroll() {
  const { pathname, hash } = useLocation();
  useLayoutEffect(() => {
    if (!hash) return;
    try {
      document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ behavior: "auto" });
    } catch {
      // A malformed fragment must not prevent the page from opening.
    }
  }, [pathname, hash]);
  return null;
}
