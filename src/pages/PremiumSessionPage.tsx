import { useCallback, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { PremiumResultSkeleton } from "../components/premium/PremiumLoadingStates";
import {
  SessionPageProvider,
  type SessionPageAdapter,
} from "../components/session/SessionPageContext";
import { Toast } from "../components/ui/Toast";
import { PremiumLoadError } from "../components/premium/PremiumLoadError";
import { usePremiumResource } from "../hooks/usePremiumResource";
import {
  getPremiumErrorMessage,
  getPremiumResult,
  retryPremiumAttempt,
  savePremiumWrongNote,
} from "../lib/premiumApi";
import { premiumResultToTestSession } from "../lib/premiumSession";
import { ResultPage } from "./ResultPage";
import { ReviewAllPage } from "./ReviewAllPage";
import { WrongAnswersPage } from "./WrongAnswersPage";

type PremiumSessionView = "result" | "wrong" | "review";

export function PremiumSessionPage({ view }: { view: PremiumSessionView }) {
  const { attemptId } = useParams();
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    if (!attemptId) throw new Error("Missing attempt");
    return getPremiumResult(attemptId);
  }, [attemptId]);
  const { data: result, error: loadError, reload, setData: setResult } = usePremiumResource(
    attemptId ?? "",
    load,
    "채점 결과를 불러오지 못했습니다. 다시 시도하거나 온라인 과목에서 풀이 기록을 확인해 주세요.",
  );

  const session = useMemo(
    () => result ? premiumResultToTestSession(result) : null,
    [result],
  );

  const adapter = useMemo<SessionPageAdapter | null>(() => {
    if (!result || !session) return null;
    return {
      session,
      allowCsvDownload: false,
      dashboardPath: `/premium/courses/${result.courseId}/problem-sets/${result.problemSetId}`,
      solvePath: (sessionId) => `/premium/attempts/${sessionId}`,
      resultPath: (sessionId) => `/premium/results/${sessionId}`,
      wrongPath: (sessionId) => `/premium/wrong/${sessionId}`,
      reviewPath: (sessionId) => `/premium/review/${sessionId}`,
      createRetry: async ({ sourceSessionId, mode, title, orderMode }) => {
        try {
          const attempt = await retryPremiumAttempt(
            sourceSessionId,
            mode,
            title,
            orderMode,
          );
          return attempt.id;
        } catch (cause) {
          throw new Error(getPremiumErrorMessage(
            cause,
            "재풀이를 준비하지 못했습니다. 잠시 후 다시 시도해 주세요.",
          ));
        }
      },
      saveWrongNote: async (questionId, note) => {
        try {
          const nextResult = await savePremiumWrongNote(
            result.id,
            questionId,
            note,
            result.revision,
          );
          setResult(nextResult);
        } catch (cause) {
          setError(getPremiumErrorMessage(
            cause,
            "오답 노트를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.",
          ));
          throw cause;
        }
      },
    };
  }, [result, session, setResult]);

  if (!adapter) {
    if (!loadError) {
      return <PremiumResultSkeleton review={view !== "result"} />;
    }
    return (
      <div className="app-page flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-lg">
          <PremiumLoadError message={loadError} onRetry={reload} backTo="/premium" />
        </div>
      </div>
    );
  }

  return (
    <SessionPageProvider adapter={adapter}>
      {view === "result" ? <ResultPage /> : view === "wrong" ? <WrongAnswersPage /> : <ReviewAllPage />}
      <Toast message={error} onDismiss={() => setError(null)} />
    </SessionPageProvider>
  );
}
