import { useState } from "react";
import { Link } from "react-router-dom";
import { AppFooter } from "../components/ui/AppFooter";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { DashboardHeaderTitle } from "../components/ui/DashboardHeaderTitle";
import { ReturnLinkLabel } from "../components/ui/ReturnLinkLabel";
import { FontFamily, useSettingsStore } from "../store/useSettingsStore";
import { useTestStore } from "../store/useTestStore";

type SettingsTab = "appearance" | "data";

type DialogState = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "danger" | "success";
  onConfirm: () => void;
  onCancel?: () => void;
};

const fontOptions: Array<{ id: FontFamily; label: string; className: string }> = [
  { id: "pretendard", label: "기본 (Pretendard)", className: "font-pretendard" },
  { id: "nanum-gothic", label: "나눔고딕", className: "font-nanum-gothic" },
  { id: "nanum-myeongjo", label: "나눔명조", className: "font-nanum-myeongjo" },
];

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("appearance");
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const { darkMode, toggleDarkMode, fontFamily, setFontFamily } = useSettingsStore();
  const sessions = useTestStore((state) => state.sessions);
  const subjects = useTestStore((state) => state.subjects);
  const resetSessions = useTestStore((state) => state.resetSessions);
  const importDashboardData = useTestStore((state) => state.importDashboardData);
  const getDashboardBackupData = useTestStore((state) => state.getDashboardBackupData);

  const handleBackup = () => {
    const data = JSON.stringify(getDashboardBackupData(), null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `law-solver-backup-${new Date().toISOString().split("T")[0]}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleRestore = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        try {
          const content = readerEvent.target?.result as string;
          const data = JSON.parse(content);
          if (!Array.isArray(data) && !(data && Array.isArray(data.sessions))) {
            setDialog({
              title: "백업 파일을 확인해 주세요.",
              description: "올바른 Law Solver 백업 JSON 형식이 아닙니다.",
              confirmLabel: "확인",
              onConfirm: () => setDialog(null),
            });
            return;
          }

          setDialog({
            title: "오프라인 데이터를 불러올까요?",
            description:
              "현재 브라우저의 과목, 문제, 풀이내역과 오답노트가 백업 파일 내용으로 모두 덮어씌워집니다.",
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
              setDialog({
                title: "복구가 완료되었습니다.",
                description: "백업 파일의 오프라인 데이터가 이 브라우저에 반영되었습니다.",
                confirmLabel: "확인",
                variant: "success",
                onConfirm: () => setDialog(null),
              });
            },
          });
        } catch {
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
      title: "오프라인 데이터를 초기화할까요?",
      description:
        "이 브라우저에 저장된 과목, 문제, 풀이내역과 오답노트가 모두 삭제됩니다. 이 작업은 되돌릴 수 없습니다.",
      confirmLabel: "초기화",
      variant: "danger",
      onCancel: () => setDialog(null),
      onConfirm: () => {
        resetSessions();
        setDialog({
          title: "초기화가 완료되었습니다.",
          description: "이 브라우저의 오프라인 학습 데이터가 삭제되었습니다.",
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
        <DashboardHeaderTitle
          title="환경설정"
          logoTo="/home"
          logoLabel="홈으로 이동"
        >
          <Link
            to="/home"
            className="app-button-secondary rounded-xl px-3 py-2 text-center text-sm font-semibold sm:px-4"
          >
            <ReturnLinkLabel>홈으로</ReturnLinkLabel>
          </Link>
        </DashboardHeaderTitle>

        <div className="app-card rounded-2xl border p-2">
          <div className="grid grid-cols-2 gap-2" role="tablist" aria-label="환경설정 분류">
            {[
              ["appearance", "화면 설정"],
              ["data", "오프라인 데이터"],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={activeTab === id}
                onClick={() => setActiveTab(id as SettingsTab)}
                className={[
                  "rounded-xl px-4 py-3 text-sm font-semibold transition-colors duration-150",
                  activeTab === id
                    ? "bg-red-600 text-white shadow-sm"
                    : "text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          {activeTab === "appearance" ? (
            <section role="tabpanel" className="grid gap-4 lg:grid-cols-2">
              <article className="app-card rounded-2xl border p-5 sm:p-6">
                <p className="text-xs font-bold tracking-[0.14em] text-red-600 dark:text-red-400">THEME</p>
                <h2 className="mt-2 text-xl font-bold text-stone-950 dark:text-stone-100">테마</h2>
                <p className="mt-1 text-xs leading-5 text-stone-500 dark:text-stone-400">
                  화면을 라이트 또는 다크 테마로 전환합니다.
                </p>
                <div className="app-subtle-surface mt-5 flex items-center justify-between rounded-xl border p-4">
                  <div>
                    <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">다크 모드</p>
                    <p className="mt-1 text-xs text-stone-500 dark:text-stone-500">
                      현재 {darkMode ? "다크" : "라이트"} 테마
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={darkMode}
                    aria-label="다크 모드"
                    onClick={toggleDarkMode}
                    className={[
                      "relative inline-flex h-7 w-12 shrink-0 rounded-full border-2 border-transparent outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2",
                      darkMode ? "bg-red-600" : "bg-stone-300 dark:bg-stone-700",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "pointer-events-none inline-block h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-150",
                        darkMode ? "translate-x-5" : "translate-x-0",
                      ].join(" ")}
                    />
                  </button>
                </div>
              </article>

              <article className="app-card rounded-2xl border p-5 sm:p-6">
                <p className="text-xs font-bold tracking-[0.14em] text-red-600 dark:text-red-400">TYPOGRAPHY</p>
                <h2 className="mt-2 text-xl font-bold text-stone-950 dark:text-stone-100">글꼴</h2>
                <p className="mt-1 text-xs leading-5 text-stone-500 dark:text-stone-400">
                  문제, 선택지와 해설에 사용할 글꼴을 변경합니다.
                </p>
                <div className="mt-5 grid gap-2">
                  {fontOptions.map((font) => (
                    <button
                      key={font.id}
                      type="button"
                      onClick={() => setFontFamily(font.id)}
                      className={[
                        "flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-colors duration-150",
                        fontFamily === font.id
                          ? "border-red-500 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-950/30 dark:text-red-300"
                          : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800",
                        font.className,
                      ].join(" ")}
                    >
                      <span>{font.label}</span>
                      <span aria-hidden="true" className="text-xs font-bold">
                        {fontFamily === font.id ? "●" : "가"}
                      </span>
                    </button>
                  ))}
                </div>
              </article>
            </section>
          ) : (
            <section role="tabpanel" className="space-y-4">
              <article className="app-card rounded-2xl border p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-bold tracking-[0.14em] text-red-600 dark:text-red-400">LOCAL DATA</p>
                    <h2 className="mt-2 text-xl font-bold text-stone-950 dark:text-stone-100">오프라인 데이터 관리</h2>
                    <p className="mt-1 text-xs leading-5 text-stone-500 dark:text-stone-400">
                      오프라인 과목, 문제와 풀이 기록만 관리합니다. Premium 데이터는 포함되지 않습니다.
                    </p>
                  </div>
                  <div className="app-neutral-box grid shrink-0 grid-cols-2 overflow-hidden rounded-xl text-center">
                    <div className="border-r border-stone-200 px-4 py-3 dark:border-stone-700">
                      <p className="text-[11px] text-stone-500">과목</p>
                      <p className="mt-1 font-bold tabular-nums">{subjects.length}</p>
                    </div>
                    <div className="px-4 py-3">
                      <p className="text-[11px] text-stone-500">세션</p>
                      <p className="mt-1 font-bold tabular-nums">{sessions.length}</p>
                    </div>
                  </div>
                </div>
              </article>

              <div className="grid gap-4 md:grid-cols-3">
                <article className="app-card flex flex-col rounded-2xl border p-5">
                  <h3 className="font-bold text-stone-950 dark:text-stone-100">백업하기</h3>
                  <p className="mt-1 flex-1 text-xs leading-5 text-stone-500 dark:text-stone-400">
                    오프라인 데이터를 JSON 파일로 저장합니다.
                  </p>
                  <button onClick={handleBackup} className="app-button-secondary mt-5 rounded-xl px-4 py-3 text-sm font-semibold">
                    백업 파일 저장
                  </button>
                </article>
                <article className="app-card flex flex-col rounded-2xl border p-5">
                  <h3 className="font-bold text-stone-950 dark:text-stone-100">불러오기</h3>
                  <p className="mt-1 flex-1 text-xs leading-5 text-stone-500 dark:text-stone-400">
                    백업 JSON으로 현재 오프라인 데이터를 교체합니다.
                  </p>
                  <button onClick={handleRestore} className="app-button-secondary mt-5 rounded-xl px-4 py-3 text-sm font-semibold">
                    백업 파일 선택
                  </button>
                </article>
                <article className="app-card flex flex-col rounded-2xl border p-5">
                  <h3 className="font-bold text-red-700 dark:text-red-400">전체 초기화</h3>
                  <p className="mt-1 flex-1 text-xs leading-5 text-stone-500 dark:text-stone-400">
                    이 브라우저의 오프라인 학습 데이터를 모두 삭제합니다.
                  </p>
                  <button
                    onClick={handleReset}
                    className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
                  >
                    오프라인 데이터 초기화
                  </button>
                </article>
              </div>
            </section>
          )}
        </div>

        <AppFooter />
      </div>

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
