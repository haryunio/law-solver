import {
  CSSProperties,
  FormEvent,
  KeyboardEvent,
  PointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { AppFooter } from "../components/ui/AppFooter";
import { DashboardHeaderTitle } from "../components/ui/DashboardHeaderTitle";
import { IconCloseButton } from "../components/ui/IconCloseButton";
import { ReturnLinkLabel } from "../components/ui/ReturnLinkLabel";
import { SubjectCardCover } from "../components/ui/SubjectCardCover";
import { getSubjectDashboardPath, SubjectDropPlacement } from "../lib/subject";
import {
  getSubjectAccentColor,
  getSubjectCoverStyle,
  subjectCoverPalettes as coverPalettes,
} from "../lib/subjectCover";
import { NO_SUBJECT_ID, Subject, SubjectCoverPalette } from "../types/test";
import { useTestStore } from "../store/useTestStore";

type DialogState = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "danger" | "success";
  onConfirm: () => void;
  onCancel?: () => void;
};

interface SubjectCardData {
  id: string;
  name: string;
  total: number;
  completed: number;
  inProgress: number;
  isDefault?: boolean;
  coverPalette?: SubjectCoverPalette;
}

export function SubjectListPage() {
  const sessions = useTestStore((state) => state.sessions);
  const subjects = useTestStore((state) => state.subjects);
  const sessionSubjectMap = useTestStore((state) => state.sessionSubjectMap);
  const createSubject = useTestStore((state) => state.createSubject);
  const updateSubject = useTestStore((state) => state.updateSubject);
  const reorderSubject = useTestStore((state) => state.reorderSubject);
  const deleteSubject = useTestStore((state) => state.deleteSubject);

  const [isSubjectManageOpen, setIsSubjectManageOpen] = useState(false);
  const [isCreateSubjectOpen, setIsCreateSubjectOpen] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectPalette, setNewSubjectPalette] = useState<SubjectCoverPalette>("warm");
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [editingSubjectName, setEditingSubjectName] = useState("");
  const [editingSubjectPalette, setEditingSubjectPalette] = useState<SubjectCoverPalette>("warm");
  const [draggingSubjectId, setDraggingSubjectId] = useState<string | null>(null);
  const [subjectDragOffsetY, setSubjectDragOffsetY] = useState(0);
  const [subjectDropTarget, setSubjectDropTarget] = useState<{
    subjectId: string;
    placement: SubjectDropPlacement;
  } | null>(null);
  const subjectDropTargetRef = useRef<{
    subjectId: string;
    placement: SubjectDropPlacement;
  } | null>(null);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const subjectListRef = useRef<HTMLDivElement | null>(null);
  const subjectDragRef = useRef<{
    pointerId: number | null;
    subjectId: string | null;
    startY: number;
    startScrollTop: number;
    handleElement: HTMLButtonElement | null;
    previousUserSelect: string;
    previousCursor: string;
  }>({
    pointerId: null,
    subjectId: null,
    startY: 0,
    startScrollTop: 0,
    handleElement: null,
    previousUserSelect: "",
    previousCursor: "",
  });

  const subjectCards = useMemo<SubjectCardData[]>(() => {
    const makeStats = (subject: Subject | null): SubjectCardData => {
      const id = subject?.id ?? NO_SUBJECT_ID;
      const relatedSessions = sessions.filter((session) => {
        const mappedSubjectId = sessionSubjectMap[session.id];
        return subject ? mappedSubjectId === subject.id : !mappedSubjectId;
      });

      return {
        id,
        name: subject?.name ?? "과목 없음",
        total: relatedSessions.length,
        completed: relatedSessions.filter((session) => session.status === "completed").length,
        inProgress: relatedSessions.filter((session) => session.status === "in-progress").length,
        isDefault: !subject,
        coverPalette: subject?.cover_palette,
      };
    };

    return [makeStats(null), ...subjects.map((subject) => makeStats(subject))];
  }, [sessions, sessionSubjectMap, subjects]);

  const hasDuplicateSubjectName = (name: string, ignoredSubjectId?: string) =>
    subjects.some(
      (subject) =>
        subject.id !== ignoredSubjectId &&
        subject.name.trim().toLowerCase() === name.trim().toLowerCase(),
    );

  const closeCreateSubject = () => {
    setIsCreateSubjectOpen(false);
    setNewSubjectName("");
    setNewSubjectPalette("warm");
  };

  const handleCreateSubject = (event: FormEvent) => {
    event.preventDefault();
    const trimmedName = newSubjectName.trim();
    if (!trimmedName) return;

    if (hasDuplicateSubjectName(trimmedName)) {
      setDialog({
        title: "이미 있는 과목입니다.",
        description: "같은 이름의 과목이 이미 등록되어 있습니다.",
        confirmLabel: "확인",
        onConfirm: () => setDialog(null),
      });
      return;
    }

    createSubject(trimmedName, newSubjectPalette);
    closeCreateSubject();
  };

  const openEditSubject = (subject: Subject) => {
    setEditingSubjectId(subject.id);
    setEditingSubjectName(subject.name);
    setEditingSubjectPalette(subject.cover_palette ?? "warm");
  };

  const closeEditSubject = () => {
    setEditingSubjectId(null);
    setEditingSubjectName("");
    setEditingSubjectPalette("warm");
  };

  const handleEditSubjectSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!editingSubjectId) return;

    const trimmedName = editingSubjectName.trim();
    if (!trimmedName) return;

    if (hasDuplicateSubjectName(trimmedName, editingSubjectId)) {
      setDialog({
        title: "이미 있는 과목입니다.",
        description: "같은 이름의 과목이 이미 등록되어 있습니다.",
        confirmLabel: "확인",
        onConfirm: () => setDialog(null),
      });
      return;
    }

    updateSubject(editingSubjectId, {
      name: trimmedName,
      coverPalette: editingSubjectPalette,
    });
    closeEditSubject();
  };

  const resetSubjectDrag = () => {
    const {
      handleElement,
      pointerId,
      previousUserSelect,
      previousCursor,
    } = subjectDragRef.current;

    const wasDragging = pointerId !== null;
    subjectDragRef.current = {
      pointerId: null,
      subjectId: null,
      startY: 0,
      startScrollTop: 0,
      handleElement: null,
      previousUserSelect: "",
      previousCursor: "",
    };

    if (wasDragging) {
      document.body.style.userSelect = previousUserSelect;
      document.body.style.cursor = previousCursor;
    }
    setDraggingSubjectId(null);
    setSubjectDragOffsetY(0);
    setSubjectDropTarget(null);
    subjectDropTargetRef.current = null;

    if (handleElement && pointerId !== null && handleElement.hasPointerCapture(pointerId)) {
      handleElement.releasePointerCapture(pointerId);
    }
  };

  const handleSubjectPointerDown = (
    event: PointerEvent<HTMLButtonElement>,
    subjectId: string,
  ) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    event.preventDefault();
    event.stopPropagation();

    const handleElement = event.currentTarget;
    handleElement.focus({ preventScroll: true });
    handleElement.setPointerCapture(event.pointerId);
    subjectDragRef.current = {
      pointerId: event.pointerId,
      subjectId,
      startY: event.clientY,
      startScrollTop: subjectListRef.current?.scrollTop ?? 0,
      handleElement,
      previousUserSelect: document.body.style.userSelect,
      previousCursor: document.body.style.cursor,
    };
    document.body.style.userSelect = "none";
    document.body.style.cursor = "grabbing";
    setDraggingSubjectId(subjectId);
    setSubjectDragOffsetY(0);
    setSubjectDropTarget(null);
    subjectDropTargetRef.current = null;
  };

  const handleSubjectPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const dragState = subjectDragRef.current;
    if (dragState.pointerId !== event.pointerId || !dragState.subjectId) return;

    event.preventDefault();
    const listElement = subjectListRef.current;
    if (!listElement) return;

    const listRect = listElement.getBoundingClientRect();
    const edgeSize = 36;
    if (event.clientY < listRect.top + edgeSize) {
      listElement.scrollTop -= 12;
    } else if (event.clientY > listRect.bottom - edgeSize) {
      listElement.scrollTop += 12;
    }
    setSubjectDragOffsetY(
      event.clientY - dragState.startY + (listElement.scrollTop - dragState.startScrollTop),
    );

    if (event.clientY < listRect.top - 24 || event.clientY > listRect.bottom + 24) {
      setSubjectDropTarget(null);
      subjectDropTargetRef.current = null;
      return;
    }

    const targetElements = Array.from(
      listElement.querySelectorAll<HTMLElement>("[data-subject-drop-id]"),
    ).filter((element) => element.dataset.subjectDropId !== dragState.subjectId);

    const targetElement =
      targetElements.find((element) => {
        const rect = element.getBoundingClientRect();
        return event.clientY >= rect.top && event.clientY <= rect.bottom;
      }) ??
      targetElements.reduce<HTMLElement | null>((nearest, element) => {
        if (!nearest) return element;
        const elementRect = element.getBoundingClientRect();
        const nearestRect = nearest.getBoundingClientRect();
        const elementDistance = Math.abs(event.clientY - (elementRect.top + elementRect.height / 2));
        const nearestDistance = Math.abs(event.clientY - (nearestRect.top + nearestRect.height / 2));
        return elementDistance < nearestDistance ? element : nearest;
      }, null);

    const targetSubjectId = targetElement?.dataset.subjectDropId;
    if (!targetElement || !targetSubjectId) {
      setSubjectDropTarget(null);
      subjectDropTargetRef.current = null;
      return;
    }

    const targetRect = targetElement.getBoundingClientRect();
    const nextDropTarget = {
      subjectId: targetSubjectId,
      placement: (event.clientY < targetRect.top + targetRect.height / 2
        ? "before"
        : "after") as SubjectDropPlacement,
    };
    subjectDropTargetRef.current = nextDropTarget;
    setSubjectDropTarget(nextDropTarget);
  };

  const handleSubjectPointerEnd = (event: PointerEvent<HTMLButtonElement>, commit: boolean) => {
    const dragState = subjectDragRef.current;
    if (dragState.pointerId !== event.pointerId || !dragState.subjectId) return;

    const dropTarget = subjectDropTargetRef.current;
    if (commit && dropTarget) {
      reorderSubject(
        dragState.subjectId,
        dropTarget.subjectId,
        dropTarget.placement,
      );
    }
    resetSubjectDrag();
  };

  const handleSubjectLostPointerCapture = (event: PointerEvent<HTMLButtonElement>) => {
    if (subjectDragRef.current.pointerId === event.pointerId) {
      resetSubjectDrag();
    }
  };

  const handleSubjectDragKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    subjectId: string,
  ) => {
    if (event.key === "Escape" && subjectDragRef.current.subjectId) {
      event.preventDefault();
      resetSubjectDrag();
      return;
    }

    const sourceIndex = subjects.findIndex((subject) => subject.id === subjectId);
    if (sourceIndex < 0) return;

    if (event.key === "ArrowUp" && sourceIndex > 0) {
      event.preventDefault();
      reorderSubject(subjectId, subjects[sourceIndex - 1]!.id, "before");
    } else if (event.key === "ArrowDown" && sourceIndex < subjects.length - 1) {
      event.preventDefault();
      reorderSubject(subjectId, subjects[sourceIndex + 1]!.id, "after");
    }
  };

  const closeSubjectManage = () => {
    resetSubjectDrag();
    setIsSubjectManageOpen(false);
  };

  useEffect(
    () => () => {
      const { pointerId, previousUserSelect, previousCursor } = subjectDragRef.current;
      if (pointerId !== null) {
        document.body.style.userSelect = previousUserSelect;
        document.body.style.cursor = previousCursor;
      }
    },
    [],
  );

  const renderPaletteOptions = (
    selectedPalette: SubjectCoverPalette,
    onSelect: (palette: SubjectCoverPalette) => void,
  ) => (
    <div className="flex flex-wrap gap-3">
      {coverPalettes.map((palette) => (
        <button
          key={palette.id}
          type="button"
          onClick={() => onSelect(palette.id)}
          className={[
            "flex items-center gap-2 rounded-full border px-2.5 py-2 text-xs font-semibold transition",
            selectedPalette === palette.id
              ? "border-red-500 bg-red-50 text-red-700 dark:border-red-600 dark:bg-red-950/30 dark:text-red-400"
              : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800",
          ].join(" ")}
        >
          <span
            className="h-6 w-6 rounded-full border border-white/60 shadow-sm ring-1 ring-black/10"
            style={getSubjectCoverStyle(palette.label, palette.id)}
          />
          <span>{palette.label}</span>
        </button>
      ))}
    </div>
  );

  const handleDeleteSubject = (subject: Subject) => {
    const affectedCount = sessions.filter(
      (session) => sessionSubjectMap[session.id] === subject.id,
    ).length;

    setDialog({
      title: "과목을 삭제할까요?",
      description:
        affectedCount > 0
          ? `${subject.name}\n\n이 과목에 배정된 ${affectedCount}개 문제는 '과목 없음'으로 이동합니다.`
          : `${subject.name}\n\n삭제 후에도 문제 데이터는 유지됩니다.`,
      confirmLabel: "삭제",
      variant: "danger",
      onCancel: () => setDialog(null),
      onConfirm: () => {
        deleteSubject(subject.id);
        setDialog(null);
      },
    });
  };

  return (
    <div className="app-page px-4 py-8 transition-colors duration-300 md:px-6">
      <div className="mx-auto max-w-6xl">
        <DashboardHeaderTitle
          title="과목 대시보드"
          logoTo="/home"
          logoLabel="홈으로 이동"
        >
          <button
            type="button"
            onClick={() => setIsSubjectManageOpen(true)}
            className="app-button-primary app-button-primary-standalone rounded-xl px-3 py-2 text-sm font-semibold sm:px-4"
          >
            과목 관리
          </button>
          <Link
            to="/home"
            className="app-button-secondary rounded-xl px-3 py-2 text-center text-sm font-semibold sm:px-4"
          >
            <ReturnLinkLabel>홈으로</ReturnLinkLabel>
          </Link>
        </DashboardHeaderTitle>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {subjectCards.map((subject) => (
            <Link
              key={subject.id}
              to={getSubjectDashboardPath(subject.id)}
              className="app-card app-subject-card group overflow-hidden rounded-2xl border transition hover:-translate-y-0.5 hover:shadow-[var(--app-shadow-hover)]"
              style={
                {
                  "--subject-accent": getSubjectAccentColor(subject.coverPalette ?? "warm"),
                } as CSSProperties
              }
            >
              <SubjectCardCover
                title={subject.name}
                coverStyle={getSubjectCoverStyle(
                  subject.name,
                  subject.coverPalette ?? "warm",
                )}
                badge={(
                  <span className="shrink-0 rounded-full border border-white/25 bg-white/25 px-2.5 py-1 text-xs font-bold text-white shadow-sm backdrop-blur">
                    {subject.total}개
                  </span>
                )}
              />

              <div className="grid h-[104px] grid-cols-2 gap-2 p-4 text-sm">
                <div className="app-subtle-surface flex flex-col justify-center rounded-xl border p-3">
                  <p className="text-xs text-stone-500 dark:text-stone-500">풀이 중</p>
                  <p className="mt-1 font-semibold text-red-600 dark:text-red-500">{subject.inProgress}</p>
                </div>
                <div className="app-subtle-surface flex flex-col justify-center rounded-xl border p-3">
                  <p className="text-xs text-stone-500 dark:text-stone-500">채점 완료</p>
                  <p className="mt-1 font-semibold text-blue-600 dark:text-blue-400">{subject.completed}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <AppFooter />
      </div>

      {isSubjectManageOpen ? (
        <div className="fixed inset-0 z-50">
          <button onClick={closeSubjectManage} className="app-modal-backdrop absolute inset-0" />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2">
            <div className="app-modal-surface rounded-2xl border p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">과목 관리</h2>
                <IconCloseButton onClick={closeSubjectManage} label="과목 관리 닫기" />
              </div>

              <button
                onClick={() => setIsCreateSubjectOpen(true)}
                className="app-button-primary app-button-primary-standalone w-full rounded-xl px-4 py-3 text-sm font-semibold"
              >
                새 과목 추가
              </button>

              <div
                ref={subjectListRef}
                className="mt-5 max-h-[42vh] space-y-2 overflow-y-auto overscroll-contain px-1"
              >
                {subjects.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-stone-200 bg-stone-50 p-4 text-center text-sm text-stone-500 dark:border-stone-800 dark:bg-stone-950/50 dark:text-stone-500">
                    아직 추가한 과목이 없습니다.
                  </p>
                ) : (
                  <>
                    <p className="px-1 pb-1 text-xs font-medium text-stone-500 dark:text-stone-500">
                      왼쪽 손잡이를 끌어 순서를 바꿔 보세요. 키보드에서는 손잡이에 초점을 둔 뒤 ↑↓ 키를 사용할 수 있습니다.
                    </p>
                    {subjects.map((subject) => (
                      <div
                        key={subject.id}
                        data-subject-drop-id={subject.id}
                        className={[
                          "relative flex select-none items-center gap-3 rounded-xl border border-stone-200 bg-white p-3 transition-[border-color,background-color,box-shadow] duration-100 hover:border-red-200 hover:bg-red-50/30 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-red-900/60 dark:hover:bg-red-950/10",
                          draggingSubjectId === subject.id
                            ? "z-20 border-red-300 bg-white shadow-xl ring-2 ring-red-100 will-change-transform dark:border-red-800 dark:bg-stone-900 dark:ring-red-900/40"
                            : "",
                        ].join(" ")}
                        style={
                          draggingSubjectId === subject.id
                            ? { transform: `translate3d(0, ${subjectDragOffsetY}px, 0)` }
                            : undefined
                        }
                      >
                        {subjectDropTarget?.subjectId === subject.id &&
                        draggingSubjectId !== subject.id ? (
                          <span
                            aria-hidden="true"
                            className={[
                              "pointer-events-none absolute left-2 right-2 z-30 h-0.5 rounded-full bg-red-500 shadow-[0_0_0_2px_rgba(255,255,255,0.9)] dark:shadow-[0_0_0_2px_rgba(28,25,23,0.9)]",
                              subjectDropTarget.placement === "before" ? "-top-[5px]" : "-bottom-[5px]",
                            ].join(" ")}
                          />
                        ) : null}

                        <button
                          type="button"
                          aria-label={`${subject.name} 과목 순서 변경`}
                          title="드래그하거나 위·아래 화살표 키로 순서 변경"
                          onPointerDown={(event) => handleSubjectPointerDown(event, subject.id)}
                          onPointerMove={handleSubjectPointerMove}
                          onPointerUp={(event) => handleSubjectPointerEnd(event, true)}
                          onPointerCancel={(event) => handleSubjectPointerEnd(event, false)}
                          onLostPointerCapture={handleSubjectLostPointerCapture}
                          onKeyDown={(event) => handleSubjectDragKeyDown(event, subject.id)}
                          className="grid h-10 w-8 shrink-0 touch-none cursor-grab select-none place-content-center rounded-md border border-transparent text-stone-400 outline-none transition-colors duration-100 hover:border-stone-200 hover:bg-stone-100 hover:text-stone-600 focus-visible:border-red-300 focus-visible:ring-2 focus-visible:ring-red-100 active:cursor-grabbing dark:text-stone-500 dark:hover:border-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-300 dark:focus-visible:border-red-800 dark:focus-visible:ring-red-900/50"
                        >
                          <span aria-hidden="true" className="flex flex-col items-center gap-[3px]">
                            <span className="h-[2px] w-3.5 rounded-full bg-current" />
                            <span className="h-[2px] w-2.5 rounded-full bg-current" />
                            <span className="h-[2px] w-3.5 rounded-full bg-current" />
                          </span>
                        </button>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-stone-800 dark:text-stone-200">
                            {subject.name}
                          </p>
                          <p className="text-xs text-stone-500 dark:text-stone-500">
                            {sessions.filter((session) => sessionSubjectMap[session.id] === subject.id).length}개 문제
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            onClick={() => openEditSubject(subject)}
                            className="app-button-secondary rounded-lg px-3 py-1.5 text-xs font-semibold"
                          >
                            편집
                          </button>
                          <button
                            onClick={() => handleDeleteSubject(subject)}
                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-900/30"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isCreateSubjectOpen ? (
        <div className="fixed inset-0 z-[55]">
          <button onClick={closeCreateSubject} className="app-modal-backdrop absolute inset-0" />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2">
            <form
              onSubmit={handleCreateSubject}
              className="app-modal-surface space-y-4 rounded-2xl border p-6"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">과목 추가</h2>
                <IconCloseButton onClick={closeCreateSubject} label="과목 추가 닫기" />
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-stone-700 dark:text-stone-300">과목명</span>
                <input
                  autoFocus
                  value={newSubjectName}
                  onChange={(event) => setNewSubjectName(event.target.value)}
                  className="app-control w-full rounded-lg px-3 py-2 text-sm"
                  placeholder="예: 민법"
                />
              </label>

              <div className="space-y-2">
                <p className="text-sm font-medium text-stone-700 dark:text-stone-300">표지 색상</p>
                {renderPaletteOptions(newSubjectPalette, setNewSubjectPalette)}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeCreateSubject}
                  className="app-button-secondary rounded-lg px-4 py-2 text-sm font-semibold"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={!newSubjectName.trim()}
                  className="app-button-primary rounded-lg px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                >
                  추가
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {editingSubjectId ? (
        <div className="fixed inset-0 z-[55]">
          <button onClick={closeEditSubject} className="app-modal-backdrop absolute inset-0" />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2">
            <form
              onSubmit={handleEditSubjectSubmit}
              className="app-modal-surface space-y-4 rounded-2xl border p-6"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">과목명 편집</h2>
                <IconCloseButton onClick={closeEditSubject} label="과목명 편집 닫기" />
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-stone-700 dark:text-stone-300">과목명</span>
                <input
                  autoFocus
                  value={editingSubjectName}
                  onChange={(event) => setEditingSubjectName(event.target.value)}
                  className="app-control w-full rounded-lg px-3 py-2 text-sm"
                  placeholder="예: 민법"
                />
              </label>

              <div className="space-y-2">
                <p className="text-sm font-medium text-stone-700 dark:text-stone-300">표지 색상</p>
                {renderPaletteOptions(editingSubjectPalette, setEditingSubjectPalette)}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeEditSubject}
                  className="app-button-secondary rounded-lg px-4 py-2 text-sm font-semibold"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={!editingSubjectName.trim()}
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
