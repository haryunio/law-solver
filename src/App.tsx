import { Navigate, Route, Routes } from "react-router-dom";
import { useEffect } from "react";
import { useSettingsStore } from "./store/useSettingsStore";
import { DashboardPage } from "./pages/DashboardPage";
import { LandingPage } from "./pages/LandingPage";
import { ResultPage } from "./pages/ResultPage";
import { ReviewAllPage } from "./pages/ReviewAllPage";
import { SolvePage } from "./pages/SolvePage";
import { SideAppsPage } from "./pages/SideAppsPage";
import { SubjectListPage } from "./pages/SubjectListPage";
import { WrongAnswersPage } from "./pages/WrongAnswersPage";
import { PageViewTracker } from "./components/analytics/PageViewTracker";
import { RouteMetadata } from "./components/seo/RouteMetadata";
import { LbtiHomePage } from "./mini-apps/lbti/LbtiHomePage";
import { LbtiResultPage } from "./mini-apps/lbti/LbtiResultPage";
import { LbtiTestPage } from "./mini-apps/lbti/LbtiTestPage";
import { LbtiTypesPage } from "./mini-apps/lbti/LbtiTypesPage";

function ThemeWatcher() {
  const darkMode = useSettingsStore((state) => state.darkMode);
  const fontFamily = useSettingsStore((state) => state.fontFamily);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  useEffect(() => {
    const fonts = ["font-pretendard", "font-nanum-gothic", "font-nanum-myeongjo"];
    document.documentElement.classList.remove(...fonts);
    document.documentElement.classList.add(`font-${fontFamily}`);
  }, [fontFamily]);

  return null;
}

export default function App() {
  return (
    <>
      <ThemeWatcher />
      <RouteMetadata />
      <PageViewTracker />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/apps" element={<SideAppsPage />} />
        <Route path="/apps/lbti" element={<LbtiHomePage />} />
        <Route path="/apps/lbti/test" element={<LbtiTestPage />} />
        <Route path="/apps/lbti/types" element={<LbtiTypesPage />} />
        <Route path="/apps/lbti/result/:typeCode" element={<LbtiResultPage />} />
        <Route path="/dashboard" element={<SubjectListPage />} />
        <Route path="/dashboard/:subjectId" element={<DashboardPage />} />
        <Route path="/solve/:sessionId" element={<SolvePage />} />
        <Route path="/result/:sessionId" element={<ResultPage />} />
        <Route path="/wrong/:sessionId" element={<WrongAnswersPage />} />
        <Route path="/review/:sessionId" element={<ReviewAllPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
