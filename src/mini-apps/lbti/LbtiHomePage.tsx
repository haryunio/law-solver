import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LbtiLayout } from "./components/LbtiLayout";
import { LbtiTypeCode } from "./components/LbtiTypeCode";
import { lbtiAxes, lbtiTypes, type TypeCode } from "./lib/lbti";

export function LbtiHomePage() {
  const [previewIndex, setPreviewIndex] = useState(() => Math.floor(Math.random() * lbtiTypes.length));
  const previewType = lbtiTypes[previewIndex]!;

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setPreviewIndex((current) => {
        const nextOffset = 1 + Math.floor(Math.random() * (lbtiTypes.length - 1));
        return (current + nextOffset) % lbtiTypes.length;
      });
    }, 4000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <LbtiLayout>
      <main>
        <section className="relative overflow-hidden border-b border-stone-200/70 dark:border-stone-800/70">
          <div className="landing-grid-pattern" />
          <div className="landing-container relative grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
            <div>
              <div className="landing-eyebrow">
                <span className="landing-pulse-dot" />
                LAW SCHOOL STUDY TYPE
              </div>
              <h1 className="mt-6 text-4xl font-black leading-[1.12] tracking-[-0.055em] text-stone-950 sm:text-6xl dark:text-white">
                나는 어떤 방식으로<br />
                <span className="landing-gradient-text">공부하는 사람일까?</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-stone-600 sm:text-lg sm:leading-8 dark:text-stone-300">
                원전과 수험자료, 풀커버와 압축, 회독과 현출, 누적과 마감. 시간이 부족할 때 내가 먼저 고르는 공부 방식을 30개의 질문으로 알아보세요.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/apps/lbti/test" className="app-button-primary app-button-primary-standalone rounded-xl px-6 py-3.5 text-center text-base font-bold">
                  LBTI 테스트 시작하기 →
                </Link>
                <Link to="/apps/lbti/types" className="app-button-secondary rounded-xl px-6 py-3.5 text-center text-base font-bold">
                  16개 유형 먼저 보기
                </Link>
              </div>
              <p className="mt-4 text-xs leading-5 text-stone-400 dark:text-stone-500">
                로스쿨 공부 습관을 재미로 풀어보는 자기점검 테스트예요.
              </p>
            </div>

            <div className="app-card relative overflow-hidden rounded-[2rem] border p-6 sm:p-8">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-red-100/70 blur-2xl dark:bg-red-950/50" />
              <p className="relative text-xs font-bold tracking-[0.16em] text-red-600 dark:text-red-400">YOUR RESULT</p>
              <div key={previewType.code} className="landing-fade-up relative min-h-[190px] sm:min-h-[205px]">
                <div className="mt-5"><LbtiTypeCode code={previewType.code as TypeCode} large /></div>
                <h2 className="mt-5 text-2xl font-black tracking-tight sm:text-3xl">{previewType.name}</h2>
                <p className="mt-3 text-sm leading-6 text-stone-600 dark:text-stone-300">{previewType.description}</p>
              </div>
              <div className="relative mt-6 grid grid-cols-2 gap-2 text-xs font-semibold text-stone-600 dark:text-stone-300">
                {["최종 기준", "학습 범위", "기억 방식", "시간 운영"].map((label) => (
                  <span key={label} className="app-subtle-surface rounded-xl border px-3 py-3">{label}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="landing-container py-14 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="landing-section-label">FOUR DIMENSIONS</p>
            <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-4xl">네 가지 선택이 하나의 유형이 됩니다</h2>
            <p className="mt-4 leading-7 text-stone-600 dark:text-stone-400">어느 쪽이 더 좋은지를 고르는 검사가 아니라, 부족함을 느낄 때 먼저 돌아가는 방향을 찾습니다.</p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {lbtiAxes.map((axis) => (
              <article key={axis.id} className="app-card rounded-2xl border p-5 sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold tracking-[0.14em] text-red-600 dark:text-red-400">{axis.code}</p>
                    <h3 className="mt-1 text-lg font-bold">{axis.name}</h3>
                  </div>
                  <span className="text-xs text-stone-400">{axis.question}</span>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  {[axis.left, axis.right].map((pole) => (
                    <div key={pole.code} className="app-subtle-surface rounded-xl border p-3">
                      <strong className="text-sm text-stone-900 dark:text-stone-100">{pole.code} · {pole.label}</strong>
                      <p className="mt-1.5 text-xs leading-5 text-stone-500 dark:text-stone-400">{pole.summary}</p>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </LbtiLayout>
  );
}
