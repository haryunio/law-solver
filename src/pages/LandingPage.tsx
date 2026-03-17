import { useState } from "react";
import { Link } from "react-router-dom";

export function LandingPage() {
  const [isCsvGuideOpen, setIsCsvGuideOpen] = useState(false);

  return (
    <>
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(230,57,70,0.14),transparent_35%),radial-gradient(circle_at_80%_70%,rgba(230,57,70,0.08),transparent_35%)]" />

        <div className="relative w-full max-w-3xl rounded-3xl border border-stone-200 bg-white/85 p-8 text-center shadow-xl backdrop-blur md:p-12">
          <p className="text-4xl font-bold tracking-tight text-red-600 md:text-6xl">Law Solver</p>
          <h1 className="mt-4 text-lg font-medium leading-relaxed text-stone-600 md:text-xl">
            보기좋게 풀고, 바로 복기하는 로스쿨 문제 풀이 앱
          </h1>

          <div className="mx-auto mt-6 max-w-2xl space-y-2 text-sm leading-6 text-stone-700 md:text-base">
            <p>
              OX, 5지선다 문제를{" "}
              <button
                type="button"
                onClick={() => setIsCsvGuideOpen(true)}
                className="font-semibold text-red-600 underline underline-offset-2"
              >
                CSV 파일
              </button>
              로 만든 다음, 웹 환경에서 직접 풀어볼 수 있습니다.
            </p>
            <p>창작 문제, 스터디 문제 풀이 등에 사용해 보세요.</p>
            <p>다 푼 문제는 다시 CSV로 저장해 보관할 수 있고, 오답풀이도 바로 할 수 있습니다.</p>
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800">
              서버 없이 브라우저에만 저장되니, 중요한 데이터는 CSV로 꼭 백업해 주세요.
            </p>
          </div>

          <div className="mt-10 flex justify-center">
            <Link
              to="/dashboard"
              className="inline-flex items-center rounded-2xl bg-red-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:scale-[1.02] hover:bg-red-700"
            >
              문제 풀러 가요!
            </Link>
          </div>

          <div className="mt-10 border-t border-stone-200 pt-5 text-sm text-stone-600">
            <p>제작자: 경북대 로스쿨 17기 신하륜</p>
            <p className="mt-1">
              연락처:{" "}
              <a className="font-medium text-red-600 underline" href="mailto:haryun@knu.ac.kr">
                haryun@knu.ac.kr
              </a>
            </p>
          </div>
        </div>
      </div>

      {isCsvGuideOpen ? (
        <div className="fixed inset-0 z-50">
          <button onClick={() => setIsCsvGuideOpen(false)} className="absolute inset-0 bg-black/40" />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl">
            <button
              onClick={() => setIsCsvGuideOpen(false)}
              className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-stone-300 bg-white text-sm font-semibold text-stone-600 hover:bg-stone-100"
              aria-label="CSV 가이드 닫기"
            >
              X
            </button>

            <h2 className="text-lg font-semibold text-stone-900">CSV 헤더 가이드</h2>

            <div className="mt-4 space-y-4 text-sm text-stone-700">
              <div>
                <p className="font-semibold text-red-600">OX 문제 CSV 양식</p>
                <p className="mt-1 rounded-md bg-stone-100 px-3 py-2 font-mono">
                  번호,챕터,문제,정답,해설,출처
                </p>
              </div>

              <div>
                <p className="font-semibold text-red-600">5지선다 CSV 양식</p>
                <p className="mt-1 rounded-md bg-stone-100 px-3 py-2 font-mono">
                  번호,챕터,문제,선택지1,선택지2,선택지3,선택지4,선택지5,정답,해설,출처
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
