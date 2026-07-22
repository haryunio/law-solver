import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { PremiumResultSkeleton } from "../components/premium/PremiumLoadingStates";
import {
  SessionPageProvider,
  type SessionPageAdapter,
} from "../components/session/SessionPageContext";
import { Toast } from "../components/ui/Toast";
import {
  getPremiumErrorMessage,
  getPremiumResult,
  retryPremiumAttempt,
  savePremiumWrongNote,
  type PremiumAttemptResult,
} from "../lib/premiumApi";
import { premiumResultToTestSession } from "../lib/premiumSession";
import { ResultPage } from "./ResultPage";
import { ReviewAllPage } from "./ReviewAllPage";
import { WrongAnswersPage } from "./WrongAnswersPage";

type PremiumSessionView = "result" | "wrong" | "review";

export function PremiumSessionPage({ view }: { view: PremiumSessionView }) {
  const { attemptId } = useParams();
  const [result, setResult] = useState<PremiumAttemptResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!attemptId) {
      setError("풀이 결과를 찾을 수 없습니다. 온라인 과목에서 풀이 기록을 다시 확인해 주세요.");
      return;
    }

    let cancelled = false;
    void getPremiumResult(attemptId)
      .then((data) => {
        if (!cancelled) setResult(data);
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setError(getPremiumErrorMessage(
            cause,
            "채점 결과를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
          ));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [attemptId]);

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
        }
      },
    };
  }, [result, session]);

  if (!adapter) {
    if (!error) {
      return <PremiumResultSkeleton review={view !== "result"} />;
    }
    return (
      <div className="app-page flex min-h-screen items-center justify-center px-4">
        <Toast message={error} onDismiss={() => setError(null)} />
        <div className="app-card max-w-lg rounded-2xl border p-6 text-center text-sm text-stone-600 dark:text-stone-300">
          {error}
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
