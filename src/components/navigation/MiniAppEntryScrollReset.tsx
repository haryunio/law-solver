import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { miniApps } from "../../mini-apps/catalog";

const miniAppEntryRoutes = new Set(
  miniApps.flatMap((app) => (app.route ? [app.route] : [])),
);

export function MiniAppEntryScrollReset() {
  const location = useLocation();

  useEffect(() => {
    if (!miniAppEntryRoutes.has(location.pathname as `/apps/${string}`)) return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);

  return null;
}
