import { FormEvent, useId, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { SessionListItem } from "../components/session/SessionListItem";
import { AppFooter } from "../components/ui/AppFooter";
import { Button } from "../components/ui/Button";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { DashboardHeaderTitle } from "../components/ui/DashboardHeaderTitle";
import { Dialog } from "../components/ui/Dialog";
import { IconCloseButton } from "../components/ui/IconCloseButton";
import { ReturnLinkLabel } from "../components/ui/ReturnLinkLabel";
import { ThemeSelect } from "../components/ui/ThemeSelect";
import { Toast } from "../components/ui/Toast";
import { getOfflineProblemSetPath } from "../lib/offlineSession";
import { useTestStore } from "../store/useTestStore";
import { NO_SUBJECT_ID, type OfflineSession, type SolveOrder } from "../types/test";

const solveOrderOptions = [
  { value: "number", label: "번호 순서대로 풀기" },
  { value: "chapter-random", label: "챕터별로 무작위 풀기" },
  { value: "random", label: "전체 무작위 풀기" },
];
const modeLabel = (session: OfflineSession) => {
  if (session.retry_mode === "all") return "전체 다시 풀기";
  if (session.retry_mode === "incorrect") return "오답 풀기";
  if (session.retry_mode === "bookmarked") return "책갈피 풀기";
  return session.attempt_number === 1 ? "첫 풀이" : "새로 풀기";
};

export function OfflineProblemSetSessionsPage() {
  const { subjectId = NO_SUBJECT_ID, problemSetId } = useParams();
  const problemSet = useTestStore((state) => state.problemSets.find((item) => item.id === problemSetId));
  const sessions = useTestStore((state) => state.sessions);
  const createSession = useTestStore((state) => state.createSession);
  const deleteSession = useTestStore((state) => state.deleteSession);
  const updateSessionTitle = useTestStore((state) => state.updateSessionTitle);
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [orderMode, setOrderMode] = useState<SolveOrder>("number");
  const [editing, setEditing] = useState<OfflineSession | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [deleting, setDeleting] = useState<OfflineSession | null>(null);
  const [error, setError] = useState("");
  const submitting = useRef(false);
  const createTitleId = useId();
  const editTitleId = useId();

  const relatedSessions = useMemo(
    () => sessions
      .filter((session) => session.problem_set_id === problemSetId)
      .sort((a, b) => b.attempt_number - a.attempt_number || new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [sessions, problemSetId],
  );
  const coursePath = `/dashboard/${encodeURIComponent(problemSet?.subject_id ?? subjectId)}`;
  const nextAttemptNumber = relatedSessions.reduce((maximum, session) => Math.max(maximum, session.attempt_number), 0) + 1;
  const startCreate = () => {
    setNewTitle(`${problemSet?.title ?? "문제 풀이"} ${nextAttemptNumber}회차`);
    setOrderMode("number");
    setIsCreating(true);
  };
  const submitCreate = (event: FormEvent) => {
    event.preventDefault();
    if (!problemSet || !newTitle.trim() || submitting.current) return;
    submitting.current = true;
    try {
      const sessionId = createSession({ problemSetId: problemSet.id, title: newTitle.trim(), orderMode });
      if (!sessionId) throw new Error("Session creation failed");
      setIsCreating(false);
      navigate(`/solve/${sessionId}`, { state: { solveEntry: "direct" } });
    } catch {
      setError("풀이 세션을 만들지 못했습니다. 문제 목록에서 다시 선택한 뒤 시도해 주세요.");
    } finally {
      submitting.current = false;
    }
  };
  const submitEdit = (event: FormEvent) => {
    event.preventDefault();
    if (!editing || !editingTitle.trim()) return;
    updateSessionTitle(editing.id, editingTitle.trim());
    setEditing(null);
  };

  if (!problemSet) return (
    <div className="app-page px-4 py-8 md:px-6"><div className="app-card mx-auto max-w-2xl rounded-2xl border p-8 text-center">
      <p className="text-stone-700 dark:text-stone-300">문제를 찾을 수 없습니다. 문제 목록에서 다시 선택해 주세요.</p>
      <Link to={`/dashboard/${encodeURIComponent(subjectId)}`} className="app-button-primary mt-4 inline-flex rounded-lg px-4 py-2 text-sm font-semibold"><ReturnLinkLabel variant="solid">문제 목록으로</ReturnLinkLabel></Link>
    </div></div>
  );
  if ((problemSet.subject_id ?? NO_SUBJECT_ID) !== subjectId) return <Navigate to={getOfflineProblemSetPath(problemSet.id, problemSet.subject_id)} replace />;

  return (
    <div className="app-page px-4 py-8 transition-colors duration-300 md:px-6">
      <Toast message={error} onDismiss={() => setError("")} />
      <div className="mx-auto max-w-6xl">
        <DashboardHeaderTitle title={problemSet.title} sectionTitle="풀이 세션" logoTo={coursePath} logoLabel="문제 목록으로 이동">
          <button type="button" onClick={startCreate} className="app-button-primary app-button-primary-standalone rounded-xl px-3 py-2 text-sm font-semibold sm:px-4">새로 문제 풀이 시작하기</button>
          <Link to={coursePath} className="app-button-secondary rounded-xl px-3 py-2 text-center text-sm font-semibold sm:px-4"><ReturnLinkLabel>문제 목록으로</ReturnLinkLabel></Link>
        </DashboardHeaderTitle>
        <p className="mb-4 text-sm text-stone-500 dark:text-stone-400">전체 {problemSet.questions.length}문항 / 풀이 세션 {relatedSessions.length}개</p>
        {relatedSessions.length ? (
          <div className="space-y-2.5">
            {relatedSessions.map((session) => (
              <SessionListItem
                key={session.id}
                attemptNumber={session.attempt_number}
                title={session.title}
                modeLabel={modeLabel(session)}
                completed={session.status === "completed"}
                orderMode={session.order_mode}
                createdAt={session.created_at}
                lastPlayedAt={session.last_played_at}
                solvedQuestions={session.solved_questions}
                totalQuestions={session.total_questions}
                elapsedSeconds={session.elapsed_time}
                scorePercent={session.status === "completed" ? session.score : null}
                destination={session.status === "completed" ? `/result/${session.id}` : `/solve/${session.id}`}
                destinationState={session.status === "completed" ? undefined : { solveEntry: "resume" }}
                actions={(
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="text-xs font-medium text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
                      aria-label={`${session.title} 이름 변경`}
                      onClick={() => {
                        setEditing(session);
                        setEditingTitle(session.title);
                      }}
                    >
                      이름 변경
                    </button>
                    <button
                      type="button"
                      className="text-xs font-medium text-stone-500 hover:text-red-700 dark:text-stone-400 dark:hover:text-red-400"
                      aria-label={`${session.title} 삭제`}
                      onClick={() => setDeleting(session)}
                    >
                      삭제
                    </button>
                  </div>
                )}
              />
            ))}
          </div>
        ) : (
          <div className="app-card rounded-2xl border border-dashed px-6 py-12 text-center">
            <p className="text-base font-bold text-stone-800 dark:text-stone-200">아직 풀이 세션이 없습니다.</p>
            <p className="mt-2 text-sm leading-6 text-stone-500">등록한 문제는 준비되어 있습니다. 상단의 새로 문제 풀이 시작하기를 눌러 첫 풀이를 시작해 주세요.</p>
          </div>
        )}
        <AppFooter />
      </div>
      {isCreating ? (
        <Dialog labelledBy={createTitleId} onClose={() => setIsCreating(false)} surfaceClassName="max-h-[calc(100dvh-2rem)] max-w-md overflow-y-auto rounded-2xl border p-5">
          <form onSubmit={submitCreate} className="space-y-4">
            <div className="flex items-center justify-between gap-3"><h2 id={createTitleId} className="text-lg font-semibold text-stone-900 dark:text-stone-100">새 풀이 세션</h2><IconCloseButton label="새 풀이 세션 닫기" onClick={() => setIsCreating(false)} /></div>
            <label className="block space-y-2"><span className="text-sm font-medium text-stone-700 dark:text-stone-300">세션 제목</span><input required value={newTitle} onChange={(event) => setNewTitle(event.target.value)} className="app-control w-full rounded-lg px-3 py-2 text-sm" /></label>
            <div className="space-y-2"><span className="text-sm font-medium text-stone-700 dark:text-stone-300">풀이 순서</span><ThemeSelect value={orderMode} onChange={(value) => setOrderMode(value as SolveOrder)} options={solveOrderOptions} ariaLabel="풀이 순서 선택" /></div>
            <p className="text-sm leading-6 text-stone-500">전체 {problemSet.questions.length}문항으로 새 세션을 만듭니다. 이전 풀이 기록은 그대로 남습니다.</p>
            <div className="flex justify-end gap-2"><Button onClick={() => setIsCreating(false)}>취소</Button><Button type="submit" variant="primary" disabled={!newTitle.trim()}>세션 만들고 시작</Button></div>
          </form>
        </Dialog>
      ) : null}
      {editing ? (
        <Dialog labelledBy={editTitleId} onClose={() => setEditing(null)} surfaceClassName="max-h-[calc(100dvh-2rem)] max-w-md overflow-y-auto rounded-2xl border p-5">
          <form onSubmit={submitEdit} className="space-y-4">
            <div className="flex items-center justify-between gap-3"><h2 id={editTitleId} className="text-lg font-semibold text-stone-900 dark:text-stone-100">세션 이름 변경</h2><IconCloseButton label="세션 이름 변경 닫기" onClick={() => setEditing(null)} /></div>
            <label className="block space-y-2"><span className="text-sm font-medium text-stone-700 dark:text-stone-300">세션 제목</span><input required value={editingTitle} onChange={(event) => setEditingTitle(event.target.value)} className="app-control w-full rounded-lg px-3 py-2 text-sm" /></label>
            <div className="flex justify-end gap-2"><Button onClick={() => setEditing(null)}>취소</Button><Button type="submit" variant="primary" disabled={!editingTitle.trim()}>저장</Button></div>
          </form>
        </Dialog>
      ) : null}
      {deleting ? (
        <ConfirmDialog
          title="이 풀이 세션을 삭제할까요?"
          description={`${deleting.title}\n\n이 세션의 답안과 풀이 기록이 삭제됩니다. 등록한 문제와 다른 풀이 세션은 유지됩니다.`}
          confirmLabel="세션 삭제"
          variant="danger"
          onCancel={() => setDeleting(null)}
          onConfirm={() => {
            deleteSession(deleting.id);
            setDeleting(null);
          }}
        />
      ) : null}
    </div>
  );
}
