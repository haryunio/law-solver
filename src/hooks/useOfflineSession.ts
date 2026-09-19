import { useMemo } from "react";
import { useTestStore } from "../store/useTestStore";
import { materializeOfflineSession } from "../lib/offlineProblemSets";
import { getOfflineProblemSetPath } from "../lib/offlineSession";

/** Only the active session is combined with its shared questions for the existing CBT UI. */
export function useOfflineSession(sessionId: string) {
  const record = useTestStore((state) => state.sessions.find((item) => item.id === sessionId));
  const problemSet = useTestStore((state) => state.problemSets.find((item) => item.id === record?.problem_set_id));
  const session = useMemo(
    () => record && problemSet ? materializeOfflineSession(problemSet, record) : undefined,
    [problemSet, record],
  );
  return {
    session,
    record,
    problemSet,
    sessionsPath: problemSet ? getOfflineProblemSetPath(problemSet.id, problemSet.subject_id) : "/dashboard",
  };
}
