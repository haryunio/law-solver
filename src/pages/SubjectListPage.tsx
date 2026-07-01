import { CSSProperties, FormEvent, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { DashboardHeaderTitle } from "../components/ui/DashboardHeaderTitle";
import { IconCloseButton } from "../components/ui/IconCloseButton";
import { getSubjectDashboardPath } from "../lib/subject";
import { NO_SUBJECT_ID, Subject } from "../types/test";
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
}

const hashString = (value: string) =>
  [...value].reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0);

const getSubjectCoverStyle = (subjectName: string): CSSProperties => {
  const hash = Math.abs(hashString(subjectName));
  const hueA = 2 + (hash % 26);
  const hueB = 24 + ((hash >> 3) % 22);
  const hueC = 42 + ((hash >> 6) % 16);
  const angle = 105 + (hash % 151);

  return {
    background: `linear-gradient(${angle}deg, hsl(${hueA} 68% 50%), hsl(${hueB} 72% 56%) 52%, hsl(${hueC} 78% 62%))`,
  };
};

export function SubjectListPage() {
  const sessions = useTestStore((state) => state.sessions);
  const subjects = useTestStore((state) => state.subjects);
  const sessionSubjectMap = useTestStore((state) => state.sessionSubjectMap);
  const createSubject = useTestStore((state) => state.createSubject);
  const renameSubject = useTestStore((state) => state.renameSubject);
  const deleteSubject = useTestStore((state) => state.deleteSubject);
  const resetSessions = useTestStore((state) => state.resetSessions);
  const importDashboardData = useTestStore((state) => state.importDashboardData);
  const getDashboardBackupData = useTestStore((state) => state.getDashboardBackupData);
  const { darkMode, toggleDarkMode, fontFamily, setFontFamily } = useSettingsStore();

  const [isSubjectManageOpen, setIsSubjectManageOpen] = useState(false);
  const [isDashboardManageOpen, setIsDashboardManageOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [subjectName, setSubjectName] = useState("");
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [editingSubjectName, setEditingSubjectName] = useState("");
  const [dialog, setDialog] = useState<DialogState | null>(null);

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
      };
    };

    return [makeStats(null), ...subjects.map((subject) => makeStats(subject))];
  }, [sessions, sessionSubjectMap, subjects]);

  const handleCreateSubject = (event: FormEvent) => {
    event.preventDefault();
    const trimmedName = subjectName.trim();
    if (!trimmedName) return;

    if (subjects.some((subject) => subject.name.trim().toLowerCase() === trimmedName.toLowerCase())) {
      setDialog({
        title: "이미 있는 과목입니다.",
        description: "같은 이름의 과목이 이미 등록되어 있습니다.",
        confirmLabel: "확인",
        onConfirm: () => setDialog(null),
      });
      return;
    }

    createSubject(trimmedName);
    setSubjectName("");
  };

  const openEditSubject = (subject: Subject) => {
    setEditingSubjectId(subject.id);
    setEditingSubjectName(subject.name);
  };

  const closeEditSubject = () => {
    setEditingSubjectId(null);
    setEditingSubjectName("");
  };

  const handleEditSubjectSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!editingSubjectId) return;

    const trimmedName = editingSubjectName.trim();
    if (!trimmedName) return;

    if (
      subjects.some(
        (subject) =>
          subject.id !== editingSubjectId &&
          subject.name.trim().toLowerCase() === trimmedName.toLowerCase(),
      )
    ) {
      setDialog({
        title: "이미 있는 과목입니다.",
        description: "같은 이름의 과목이 이미 등록되어 있습니다.",
        confirmLabel: "확인",
        onConfirm: () => setDialog(null),
      });
      return;
    }

    renameSubject(editingSubjectId, trimmedName);
    closeEditSubject();
  };

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
    <div className="min-h-screen px-4 py-8 md:px-6 dark:bg-stone-950 transition-colors duration-300">
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
              className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800"
            >
              환경설정
            </button>
            <button
              onClick={() => setIsDashboardManageOpen(true)}
              className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800"
            >
              데이터 관리
            </button>
            <button
              onClick={() => setIsSubjectManageOpen(true)}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
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
              className="group overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-red-200 hover:shadow-md dark:border-stone-800 dark:bg-stone-900 dark:hover:border-red-900/60"
            >
              <div
                className="relative h-[104px] overflow-hidden"
                style={getSubjectCoverStyle(subject.name)}
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
                <div className="flex flex-col justify-center rounded-xl bg-stone-50 p-3 dark:bg-stone-950/50">
                  <p className="text-xs text-stone-500 dark:text-stone-500">풀이 중</p>
                  <p className="mt-1 font-semibold text-red-600 dark:text-red-500">{subject.inProgress}</p>
                </div>
                <div className="flex flex-col justify-center rounded-xl bg-stone-50 p-3 dark:bg-stone-950/50">
                  <p className="text-xs text-stone-500 dark:text-stone-500">채점 완료</p>
                  <p className="mt-1 font-semibold text-blue-600 dark:text-blue-400">{subject.completed}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

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

      {isSubjectManageOpen ? (
        <div className="fixed inset-0 z-50">
          <button onClick={() => setIsSubjectManageOpen(false)} className="absolute inset-0 bg-black/35 dark:bg-black/60" />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2">
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl dark:border-stone-800 dark:bg-stone-900">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">과목 관리</h2>
                <IconCloseButton onClick={() => setIsSubjectManageOpen(false)} label="과목 관리 닫기" />
              </div>

              <form onSubmit={handleCreateSubject} className="flex gap-2">
                <input
                  value={subjectName}
                  onChange={(event) => setSubjectName(event.target.value)}
                  className="min-w-0 flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none ring-red-200 transition focus:ring-2 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:ring-red-900/50"
                  placeholder="예: 민법"
                />
                <button
                  type="submit"
                  disabled={!subjectName.trim()}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  추가
                </button>
              </form>

              <div className="mt-5 max-h-[42vh] space-y-2 overflow-y-auto">
                {subjects.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-stone-200 bg-stone-50 p-4 text-center text-sm text-stone-500 dark:border-stone-800 dark:bg-stone-950/50 dark:text-stone-500">
                    아직 추가한 과목이 없습니다.
                  </p>
                ) : (
                  subjects.map((subject) => (
                    <div
                      key={subject.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-900"
                    >
                      <div className="min-w-0">
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
                          className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
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
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {editingSubjectId ? (
        <div className="fixed inset-0 z-[55]">
          <button onClick={closeEditSubject} className="absolute inset-0 bg-black/35 dark:bg-black/60" />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2">
            <form
              onSubmit={handleEditSubjectSubmit}
              className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl dark:border-stone-800 dark:bg-stone-900"
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
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none ring-red-200 transition focus:ring-2 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:ring-red-900/50"
                  placeholder="예: 민법"
                />
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeEditSubject}
                  className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={!editingSubjectName.trim()}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
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
          <button onClick={() => setIsSettingsOpen(false)} className="absolute inset-0 bg-black/35 dark:bg-black/60" />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-sm -translate-x-1/2 -translate-y-1/2">
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl dark:border-stone-800 dark:bg-stone-900">
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
          <button onClick={() => setIsDashboardManageOpen(false)} className="absolute inset-0 bg-black/35 dark:bg-black/60" />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-sm -translate-x-1/2 -translate-y-1/2">
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl dark:border-stone-800 dark:bg-stone-900">
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
