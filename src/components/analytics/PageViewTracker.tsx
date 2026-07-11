import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { getAnalyticsPage, trackPageView } from "../../lib/analytics";

export function PageViewTracker() {
  const location = useLocation();
  const previousPagePathRef = useRef<string>();

  useEffect(() => {
    const page = getAnalyticsPage(location.pathname);
    if (!page) return;

    trackPageView(location.pathname, previousPagePathRef.current);
    previousPagePathRef.current = page.pagePath;
  }, [location.pathname]);

  return null;
}
