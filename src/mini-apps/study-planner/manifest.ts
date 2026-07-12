import type { MiniAppDefinition } from "../types";

export const studyPlannerApp = {
  id: "study-planner",
  name: "스터디 플래너",
  description: "과목별 공부 계획과 오늘의 할 일을 한눈에 정리하고 점검해요.",
  status: "coming-soon",
  icon: "✓",
  iconClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300",
} satisfies MiniAppDefinition;
