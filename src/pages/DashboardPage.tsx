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
  const navigate = useNavigate();
  const [openUpload, setOpenUpload] = useState(false);

  const sortedSessions = useMemo(
    () =>
      [...sessions].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    [sessions],
  );

  return (
    <div className="min-h-screen px-4 py-8 md:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-red-600">Law Solver</p>
            <h1 className="text-2xl font-semibold text-stone-900 md:text-3xl">문제 풀이 대시보드</h1>
          </div>
          <button
            onClick={() => setOpenUpload(true)}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            새 문제 등록
          </button>
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
            <CsvUploadPanel
              onCreated={(sessionId) => {
                setOpenUpload(false);
                navigate(`/solve/${sessionId}`);
              }}
            />
            <button
              onClick={() => setOpenUpload(false)}
              className="mt-2 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-600"
            >
              닫기
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
