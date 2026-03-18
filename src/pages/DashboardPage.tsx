import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CsvUploadPanel } from "../components/upload/CsvUploadPanel";
import { formatElapsedTime } from "../lib/time";
import { useTestStore } from "../store/useTestStore";

const orderModeLabel = {
  number: "번호 순서",
  "chapter-random": "챕터별 랜덤",
  random: "전체 랜덤",
} as const;

export function DashboardPage() {
  const sessions = useTestStore((state) => state.sessions);
  const deleteSession = useTestStore((state) => state.deleteSession);
  const resetSessions = useTestStore((state) => state.resetSessions);
  const importSessions = useTestStore((state) => state.importSessions);
  const navigate = useNavigate();
  const [openUpload, setOpenUpload] = useState(false);
  const [openManage, setOpenManage] = useState(false);

  const sortedSessions = useMemo(
    () =>
      [...sessions].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    [sessions],
  );

  const handleBackup = () => {
    const data = JSON.stringify(sessions, null, 2);
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
          if (Array.isArray(data)) {
            if (window.confirm("현재 데이터를 덮어씌우고 백업 데이터를 불러올까요?")) {
              importSessions(data);
              setOpenManage(false);
              alert("복구가 완료되었습니다.");
            }
          } else {
            alert("올바른 백업 파일이 아닙니다.");
          }
        } catch (err) {
          alert("파일을 읽는 중 오류가 발생했습니다.");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleReset = () => {
    if (window.confirm("정말로 모든 데이터를 초기화할까요? 이 작업은 되돌릴 수 없습니다.")) {
      resetSessions();
      setOpenManage(false);
      alert("모든 데이터가 초기화되었습니다.");
    }
  };

  return (
    <div className="min-h-screen px-4 py-8 md:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <Link
              to="/"
              className="inline-flex text-m font-bold text-red-600 hover:underline"
              aria-label="메인으로 이동"
            >
              Law Solver
            </Link>
            <h1 className="text-2xl font-semibold text-stone-900 md:text-3xl">문제 풀이 대시보드</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setOpenManage(true)}
              className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
            >
              대시보드 관리
            </button>
            <button
              onClick={() => setOpenUpload(true)}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              새 문제 등록
            </button>
          </div>
        </header>

        {sortedSessions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center">
            <p className="text-base font-medium text-stone-700">등록된 문제 세션이 없습니다.</p>
            <p className="mt-1 text-sm text-stone-500">CSV 업로드로 OX 또는 5지선다 문제를 시작하세요.</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {sortedSessions.map((session) => (
              <article key={session.id} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <h2 className="line-clamp-2 text-base font-semibold text-stone-900">{session.title}</h2>
                  <span
                    className={[
                      "rounded-full px-2 py-1 text-xs font-semibold",
                      session.status === "completed"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-red-50 text-red-700",
                    ].join(" ")}
                  >
                    {session.status === "completed" ? "채점 완료" : "풀이 중"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm text-stone-600">
                  <p>유형: {session.type}</p>
                  <p>
                    진도: {session.solved_questions}/{session.total_questions}
                  </p>
                  <p>순서: {orderModeLabel[session.order_mode ?? "number"]}</p>
                  <p>점수: {session.score}%</p>
                  <p>시간: {formatElapsedTime(session.elapsed_time)}</p>
                </div>

                <p className="mt-2 text-xs text-stone-400">
                  생성일: {new Date(session.created_at).toLocaleString("ko-KR")}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {session.status === "completed" ? (
                    <Link
                      to={`/result/${session.id}`}
                      className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700"
                    >
                      결과보기
                    </Link>
                  ) : (
                    <Link
                      to={`/solve/${session.id}`}
                      className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white"
                    >
                      이어풀기
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      if (!window.confirm("이 세션을 삭제할까요?")) return;
                      deleteSession(session.id);
                    }}
                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700"
                  >
                    삭제
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {openUpload ? (
        <div className="fixed inset-0 z-50">
          <button onClick={() => setOpenUpload(false)} className="absolute inset-0 bg-black/35" />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2">
            <button
              onClick={() => setOpenUpload(false)}
              className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-stone-300 bg-white text-sm font-semibold text-stone-600 shadow-sm transition hover:bg-stone-100"
              aria-label="모달 닫기"
            >
              X
            </button>
            <CsvUploadPanel
              onCreated={(sessionId) => {
                setOpenUpload(false);
                navigate(`/solve/${sessionId}`);
              }}
            />
          </div>
        </div>
      ) : null}

      {openManage ? (
        <div className="fixed inset-0 z-50">
          <button onClick={() => setOpenManage(false)} className="absolute inset-0 bg-black/35" />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-sm -translate-x-1/2 -translate-y-1/2">
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-stone-900">대시보드 관리</h2>
                <button
                  onClick={() => setOpenManage(false)}
                  className="text-stone-400 hover:text-stone-600"
                >
                  X
                </button>
              </div>
              <div className="grid gap-3">
                <button
                  onClick={handleBackup}
                  className="flex w-full flex-col items-center justify-center rounded-xl border border-stone-200 bg-white p-4 transition hover:bg-stone-50"
                >
                  <span className="text-sm font-bold text-stone-800">대시보드 백업하기</span>
                  <span className="text-xs text-stone-500">모든 데이터를 JSON으로 저장</span>
                </button>
                <button
                  onClick={handleRestore}
                  className="flex w-full flex-col items-center justify-center rounded-xl border border-stone-200 bg-white p-4 transition hover:bg-stone-50"
                >
                  <span className="text-sm font-bold text-stone-800">대시보드 불러오기</span>
                  <span className="text-xs text-stone-500">백업 파일에서 데이터 복구</span>
                </button>
                <button
                  onClick={handleReset}
                  className="flex w-full flex-col items-center justify-center rounded-xl border border-red-100 bg-red-50 p-4 transition hover:bg-red-100/50"
                >
                  <span className="text-sm font-bold text-red-600">초기화</span>
                  <span className="text-xs text-red-500">모든 데이터 영구 삭제</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
