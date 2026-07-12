import type { MiniAppDefinition } from "../types";

export const lbtiApp = {
  id: "lbti",
  name: "LBTI: 로스쿨생 MBTI 테스트",
  description: "30개의 질문으로 알아보는 나의 로스쿨 공부 의사결정 유형 테스트예요.",
  status: "available",
  icon: "L",
  iconClass: "bg-red-100 text-red-700 dark:bg-red-950/70 dark:text-red-300",
  route: "/apps/lbti",
} satisfies MiniAppDefinition;
