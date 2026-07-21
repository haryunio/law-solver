import { TestType } from "../types/test";

export const GA_MEASUREMENT_ID = "G-DRXS2G7E5F";

export type AnalyticsPageType =
  | "main"
  | "mini_apps"
  | "mini_app"
  | "app_home"
  | "settings"
  | "account"
  | "premium_dashboard"
  | "subject_dashboard"
  | "problem_dashboard"
  | "solve"
  | "result"
  | "review";

export type AnalyticsQuestionType = "ox" | "multiple_choice" | "short_answer";
export type SolveEntry =
  | "upload"
  | "resume"
  | "direct"
  | "retry_all"
  | "retry_wrong"
  | "retry_bookmarked";
export type RetryType = "all" | "wrong" | "bookmarked";
export type ReviewType = "all" | "wrong" | "bookmarked";
export type QuestionNavigationMethod =
  | "next_button"
  | "inline_next"
  | "enter"
  | "previous_button"
  | "omr"
  | "pause"
  | "submit";

type AnalyticsParameterValue = string | number | boolean;
type AnalyticsParameters = Record<string, AnalyticsParameterValue | undefined>;

interface AnalyticsEventMap {
  problem_upload_completed: {
    question_type: AnalyticsQuestionType;
  };
  problem_upload_failed: {
    question_type: AnalyticsQuestionType;
    failure_type: "read_or_parse";
  };
  solve_started: {
    question_type: AnalyticsQuestionType;
    solve_entry: SolveEntry;
  };
  solve_paused: {
    question_type: AnalyticsQuestionType;
  };
  question_completed: {
    question_type: AnalyticsQuestionType;
    navigation_method: QuestionNavigationMethod;
  };
  solve_completed: {
    question_type: AnalyticsQuestionType;
  };
  review_started: {
    review_type: ReviewType;
    question_type: AnalyticsQuestionType;
  };
  review_question_viewed: {
    review_type: ReviewType;
    question_type: AnalyticsQuestionType;
  };
  retry_created: {
    retry_type: RetryType;
    question_type: AnalyticsQuestionType;
  };
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const pageDefinitions: Array<{
  matches: (pathname: string) => boolean;
  pageType: AnalyticsPageType;
  pagePath: string;
  pageTitle: string;
}> = [
  {
    matches: (pathname) => pathname === "/",
    pageType: "main",
    pagePath: "/",
    pageTitle: "메인",
  },
  {
    matches: (pathname) => pathname === "/apps",
    pageType: "mini_apps",
    pagePath: "/apps",
    pageTitle: "미니 앱",
  },
  {
    matches: (pathname) => pathname.startsWith("/apps/"),
    pageType: "mini_app",
    pagePath: "/apps/mini-app",
    pageTitle: "미니 앱 실행",
  },
  {
    matches: (pathname) => pathname === "/home",
    pageType: "app_home",
    pagePath: "/home",
    pageTitle: "서비스 홈",
  },
  {
    matches: (pathname) => pathname === "/settings",
    pageType: "settings",
    pagePath: "/settings",
    pageTitle: "환경설정",
  },
  {
    matches: (pathname) => pathname === "/account",
    pageType: "account",
    pagePath: "/account",
    pageTitle: "계정 및 구독",
  },
  {
    matches: (pathname) => pathname === "/premium",
    pageType: "premium_dashboard",
    pagePath: "/premium",
    pageTitle: "온라인 문제 풀이",
  },
  {
    matches: (pathname) => pathname === "/dashboard",
    pageType: "subject_dashboard",
    pagePath: "/dashboard",
    pageTitle: "과목 대시보드",
  },
  {
    matches: (pathname) => pathname.startsWith("/dashboard/"),
    pageType: "problem_dashboard",
    pagePath: "/dashboard/subject",
    pageTitle: "문제 대시보드",
  },
  {
    matches: (pathname) => pathname.startsWith("/solve/"),
    pageType: "solve",
    pagePath: "/solve",
    pageTitle: "문제 풀이",
  },
  {
    matches: (pathname) => pathname.startsWith("/result/"),
    pageType: "result",
    pagePath: "/result",
    pageTitle: "풀이 결과",
  },
  {
    matches: (pathname) =>
      pathname.startsWith("/wrong/") || pathname.startsWith("/review/"),
    pageType: "review",
    pagePath: "/review",
    pageTitle: "문제 리뷰",
  },
];

const isAnalyticsEnabled = () =>
  typeof window !== "undefined" &&
  window.location.hostname === "lawsolver.haryun.io" &&
  typeof window.gtag === "function";

export const getAnalyticsPage = (pathname: string) =>
  pageDefinitions.find((definition) => definition.matches(pathname)) ?? null;

export const toAnalyticsQuestionType = (type: TestType): AnalyticsQuestionType => {
  if (type === "OX") return "ox";
  if (type === "5-choice") return "multiple_choice";
  return "short_answer";
};

export function trackEvent<EventName extends keyof AnalyticsEventMap>(
  eventName: EventName,
  parameters: AnalyticsEventMap[EventName],
) {
  if (!isAnalyticsEnabled()) return;
  window.gtag?.("event", eventName, parameters as AnalyticsParameters);
}

export function trackPageView(pathname: string, previousPagePath?: string) {
  if (!isAnalyticsEnabled()) return;
  const page = getAnalyticsPage(pathname);
  if (!page) return;

  const origin = window.location.origin;
  const pageLocation = `${origin}${page.pagePath}`;
  window.gtag?.("config", GA_MEASUREMENT_ID, {
    send_page_view: false,
    page_title: page.pageTitle,
    page_location: pageLocation,
  });
  window.gtag?.("event", "page_view", {
    page_title: page.pageTitle,
    page_location: pageLocation,
    page_path: page.pagePath,
    page_type: page.pageType,
    ...(previousPagePath ? { page_referrer: `${origin}${previousPagePath}` } : {}),
  });
}
