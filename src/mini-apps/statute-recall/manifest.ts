import type { MiniAppDefinition } from "../types";

export const statuteRecallApp = {
  id: "statute-recall",
  name: "조문 리콜",
  description: "빈칸과 키워드 퀴즈로 자주 보는 조문을 짧게 떠올리고 확인해요.",
  status: "coming-soon",
  icon: "법",
  iconClass: "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300",
} satisfies MiniAppDefinition;
