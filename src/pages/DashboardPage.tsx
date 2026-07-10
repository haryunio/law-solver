import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CsvUploadPanel } from "../components/upload/CsvUploadPanel";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { AppFooter } from "../components/ui/AppFooter";
import { DashboardHeaderTitle } from "../components/ui/DashboardHeaderTitle";
import { IconCloseButton } from "../components/ui/IconCloseButton";
import { OverflowTooltipTitle } from "../components/ui/OverflowTooltipTitle";
import { ReturnLinkLabel } from "../components/ui/ReturnLinkLabel";
import { formatElapsedTime } from "../lib/time";
import { useTestStore } from "../store/useTestStore";
import { NO_SUBJECT_ID } from "../types/test";

const orderModeLabel = {
  number: "번호 순서",
  "chapter-random": "챕터별 랜덤",
  random: "전체 랜덤",
} as const;

const typeLabel = {
  OX: "OX",
  "5-choice": "5지선다",
  short: "단답형",
} as const;

const typeStyle = {
  OX: "border-red-100 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400",
  "5-choice": "border-orange-100 bg-orange-50 text-orange-700 dark:border-orange-900/50 dark:bg-orange-950/30 dark:text-orange-400",
  short: "border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400",
} as const;

const sessionDateTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

type DialogState = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "danger" | "success";
  onConfirm: () => void;
  onCancel?: () => void;
};

export function DashboardPage() {
  const { subjectId = NO_SUBJECT_ID } = useParams();
  const sessions = useTestStore((state) => state.sessions);
  const subjects = useTestStore((state) => state.subjects);
  const sessionSubjectMap = useTestStore((state) => state.sessionSubjectMap);
  const deleteSession = useTestStore((state) => state.deleteSession);
  const updateSessionTitle = useTestStore((state) => state.updateSessionTitle);
  const assignSessionSubject = useTestStore((state) => state.assignSessionSubject);
  const navigate = useNavigate();
  const [openUpload, setOpenUpload] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingSubjectId, setEditingSubjectId] = useState(NO_SUBJECT_ID);
  const [openSessionMenuId, setOpenSessionMenuId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState | null>(null);

  const isNoSubject = subjectId === NO_SUBJECT_ID;
  const currentSubject = isNoSubject ? null : subjects.find((subject) => subject.id === subjectId);
  const currentSubjectName = currentSubject?.name ?? "과목 없음";
  const isInvalidSubject = !isNoSubject && !currentSubject;

  const sortedSessions = useMemo(
    () =>
      sessions
        .filter((session) =>
          isNoSubject
            ? !sessionSubjectMap[session.id]
            : sessionSubjectMap[session.id] === subjectId,
        )
        .sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        ),
    [isNoSubject, sessionSubjectMap, sessions, subjectId],
  );

  const handleDeleteSession = (sessionId: string, title: string) => {
    setDialog({
      title: "이 세션을 삭제할까요?",
      description: `${title}\n\n삭제하면 해당 문제와 풀이 기록을 복구할 수 없습니다.`,
      confirmLabel: "삭제",
      variant: "danger",
      onCancel: () => setDialog(null),
      onConfirm: () => {
        deleteSession(sessionId);
        setDialog(null);
      },
    });
  };

  const openEditModal = (sessionId: string, title: string) => {
    setOpenSessionMenuId(null);
    setEditingSessionId(sessionId);
    setEditingTitle(title);
    setEditingSubjectId(sessionSubjectMap[sessionId] ?? NO_SUBJECT_ID);
  };

  const closeEditModal = () => {
    setEditingSessionId(null);
    setEditingTitle("");
    setEditingSubjectId(NO_SUBJECT_ID);
  };

  const handleEditSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!editingSessionId || !editingTitle.trim()) return;
    updateSessionTitle(editingSessionId, editingTitle.trim());
    assignSessionSubject(
      editingSessionId,
      editingSubjectId === NO_SUBJECT_ID ? null : editingSubjectId,
    );
    closeEditModal();
  };

  if (isInvalidSubject) {
    return (
      <div className="app-page px-4 py-8 md:px-6">
        <div className="app-card mx-auto max-w-2xl rounded-2xl border p-8 text-center">
          <p className="text-stone-700 dark:text-stone-300">과목을 찾을 수 없습니다.</p>
          <Link
            to="/dashboard"
            className="app-button-primary mt-4 inline-flex rounded-lg px-4 py-2 text-sm font-semibold"
          >
            <ReturnLinkLabel variant="solid">과목 목록으로</ReturnLinkLabel>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="app-page px-4 py-8 transition-colors duration-300 md:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <DashboardHeaderTitle
            title={currentSubjectName}
            description="문제 풀이 대시보드"
            logoTo="/dashboard"
            logoLabel="과목 대시보드로 이동"
          />
          <div className="flex flex-wrap gap-2">
            <Link
              to="/dashboard"
              className="app-button-secondary rounded-lg px-4 py-2 text-sm font-semibold"
            >
              <ReturnLinkLabel>과목 목록으로</ReturnLinkLabel>
            </Link>
            <button
              onClick={() => setOpenUpload(true)}
              className="app-button-primary app-button-primary-standalone rounded-lg px-4 py-2 text-sm font-semibold"
            >
              새 문제 등록
            </button>
          </div>
        </header>

        {sortedSessions.length === 0 ? (
          <div className="app-card rounded-2xl border border-dashed p-10 text-center">
            <p className="text-base font-medium text-stone-700 dark:text-stone-300">등록된 문제 세션이 없습니다.</p>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-500">
              이 과목에 CSV 업로드로 OX, 5지선다 또는 단답형 문제를 시작하세요.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {sortedSessions.map((session) => {
              const progressPercent =
                session.total_questions > 0
                  ? Math.round((session.solved_questions / session.total_questions) * 100)
                  : 0;
              const averageSecondsPerQuestion =
                session.total_questions > 0
                  ? Math.round(session.elapsed_time / session.total_questions)
                  : 0;
              const isCompleted = session.status === "completed";

              return (
                <article
                  key={session.id}
                  className="app-card app-problem-card flex min-w-0 flex-col overflow-visible rounded-2xl border"
                >
                  <div className="relative px-4 pb-2 pt-4 pr-12">
                    <OverflowTooltipTitle
                      as="h2"
                      text={session.title}
                      className="text-base font-bold leading-snug text-stone-900 dark:text-stone-100"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setOpenSessionMenuId((currentId) =>
                          currentId === session.id ? null : session.id,
                        )
                      }
                      className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full border border-stone-200 bg-white text-base font-bold leading-none text-stone-500 shadow-sm transition hover:bg-stone-50 hover:text-stone-800 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
                      aria-label={`${session.title} 메뉴 열기`}
                      aria-expanded={openSessionMenuId === session.id}
                    >
                      ⋮
                    </button>
                    {openSessionMenuId === session.id ? (
                      <div className="absolute right-3 top-12 z-20 w-32 overflow-hidden rounded-xl border border-stone-200 bg-white py-1 shadow-xl dark:border-stone-700 dark:bg-stone-900">
                        <button
                          type="button"
                          onClick={() => openEditModal(session.id, session.title)}
                          className="block w-full px-4 py-2 text-left text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:text-stone-200 dark:hover:bg-stone-800"
                        >
                          편집
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOpenSessionMenuId(null);
                            handleDeleteSession(session.id, session.title);
                          }}
                          className="block w-full px-4 py-2 text-left text-sm font-semibold text-red-700 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                        >
                          삭제
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 px-4 pb-3">
                    <span
                      className={[
                        "rounded-full border px-2.5 py-0.5 text-[11px] font-bold",
                        typeStyle[session.type],
                      ].join(" ")}
                    >
                      {typeLabel[session.type]}
                    </span>
                    <span
                      className={[
                        "rounded-full border px-2.5 py-0.5 text-[11px] font-bold",
                        isCompleted
                          ? "border-blue-100 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-400"
                          : "border-red-100 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400",
                      ].join(" ")}
                    >
                      {isCompleted ? "채점 완료" : "풀이 중"}
                    </span>
                    <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-0.5 text-[11px] font-bold text-stone-600 dark:border-stone-700 dark:bg-stone-950/40 dark:text-stone-300">
                      {orderModeLabel[session.order_mode ?? "number"]}
                    </span>
                    <span className="ml-auto text-xs text-stone-400 dark:text-stone-500 max-sm:ml-0 max-sm:w-full">
                      {sessionDateTimeFormatter.format(new Date(session.created_at))}
                    </span>
                  </div>

                  <div className="flex-1 px-4 pb-3">
                    <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
                      <div className="col-span-2 min-w-0 rounded-xl bg-stone-50 px-3 py-2 dark:bg-stone-950/40 sm:col-span-1">
                        <p className="text-[11px] font-medium text-stone-500 dark:text-stone-500">진행률</p>
                        <p className="mt-1 truncate font-bold text-stone-900 dark:text-stone-100">
                          {session.solved_questions}/{session.total_questions}
                        </p>
                        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
                          <div
                            className={[
                              "h-full rounded-full transition-all",
                              isCompleted ? "bg-blue-600 dark:bg-blue-500" : "app-progress-gradient",
                            ].join(" ")}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                      <div className="min-w-0 rounded-xl bg-stone-50 px-3 py-2 dark:bg-stone-950/40">
                        <p className="text-[11px] font-medium text-stone-500 dark:text-stone-500">시간</p>
                        <p className="mt-1 truncate font-bold text-stone-900 dark:text-stone-100">
                          {formatElapsedTime(session.elapsed_time)}
                        </p>
                        <p className="mt-0.5 truncate text-[10px] font-light leading-none text-stone-400 dark:text-stone-500">
                          문제당 {formatElapsedTime(averageSecondsPerQuestion)}
                        </p>
                      </div>
                      <div className="min-w-0 rounded-xl bg-stone-50 px-3 py-2 dark:bg-stone-950/40">
                        <p className="text-[11px] font-medium text-stone-500 dark:text-stone-500">점수</p>
                        <p className="mt-1 truncate text-base font-bold leading-tight text-stone-900 dark:text-stone-100">
                          {isCompleted ? `${session.score}%` : "풀이 중"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {isCompleted ? (
                    <Link
                      to={`/result/${session.id}`}
                      className="app-result-link block rounded-b-[calc(1rem-1px)] border-t px-4 py-3 text-center text-sm font-bold shadow-[0_-1px_0_rgba(0,0,0,0.02)]"
                    >
                      결과 확인하기
                    </Link>
                  ) : (
                    <Link
                      to={`/solve/${session.id}`}
                      className="app-button-primary block rounded-b-[calc(1rem-1px)] border-t px-4 py-3 text-center text-sm font-bold"
                    >
                      이어서 풀기
                    </Link>
                  )}
                </article>
              );
            })}
          </div>
        )}

        <AppFooter />
      </div>

      {openUpload ? (
        <div className="fixed inset-0 z-50">
          <button onClick={() => setOpenUpload(false)} className="app-modal-backdrop absolute inset-0" />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2">
            <IconCloseButton
              onClick={() => setOpenUpload(false)}
              label="새 문제 등록 닫기"
              className="absolute right-3 top-3 z-10"
            />
            <CsvUploadPanel
              subjectId={isNoSubject ? null : subjectId}
              onCreated={(sessionId) => {
                setOpenUpload(false);
                navigate(`/solve/${sessionId}`);
              }}
            />
          </div>
        </div>
      ) : null}

      {editingSessionId ? (
        <div className="fixed inset-0 z-50">
          <button onClick={closeEditModal} className="app-modal-backdrop absolute inset-0" />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2">
            <form
              onSubmit={handleEditSubmit}
              className="app-modal-surface space-y-4 rounded-2xl border p-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">문제 편집</h2>
                <IconCloseButton onClick={closeEditModal} label="문제 편집 닫기" />
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-stone-700 dark:text-stone-300">제목</span>
                <input
                  autoFocus
                  value={editingTitle}
                  onChange={(event) => setEditingTitle(event.target.value)}
                  className="app-control w-full rounded-lg px-3 py-2 text-sm"
                  placeholder="문제 세션 제목"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-stone-700 dark:text-stone-300">과목</span>
                <select
                  value={editingSubjectId}
                  onChange={(event) => setEditingSubjectId(event.target.value)}
                  className="app-control w-full rounded-lg px-3 py-2 text-sm"
                >
                  <option value={NO_SUBJECT_ID}>과목 없음</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="app-button-secondary rounded-lg px-4 py-2 text-sm font-semibold"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={!editingTitle.trim()}
                  className="app-button-primary rounded-lg px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                >
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {dialog ? (
        <ConfirmDialog
          title={dialog.title}
          description={dialog.description}
          confirmLabel={dialog.confirmLabel}
          cancelLabel={dialog.cancelLabel}
          variant={dialog.variant}
          onConfirm={dialog.onConfirm}
          onCancel={dialog.onCancel}
        />
      ) : null}
    </div>
  );
}
