import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppRouteBoundary, RouteLoadingScreen } from "./AppRouteBoundary";
import { RouteAnchorScroll } from "./RouteAnchorScroll";
import { LandingPage } from "../pages/LandingPage";

const OfflineDataHydrationGate = lazy(() => import("../components/storage/OfflineDataHydrationGate").then((module) => ({ default: module.OfflineDataHydrationGate })));
const DashboardPage = lazy(() => import("../pages/DashboardPage").then((module) => ({ default: module.DashboardPage })));
const ResultPage = lazy(() => import("../pages/ResultPage").then((module) => ({ default: module.ResultPage })));
const ReviewAllPage = lazy(() => import("../pages/ReviewAllPage").then((module) => ({ default: module.ReviewAllPage })));
const SolvePage = lazy(() => import("../pages/SolvePage").then((module) => ({ default: module.SolvePage })));
const SideAppsPage = lazy(() => import("../pages/SideAppsPage").then((module) => ({ default: module.SideAppsPage })));
const SubjectListPage = lazy(() => import("../pages/SubjectListPage").then((module) => ({ default: module.SubjectListPage })));
const WrongAnswersPage = lazy(() => import("../pages/WrongAnswersPage").then((module) => ({ default: module.WrongAnswersPage })));
const AccountSubscriptionPage = lazy(() => import("../pages/AccountSubscriptionPage").then((module) => ({ default: module.AccountSubscriptionPage })));
const AppHomePage = lazy(() => import("../pages/AppHomePage").then((module) => ({ default: module.AppHomePage })));
const PremiumDashboardPage = lazy(() => import("../pages/PremiumDashboardPage").then((module) => ({ default: module.PremiumDashboardPage })));
const SettingsPage = lazy(() => import("../pages/SettingsPage").then((module) => ({ default: module.SettingsPage })));
const LbtiHomePage = lazy(() => import("../mini-apps/lbti/LbtiHomePage").then((module) => ({ default: module.LbtiHomePage })));
const LbtiResultPage = lazy(() => import("../mini-apps/lbti/LbtiResultPage").then((module) => ({ default: module.LbtiResultPage })));
const LbtiTestPage = lazy(() => import("../mini-apps/lbti/LbtiTestPage").then((module) => ({ default: module.LbtiTestPage })));
const LbtiTypesPage = lazy(() => import("../mini-apps/lbti/LbtiTypesPage").then((module) => ({ default: module.LbtiTypesPage })));
const LegalEthics17Page = lazy(() => import("../mini-apps/legal-ethics-17/LegalEthics17Page").then((module) => ({ default: module.LegalEthics17Page })));
const HobanCourseRegistrationPage = lazy(() => import("../mini-apps/hoban-course-registration/HobanCourseRegistrationPage").then((module) => ({ default: module.HobanCourseRegistrationPage })));
const PremiumCoursePage = lazy(() => import("../pages/PremiumCoursePage").then((module) => ({ default: module.PremiumCoursePage })));
const PremiumSolvePage = lazy(() => import("../pages/PremiumSolvePage").then((module) => ({ default: module.PremiumSolvePage })));
const PremiumResultPage = lazy(() => import("../pages/PremiumResultPage").then((module) => ({ default: module.PremiumResultPage })));
const PremiumSessionPage = lazy(() => import("../pages/PremiumSessionPage").then((module) => ({ default: module.PremiumSessionPage })));
const PremiumProblemSetSessionsPage = lazy(() => import("../pages/PremiumProblemSetSessionsPage").then((module) => ({ default: module.PremiumProblemSetSessionsPage })));

export function AppRoutes() {
  const { pathname } = useLocation();
  return (
    <AppRouteBoundary key={pathname}>
      <Suspense fallback={<RouteLoadingScreen />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/apps" element={<SideAppsPage />} />
          <Route path="/apps/hoban-course-registration" element={<HobanCourseRegistrationPage />} />
          <Route path="/apps/legal-ethics-17" element={<LegalEthics17Page />} />
          <Route path="/apps/lbti" element={<LbtiHomePage />} />
          <Route path="/apps/lbti/test" element={<LbtiTestPage />} />
          <Route path="/apps/lbti/types" element={<LbtiTypesPage />} />
          <Route path="/apps/lbti/result/:typeCode" element={<LbtiResultPage />} />
          <Route path="/home" element={<AppHomePage />} />
          <Route path="/settings" element={<OfflineDataHydrationGate><SettingsPage /></OfflineDataHydrationGate>} />
          <Route path="/account" element={<AccountSubscriptionPage />} />
          <Route path="/premium" element={<PremiumDashboardPage />} />
          <Route path="/premium/courses/:courseId" element={<PremiumCoursePage />} />
          <Route
            path="/premium/courses/:courseId/problem-sets/:problemSetId"
            element={<PremiumProblemSetSessionsPage />}
          />
          <Route path="/premium/attempts/:attemptId" element={<PremiumSolvePage />} />
          <Route path="/premium/results/:attemptId" element={<PremiumResultPage />} />
          <Route path="/premium/wrong/:attemptId" element={<PremiumSessionPage view="wrong" />} />
          <Route path="/premium/review/:attemptId" element={<PremiumSessionPage view="review" />} />
          <Route path="/dashboard" element={<OfflineDataHydrationGate><SubjectListPage /></OfflineDataHydrationGate>} />
          <Route path="/dashboard/:subjectId" element={<OfflineDataHydrationGate><DashboardPage /></OfflineDataHydrationGate>} />
          <Route path="/solve/:sessionId" element={<OfflineDataHydrationGate><SolvePage /></OfflineDataHydrationGate>} />
          <Route path="/result/:sessionId" element={<OfflineDataHydrationGate><ResultPage /></OfflineDataHydrationGate>} />
          <Route path="/wrong/:sessionId" element={<OfflineDataHydrationGate><WrongAnswersPage /></OfflineDataHydrationGate>} />
          <Route path="/review/:sessionId" element={<OfflineDataHydrationGate><ReviewAllPage /></OfflineDataHydrationGate>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <RouteAnchorScroll />
      </Suspense>
    </AppRouteBoundary>
  );
}
