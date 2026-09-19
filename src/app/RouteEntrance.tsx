import type { ReactNode } from "react";
import { matchPath, useLocation } from "react-router-dom";

// Only navigation and results opt in. Solve, wrong-answer and review routes stay immediate.
const entranceGroups = [
  { className: "app-route-enter-home", paths: ["/home"] },
  { className: "app-route-enter-subjects", paths: ["/dashboard", "/premium"] },
  { className: "app-route-enter-problems", paths: ["/dashboard/:subjectId", "/premium/courses/:courseId"] },
  { className: "app-route-enter-sessions", paths: ["/dashboard/:subjectId/problem-sets/:problemSetId", "/premium/courses/:courseId/problem-sets/:problemSetId"] },
  { className: "app-route-enter-results", paths: ["/result/:sessionId", "/premium/results/:attemptId"] },
];

export function RouteEntrance({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const entrance = entranceGroups.find(({ paths }) => paths.some((path) => matchPath({ path, end: true }, pathname)));
  if (!entrance) return <>{children}</>;

  // Only marked lists and cards enter. GNB, footers and modal roots stay outside this motion.
  // No timed state or exit phase holds up navigation or input.
  return <div className={`app-route-enter ${entrance.className} contents`}>{children}</div>;
}
