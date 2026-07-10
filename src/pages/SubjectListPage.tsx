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
import { getSubjectDashboardPath, SubjectDropPlacement } from "../lib/subject";
import { NO_SUBJECT_ID, Subject, SubjectCoverPalette } from "../types/test";
import { useTestStore } from "../store/useTestStore";
import { FontFamily, useSettingsStore } from "../store/useSettingsStore";

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

const hashString = (value: string) =>
  [...value].reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0);

const coverPalettes: Array<{
  id: SubjectCoverPalette;
  label: string;
  base?: [number, number, number];
}> = [
  { id: "warm", label: "노을", base: [8, 32, 50] },
  { id: "green", label: "새싹", base: [104, 78, 48] },
  { id: "blue", label: "바다", base: [218, 202, 188] },
  { id: "purple", label: "마법", base: [278, 304, 330] },
  { id: "gray", label: "우주" },
];

const defaultCoverPalette = coverPalettes[0]!;

const getPaletteById = (paletteId: SubjectCoverPalette) =>
  coverPalettes.find((palette) => palette.id === paletteId) ?? defaultCoverPalette;

const getSubjectCoverStyle = (
  subjectName: string,
  paletteId: SubjectCoverPalette,
): CSSProperties => {
  const hash = Math.abs(hashString(subjectName));
  const palette = getPaletteById(paletteId);
  const angle = 105 + (hash % 151);

  if (palette.id === "gray") {
    const start = 16 + (hash % 8);
    const mid = 42 + ((hash >> 3) % 12);
    const end = 78 + ((hash >> 6) % 10);

    return {
      background: `linear-gradient(${angle}deg, hsl(0 0% ${start}%), hsl(0 0% ${mid}%) 52%, hsl(0 0% ${end}%))`,
    };
  }

  const [baseStart, baseMid, baseEnd] = palette?.base ?? [8, 32, 50];
  const start = baseStart + (hash % 12) - 6;
  const mid = baseMid + ((hash >> 3) % 12) - 6;
  const end = baseEnd + ((hash >> 6) % 12) - 6;

  return {
    background: `linear-gradient(${angle}deg, hsl(${start} 68% 50%), hsl(${mid} 72% 56%) 52%, hsl(${end} 78% 62%))`,
  };
};

const getSubjectAccentColor = (paletteId: SubjectCoverPalette) => {
  const palette = getPaletteById(paletteId);
  if (palette.id === "gray") return "hsl(0 0% 46%)";

  const [, baseMid] = palette.base ?? defaultCoverPalette.base ?? [8, 32, 50];
  return `hsl(${baseMid} 72% 54%)`;
};

export function SubjectListPage() {
  const sessions = useTestStore((state) => state.sessions);
  const subjects = useTestStore((state) => state.subjects);
  const sessionSubjectMap = useTestStore((state) => state.sessionSubjectMap);
  const createSubject = useTestStore((state) => state.createSubject);
  const updateSubject = useTestStore((state) => state.updateSubject);
  const reorderSubject = useTestStore((state) => state.reorderSubject);
  const deleteSubject = useTestStore((state) => state.deleteSubject);
  const resetSessions = useTestStore((state) => state.resetSessions);
  const importDashboardData = useTestStore((state) => state.importDashboardData);
  const getDashboardBackupData = useTestStore((state) => state.getDashboardBackupData);
  const { darkMode, toggleDarkMode, fontFamily, setFontFamily } = useSettingsStore();

  const [isSubjectManageOpen, setIsSubjectManageOpen] = useState(false);
  const [isCreateSubjectOpen, setIsCreateSubjectOpen] = useState(false);
  const [isDashboardManageOpen, setIsDashboardManageOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
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

  const handleBackup = () => {
    const data = JSON.stringify(getDashboardBackupData(), null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `law-solver-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRestore = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (re) => {
        try {
          const content = re.target?.result as string;
          const data = JSON.parse(content);
          if (Array.isArray(data) || (data && Array.isArray(data.sessions))) {
            setDialog({
              title: "전체 데이터를 불러올까요?",
              description: "현재 과목, 문제, 풀이내역, 오답노트가 백업 파일 내용으로 모두 덮어씌워집니다.",
              confirmLabel: "불러오기",
              variant: "danger",
              onCancel: () => setDialog(null),
              onConfirm: () => {
                if (Array.isArray(data)) {
                  importDashboardData({
                    sessions: data,
                    subjects: [],
                    sessionSubjectMap: {},
                  });
                } else {
                  importDashboardData({
                    sessions: data.sessions,
                    subjects: data.subjects,
                    sessionSubjectMap: data.sessionSubjectMap,
                  });
                }
                setIsDashboardManageOpen(false);
                setDialog({
                  title: "복구가 완료되었습니다.",
                  description: "백업 파일의 전체 데이터가 반영되었습니다.",
                  confirmLabel: "확인",
                  variant: "success",
                  onConfirm: () => setDialog(null),
                });
              },
            });
          } else {
            setDialog({
              title: "백업 파일을 확인해 주세요.",
              description: "올바른 Law Solver 백업 JSON 형식이 아닙니다.",
              confirmLabel: "확인",
              onConfirm: () => setDialog(null),
            });
          }
        } catch (err) {
          setDialog({
            title: "파일을 읽지 못했습니다.",
            description: "JSON 파일이 손상되었거나 읽을 수 없는 형식입니다.",
            confirmLabel: "확인",
            onConfirm: () => setDialog(null),
          });
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleReset = () => {
    setDialog({
      title: "전체 데이터를 초기화할까요?",
      description: "과목, 문제, 풀이내역, 오답노트가 모두 삭제됩니다. 이 작업은 되돌릴 수 없습니다.",
      confirmLabel: "초기화",
      variant: "danger",
      onCancel: () => setDialog(null),
      onConfirm: () => {
        resetSessions();
        setIsDashboardManageOpen(false);
        setDialog({
          title: "초기화가 완료되었습니다.",
          description: "전체 데이터베이스가 초기화되었습니다.",
          confirmLabel: "확인",
          variant: "success",
          onConfirm: () => setDialog(null),
        });
      },
    });
  };

  return (
    <div className="app-page px-4 py-8 transition-colors duration-300 md:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <DashboardHeaderTitle
            title="과목 대시보드"
            description="과목을 선택해 문제 풀이 대시보드로 이동하세요."
            logoTo="/"
            logoLabel="메인으로 이동"
          />
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="app-button-secondary rounded-lg px-4 py-2 text-sm font-semibold"
            >
              환경설정
            </button>
            <button
              onClick={() => setIsDashboardManageOpen(true)}
              className="app-button-secondary rounded-lg px-4 py-2 text-sm font-semibold"
            >
              데이터 관리
            </button>
            <button
              onClick={() => setIsSubjectManageOpen(true)}
              className="app-button-primary app-button-primary-standalone rounded-lg px-4 py-2 text-sm font-semibold"
            >
              과목 관리
            </button>
          </div>
        </header>

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
              <div
                className="relative h-[104px] overflow-hidden"
                style={getSubjectCoverStyle(
                  subject.name,
                  subject.coverPalette ?? "warm",
                )}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.30),transparent_34%),radial-gradient(circle_at_88%_12%,rgba(255,255,255,0.20),transparent_28%)]" />
                <div className="absolute inset-0 hidden bg-black/30 dark:block" />
                <div className="absolute left-0 top-0 h-full w-4 bg-black/10" />
                <div className="absolute left-4 top-0 h-full w-px bg-white/25" />
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/36 via-black/14 to-transparent" />
                <div className="absolute bottom-4 left-6 right-5 flex items-end justify-between gap-3">
                  <h2 className="min-w-0 truncate text-2xl font-semibold text-white drop-shadow-sm">
                    {subject.name}
                  </h2>
                  <span className="shrink-0 rounded-full border border-white/25 bg-white/25 px-2.5 py-1 text-xs font-bold text-white shadow-sm backdrop-blur">
                    {subject.total}개
                  </span>
                </div>
              </div>

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

      {isSettingsOpen ? (
        <div className="fixed inset-0 z-50">
          <button onClick={() => setIsSettingsOpen(false)} className="app-modal-backdrop absolute inset-0" />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-sm -translate-x-1/2 -translate-y-1/2">
            <div className="app-modal-surface rounded-2xl border p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">환경설정</h2>
                <IconCloseButton onClick={() => setIsSettingsOpen(false)} label="환경설정 닫기" />
              </div>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-stone-700 dark:text-stone-300">다크 모드</span>
                  <button
                    onClick={toggleDarkMode}
                    className={[
                      "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none",
                      darkMode ? "bg-red-600" : "bg-stone-200 dark:bg-stone-800",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out dark:bg-stone-200",
                        darkMode ? "translate-x-5" : "translate-x-0",
                      ].join(" ")}
                    />
                  </button>
                </div>

                <div className="space-y-3">
                  <span className="text-sm font-medium text-stone-700 dark:text-stone-300">글꼴 설정</span>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { id: "pretendard", label: "기본 (Pretendard)", class: "font-pretendard" },
                      { id: "nanum-gothic", label: "나눔고딕", class: "font-nanum-gothic" },
                      { id: "nanum-myeongjo", label: "나눔명조", class: "font-nanum-myeongjo" },
                    ].map((font) => (
                      <button
                        key={font.id}
                        onClick={() => setFontFamily(font.id as FontFamily)}
                        className={[
                          "flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition",
                          fontFamily === font.id
                            ? "border-red-600 bg-red-50 text-red-700 dark:border-red-600 dark:bg-red-950/30 dark:text-red-400"
                            : "border-stone-200 bg-white text-stone-700 dark:border-stone-800 dark:bg-stone-800 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700",
                          font.class,
                        ].join(" ")}
                      >
                        <span>{font.label}</span>
                        {fontFamily === font.id && <span className="text-xs font-bold">●</span>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isDashboardManageOpen ? (
        <div className="fixed inset-0 z-50">
          <button onClick={() => setIsDashboardManageOpen(false)} className="app-modal-backdrop absolute inset-0" />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-sm -translate-x-1/2 -translate-y-1/2">
            <div className="app-modal-surface rounded-2xl border p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">전체 데이터 관리</h2>
                <IconCloseButton onClick={() => setIsDashboardManageOpen(false)} label="전체 데이터 관리 닫기" />
              </div>
              <div className="grid gap-3">
                <button
                  onClick={handleBackup}
                  className="flex w-full flex-col items-center justify-center rounded-xl border border-stone-200 bg-white p-4 transition hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-900 dark:hover:bg-stone-800"
                >
                  <span className="text-sm font-bold text-stone-800 dark:text-stone-200">전체 데이터 백업하기</span>
                  <span className="text-xs text-stone-500 dark:text-stone-500">과목, 문제, 풀이 기록을 JSON으로 저장</span>
                </button>
                <button
                  onClick={handleRestore}
                  className="flex w-full flex-col items-center justify-center rounded-xl border border-stone-200 bg-white p-4 transition hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-900 dark:hover:bg-stone-800"
                >
                  <span className="text-sm font-bold text-stone-800 dark:text-stone-200">전체 데이터 불러오기</span>
                  <span className="text-xs text-stone-500 dark:text-stone-500">백업 파일로 현재 데이터베이스 덮어쓰기</span>
                </button>
                <button
                  onClick={handleReset}
                  className="flex w-full flex-col items-center justify-center rounded-xl border border-red-100 bg-red-50 p-4 transition hover:bg-red-100/50 dark:border-red-900/50 dark:bg-red-950/30 dark:hover:bg-red-900/30"
                >
                  <span className="text-sm font-bold text-red-600 dark:text-red-400">전체 초기화</span>
                  <span className="text-xs text-red-500 dark:text-red-500">모든 과목, 문제, 기록 영구 삭제</span>
                </button>
              </div>
            </div>
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
