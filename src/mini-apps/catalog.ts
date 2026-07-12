import { focusTimerApp } from "./focus-timer/manifest";
import { lbtiApp } from "./lbti/manifest";
import { statuteRecallApp } from "./statute-recall/manifest";
import { studyPlannerApp } from "./study-planner/manifest";
import type { MiniAppDefinition } from "./types";

/** `/apps`에 노출되는 순서입니다. 새 앱은 manifest를 만든 뒤 이 배열에 추가합니다. */
export const miniApps: readonly MiniAppDefinition[] = [
  lbtiApp,
  statuteRecallApp,
  studyPlannerApp,
  focusTimerApp,
];
