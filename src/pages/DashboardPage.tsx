import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CsvUploadPanel } from "../components/upload/CsvUploadPanel";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
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
  OX: "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50",
  "5-choice": "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50",
  short: "bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900/50",
} as const;

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
      <div className="min-h-screen px-4 py-8 md:px-6 dark:bg-stone-950">
        <div className="mx-auto max-w-2xl rounded-2xl border border-stone-200 bg-white p-8 text-center dark:border-stone-800 dark:bg-stone-900">
          <p className="text-stone-700 dark:text-stone-300">과목을 찾을 수 없습니다.</p>
          <Link
            to="/dashboard"
            className="mt-4 inline-flex rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white"
          >
            <ReturnLinkLabel variant="solid">과목 목록으로</ReturnLinkLabel>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 md:px-6 dark:bg-stone-950 transition-colors duration-300">
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
              className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800"
            >
              <ReturnLinkLabel>과목 목록으로</ReturnLinkLabel>
            </Link>
            <button
              onClick={() => setOpenUpload(true)}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
            >
              새 문제 등록
            </button>
          </div>
        </header>

        {sortedSessions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center dark:border-stone-800 dark:bg-stone-900">
            <p className="text-base font-medium text-stone-700 dark:text-stone-300">등록된 문제 세션이 없습니다.</p>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-500">
              이 과목에 CSV 업로드로 OX, 5지선다 또는 단답형 문제를 시작하세요.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {sortedSessions.map((session) => (
              <article key={session.id} className="min-w-0 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900 dark:shadow-stone-950/30">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <OverflowTooltipTitle
                      as="h2"
                      text={session.title}
                      className="text-base font-semibold text-stone-900 dark:text-stone-100"
                    />
                  </div>
                  <span
                    className={[
                      "shrink-0 rounded-full px-2 py-1 text-xs font-semibold",
                      session.status === "completed"
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                        : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400",
                    ].join(" ")}
                  >
                    {session.status === "completed" ? "채점 완료" : "풀이 중"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm text-stone-600 dark:text-stone-400">
                  <div className="flex items-center gap-1.5">
                    <span>유형:</span>
                    <span
                      className={[
                        "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        typeStyle[session.type],
                      ].join(" ")}
                    >
                      {typeLabel[session.type]}
                    </span>
                  </div>
                  <p>
                    진도: {session.solved_questions}/{session.total_questions}
                  </p>
                  <p>순서: {orderModeLabel[session.order_mode ?? "number"]}</p>
                  <p>점수: {session.score}%</p>
                  <p>시간: {formatElapsedTime(session.elapsed_time)}</p>
                </div>

                <p className="mt-2 text-xs text-stone-400 dark:text-stone-500">
                  생성일: {new Date(session.created_at).toLocaleString("ko-KR")}
                </p>

                <div className="mt-4 flex items-center gap-2">
                  <div className="flex flex-wrap gap-2">
                    {session.status === "completed" ? (
                      <Link
                        to={`/result/${session.id}`}
                        className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300"
                      >
                        결과보기
                      </Link>
                    ) : (
                      <Link
                        to={`/solve/${session.id}`}
                        className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white dark:bg-red-600"
                      >
                        이어풀기
                      </Link>
                    )}
                    <button
                      onClick={() => openEditModal(session.id, session.title)}
                      className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300"
                    >
                      편집
                    </button>
                  </div>

                  <button
                    onClick={() => handleDeleteSession(session.id, session.title)}
                    className="ml-auto rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400"
                  >
                    삭제
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        <footer className="mt-12 border-t border-stone-200 pt-6 text-center text-sm text-stone-500 dark:border-stone-800 dark:text-stone-600">
          <p>제작자: 경북대 로스쿨 17기 신하륜</p>
          <p className="mt-1">
            연락처:{" "}
            <a className="font-medium text-red-600 underline" href="mailto:haryun@knu.ac.kr">
              haryun@knu.ac.kr
            </a>
          </p>
          <p className="mt-1">CC BY-NC-ND ⓒ 2026 Haryun all rights reserved</p>
        </footer>
      </div>

      {openUpload ? (
        <div className="fixed inset-0 z-50">
          <button onClick={() => setOpenUpload(false)} className="absolute inset-0 bg-black/35 dark:bg-black/60" />
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
          <button onClick={closeEditModal} className="absolute inset-0 bg-black/35 dark:bg-black/60" />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2">
            <form
              onSubmit={handleEditSubmit}
              className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl dark:border-stone-800 dark:bg-stone-900"
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
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none ring-red-200 transition focus:ring-2 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:ring-red-900/50"
                  placeholder="문제 세션 제목"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-stone-700 dark:text-stone-300">과목</span>
                <select
                  value={editingSubjectId}
                  onChange={(event) => setEditingSubjectId(event.target.value)}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none ring-red-200 transition focus:ring-2 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:ring-red-900/50"
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
                  className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={!editingTitle.trim()}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-600 dark:hover:bg-red-700"
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
