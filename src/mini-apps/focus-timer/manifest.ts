import type { MiniAppDefinition } from "../types";

export const focusTimerApp = {
  id: "focus-timer",
  name: "집중 타이머",
  description: "공부와 휴식 시간을 나누어 기록하고 나만의 학습 리듬을 만들어요.",
  status: "coming-soon",
  icon: "25",
  iconClass: "bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300",
} satisfies MiniAppDefinition;
