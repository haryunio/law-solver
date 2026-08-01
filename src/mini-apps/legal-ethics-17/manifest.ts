import type { MiniAppDefinition } from "../types";

export const legalEthics17App = {
  id: "legal-ethics-17",
  name: "제17회 법조윤리시험 가답안",
  description: "제17회 법조윤리시험 1~40번 가답안과 해설을 확인하고 내 답안을 바로 채점하세요.",
  status: "available",
  icon: "17",
  iconClass: "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300",
  route: "/apps/legal-ethics-17",
} satisfies MiniAppDefinition;
