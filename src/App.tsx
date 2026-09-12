import { PageViewTracker } from "./components/analytics/PageViewTracker";
import { MiniAppEntryScrollReset } from "./components/navigation/MiniAppEntryScrollReset";
import { RouteMetadata } from "./components/seo/RouteMetadata";
import { AccountWatcher, ThemeWatcher } from "./app/AppWatchers";
import { AppRoutes } from "./app/AppRoutes";

export default function App() {
  return (
    <>
      <ThemeWatcher />
      <AccountWatcher />
      <RouteMetadata />
      <PageViewTracker />
      <MiniAppEntryScrollReset />
      <AppRoutes />
    </>
  );
}
