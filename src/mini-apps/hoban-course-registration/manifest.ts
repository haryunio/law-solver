import type { MiniAppDefinition } from "../types";

export const hobanCourseRegistrationApp = {
  id: "hoban-course-registration",
  name: "호반대학교 수강신청 연습",
  description: "실제 수강신청 화면처럼 신청 순서를 연습하고 기록을 확인해 보세요.",
  status: "beta",
  icon: "수강",
  iconClass: "bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-300",
  premium: true,
  route: "/apps/hoban-course-registration",
} satisfies MiniAppDefinition;
