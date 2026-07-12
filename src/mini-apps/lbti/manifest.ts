import type { MiniAppDefinition } from "../types";

export const lbtiApp = {
  id: "lbti",
  name: "LBTI: 로스쿨생 MBTI 테스트",
  description: "로스쿨 생활 속 나의 성향을 알아보는 테스트를 준비하고 있어요.",
  status: "coming-soon",
  icon: "L",
  iconClass: "bg-red-100 text-red-700 dark:bg-red-950/70 dark:text-red-300",
} satisfies MiniAppDefinition;
