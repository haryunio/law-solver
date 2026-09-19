import { matchPath } from "react-router-dom";

const standardUiPaths = [
  "/", "/home", "/apps", "/account", "/settings", "/debug/designsystem",
  "/dashboard", "/dashboard/:subjectId", "/dashboard/:subjectId/problem-sets/:problemSetId",
  "/premium", "/premium/courses/:courseId", "/premium/courses/:courseId/problem-sets/:problemSetId",
];

export const usesStandardUi = (pathname: string) =>
  standardUiPaths.some((path) => matchPath({ path, end: true }, pathname));
