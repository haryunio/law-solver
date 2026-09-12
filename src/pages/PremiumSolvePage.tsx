import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CbtSolveScreen } from "../components/cbt/CbtSolveScreen";
import { PremiumSolveSkeleton } from "../components/premium/PremiumLoadingStates";
import { AsyncTransitionOverlay } from "../components/ui/AsyncLoading";
import { Toast } from "../components/ui/Toast";
import {
  getPremiumAttempt,
  getPremiumErrorMessage,
  getPremiumQuestionSolution,
  pausePremiumAttempt,
  resumePremiumAttempt,
  savePremiumAnswer,
  setPremiumBookmark,
  submitPremiumAttempt,
  type PremiumAttempt,
} from "../lib/premiumApi";
import { premiumAttemptToTestSession } from "../lib/premiumSession";
import type { AnswerValue } from "../types/test";

type PendingChange<T> = { value: T };

export function PremiumSolvePage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState<PremiumAttempt | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<"pause" | "submit" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const displayedAttemptRef = useRef<PremiumAttempt | null>(null);
  const serverAttemptRef = useRef<PremiumAttempt | null>(null);
  const pendingMutationsRef = useRef<Promise<void>>(Promise.resolve());
  const dirtyAnswersRef = useRef(new Map<string, PendingChange<string>>());
  const dirtyBookmarksRef = useRef(new Map<string, PendingChange<boolean>>());
  const mutationErrorRef = useRef<unknown>(null);
  const actionInProgressRef = useRef(false);

  const replaceAttempt = useCallback((nextAttempt: PremiumAttempt) => {
    dirtyAnswersRef.current.clear();
    dirtyBookmarksRef.current.clear();
    displayedAttemptRef.current = nextAttempt;
    serverAttemptRef.current = nextAttempt;
    setAttempt(nextAttempt);
    setElapsedSeconds(nextAttempt.elapsedSeconds);
  }, []);

  const mergeServerAttempt = useCallback((nextAttempt: PremiumAttempt) => {
    const localAttempt = displayedAttemptRef.current;
    const localQuestions = new Map(
      localAttempt?.questions.map((question) => [question.id, question]) ?? [],
    );
    const mergedAttempt: PremiumAttempt = {
      ...nextAttempt,
      questions: nextAttempt.questions.map((question) => {
        const localQuestion = localQuestions.get(question.id);
        return localQuestion
          ? {
              ...question,
              answer: localQuestion.answer,
              bookmarked: localQuestion.bookmarked,
              correctAnswer: localQuestion.correctAnswer,
              acceptedAnswers: localQuestion.acceptedAnswers,
              explanation: localQuestion.explanation,
            }
          : question;
      }),
    };
    serverAttemptRef.current = nextAttempt;
    displayedAttemptRef.current = mergedAttempt;
    setAttempt(mergedAttempt);
    setElapsedSeconds((current) => Math.max(current, nextAttempt.elapsedSeconds));
  }, []);

  const updateDisplayedAttempt = useCallback(
    (update: (current: PremiumAttempt) => PremiumAttempt) => {
      const current = displayedAttemptRef.current;
      if (!current) return;
      const next = update(current);
      displayedAttemptRef.current = next;
      setAttempt(next);
    },
    [],
  );

  const recoverFromMutationError = useCallback(async (cause: unknown) => {
    setError(getPremiumErrorMessage(
      cause,
      "풀이 내용을 저장하지 못했습니다. 인터넷 연결을 확인한 뒤 다시 시도해 주세요.",
    ));
    if (!attemptId) return;
    try {
      mergeServerAttempt(await getPremiumAttempt(attemptId));
    } catch {
      // The original mutation error is more actionable than a follow-up refresh failure.
    }
  }, [attemptId, mergeServerAttempt]);

  const enqueueMutation = useCallback((
    request: (serverAttempt: PremiumAttempt) => Promise<PremiumAttempt>,
  ) => {
    pendingMutationsRef.current = pendingMutationsRef.current
      .then(async () => {
        const current = serverAttemptRef.current;
        if (!current || current.status !== "in_progress") throw new Error("Attempt is not active");
        mergeServerAttempt(await request(current));
      })
      .catch(async (cause: unknown) => {
        mutationErrorRef.current = cause;
        await recoverFromMutationError(cause);
      });
  }, [mergeServerAttempt, recoverFromMutationError]);

  useEffect(() => {
    if (!attemptId) {
      setError("풀이 정보를 찾을 수 없습니다. 온라인 문제 목록에서 다시 시작해 주세요.");
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    void getPremiumAttempt(attemptId)
      .then(async (data) => {
        if (cancelled) return null;
        if (data.status === "submitted") {
          navigate(`/premium/results/${data.id}`, { replace: true });
          return null;
        }
        return data.status === "paused"
          ? resumePremiumAttempt(data.id, data.revision)
          : data;
      })
      .then((data) => {
        if (!cancelled && data) replaceAttempt(data);
      })
      .catch(async (cause: unknown) => {
        if (cancelled) return;
        try {
          const latestAttempt = await getPremiumAttempt(attemptId);
          if (cancelled) return;
          if (latestAttempt.status === "in_progress") {
            replaceAttempt(latestAttempt);
            return;
          }
        } catch {
          // Keep the original load error because it best explains what the learner attempted.
        }
        setError(getPremiumErrorMessage(
          cause,
          "풀이를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
        ));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [attemptId, navigate, replaceAttempt]);

  const session = useMemo(
    () => attempt ? premiumAttemptToTestSession(attempt, elapsedSeconds) : null,
    [attempt, elapsedSeconds],
  );

  const handleAnswerChange = useCallback((questionId: string, answer: AnswerValue) => {
    if (actionInProgressRef.current) return;
    const answerValue = String(answer);
    setError(null);
    dirtyAnswersRef.current.set(questionId, { value: answerValue });
    updateDisplayedAttempt((current) => ({
      ...current,
      questions: current.questions.map((question) =>
        question.id === questionId ? { ...question, answer: answerValue } : question
      ),
    }));
  }, [updateDisplayedAttempt]);

  const handleQuestionLeave = useCallback((questionId: string) => {
    const change = dirtyAnswersRef.current.get(questionId);
    if (!change) return;
    enqueueMutation(async (current) => {
      const saved = await savePremiumAnswer(current.id, questionId, change.value, current.revision);
      // Compare the edit identity, including when a learner changes A to B and back to A.
      if (dirtyAnswersRef.current.get(questionId) === change) dirtyAnswersRef.current.delete(questionId);
      return saved;
    });
  }, [enqueueMutation]);

  const saveBookmark = useCallback((questionId: string, change: PendingChange<boolean>) => {
    enqueueMutation(async (current) => {
      const saved = await setPremiumBookmark(current.id, questionId, change.value, current.revision);
      if (dirtyBookmarksRef.current.get(questionId) === change) dirtyBookmarksRef.current.delete(questionId);
      return saved;
    });
  }, [enqueueMutation]);

  const flushPendingChanges = useCallback(async () => {
    // Wait for the current queue before retrying values still marked as unsaved.
    await pendingMutationsRef.current;
    mutationErrorRef.current = null;
    for (const questionId of [...dirtyAnswersRef.current.keys()]) {
      handleQuestionLeave(questionId);
    }
    for (const [questionId, change] of dirtyBookmarksRef.current) {
      saveBookmark(questionId, change);
    }
    await pendingMutationsRef.current;
    if (mutationErrorRef.current) throw mutationErrorRef.current;
    if (dirtyAnswersRef.current.size || dirtyBookmarksRef.current.size) {
      throw new Error("Changes have not been saved");
    }
  }, [handleQuestionLeave, saveBookmark]);

  const handleAnswerReveal = useCallback(async (questionId: string) => {
    const currentQuestion = displayedAttemptRef.current?.questions.find(
      (question) => question.id === questionId,
    );
    if (typeof currentQuestion?.correctAnswer === "string") return true;

    setError(null);
    try {
      const solution = await getPremiumQuestionSolution(attemptId ?? "", questionId);
      updateDisplayedAttempt((current) => ({
        ...current,
        questions: current.questions.map((question) =>
          question.id === questionId
            ? {
                ...question,
                correctAnswer: solution.correctAnswer,
                acceptedAnswers: solution.acceptedAnswers,
                explanation: solution.explanation,
              }
            : question
        ),
      }));
      return true;
    } catch (cause) {
      setError(getPremiumErrorMessage(
        cause,
        "정답과 해설을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
      ));
      return false;
    }
  }, [attemptId, updateDisplayedAttempt]);

  const handleBookmarkChange = useCallback((questionId: string) => {
    if (actionInProgressRef.current) return;
    const question = displayedAttemptRef.current?.questions.find((item) => item.id === questionId);
    if (!question) return;
    const bookmarked = !(question.bookmarked ?? false);
    const change = { value: bookmarked };
    dirtyBookmarksRef.current.set(questionId, change);
    setError(null);
    updateDisplayedAttempt((current) => ({
      ...current,
      questions: current.questions.map((item) =>
        item.id === questionId ? { ...item, bookmarked } : item
      ),
    }));
    saveBookmark(questionId, change);
  }, [saveBookmark, updateDisplayedAttempt]);

  const handleElapsedTimeTick = useCallback(() => {
    setElapsedSeconds((current) => current + 1);
  }, []);

  const handlePause = useCallback(async () => {
    if (actionInProgressRef.current) return;
    actionInProgressRef.current = true;
    setPendingAction("pause");
    setError(null);
    try {
      await flushPendingChanges();
      const current = serverAttemptRef.current;
      if (!current || current.status !== "in_progress") return;
      replaceAttempt(await pausePremiumAttempt(current.id, current.revision));
      navigate(`/premium/courses/${current.courseId}/problem-sets/${current.problemSetId}`);
    } catch (cause) {
      setError(getPremiumErrorMessage(
        cause,
        "풀이를 일시 중단하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      ));
    } finally {
      actionInProgressRef.current = false;
      setPendingAction(null);
    }
  }, [flushPendingChanges, navigate, replaceAttempt]);

  const handleSubmit = useCallback(async () => {
    if (actionInProgressRef.current) return;
    actionInProgressRef.current = true;
    setPendingAction("submit");
    setError(null);
    try {
      await flushPendingChanges();
      const current = serverAttemptRef.current;
      if (!current) return;
      const result = await submitPremiumAttempt(current.id, current.revision);
      navigate(`/premium/results/${result.id}`, { replace: true });
    } catch (cause) {
      setError(getPremiumErrorMessage(
        cause,
        "답안을 제출하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      ));
    } finally {
      actionInProgressRef.current = false;
      setPendingAction(null);
    }
  }, [flushPendingChanges, navigate]);

  if (isLoading) {
    return <PremiumSolveSkeleton />;
  }

  if (!attempt || !session) {
    return (
      <div className="app-focus-page app-page flex min-h-screen items-center justify-center px-4">
        <div className="app-card max-w-lg rounded-2xl border p-6 text-center">
          <p className="text-sm text-red-700 dark:text-red-300">
            {error ?? "풀이를 찾을 수 없습니다. 온라인 문제 목록에서 다시 시작해 주세요."}
          </p>
          <button
            type="button"
            onClick={() => navigate("/premium")}
            className="app-button-secondary mt-4 rounded-xl px-4 py-2 text-sm font-semibold"
          >
            온라인 과목으로
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div ref={(element) => { if (element) element.inert = Boolean(pendingAction); }} aria-busy={Boolean(pendingAction)}>
        <CbtSolveScreen
          sessionId={attempt.id}
          sessionOverride={session}
          onAnswerChange={handleAnswerChange}
          onBookmarkChange={handleBookmarkChange}
          onElapsedTimeTick={handleElapsedTimeTick}
          onQuestionLeave={handleQuestionLeave}
          canRevealAnswer={false}
          onAnswerRevealRequest={handleAnswerReveal}
          onPaused={() => void handlePause()}
          onSubmitted={() => void handleSubmit()}
          allowCsvDownload={false}
        />
      </div>
      <Toast message={error} onDismiss={() => setError(null)} />
      {pendingAction ? (
        <AsyncTransitionOverlay
          label={pendingAction === "pause" ? "풀이 기록을 저장하는 중입니다" : "답안을 제출하고 채점하는 중입니다"}
        />
      ) : null}
    </>
  );
}
