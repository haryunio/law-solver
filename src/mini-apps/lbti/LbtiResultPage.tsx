import { useMemo, useState } from "react";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import { LbtiLayout } from "./components/LbtiLayout";
import { LbtiTypeCode } from "./components/LbtiTypeCode";
import { poleContent, typeQuotes } from "./content";
import {
  getOppositeType,
  getRelatedTypes,
  getSelectedPoles,
  getTypeDefinition,
  isTypeCode,
  type AxisScore,
  type TypeCode,
} from "./lib/lbti";

interface ResultLocationState {
  axisScores?: AxisScore[];
}

export function LbtiResultPage() {
  const { typeCode = "" } = useParams();
  const location = useLocation();
  const [shareStatus, setShareStatus] = useState("");
  const normalizedCode = typeCode.toUpperCase();
  const axisScores = (location.state as ResultLocationState | null)?.axisScores;
  const scoreByAxis = useMemo(
    () => new Map(axisScores?.map((score) => [score.axisId, score]) ?? []),
    [axisScores],
  );

  if (!isTypeCode(normalizedCode)) return <Navigate to="/apps/lbti/types" replace />;

  const code = normalizedCode as TypeCode;
  const type = getTypeDefinition(code)!;
  const selectedPoles = getSelectedPoles(code);
  const relatedTypes = getRelatedTypes(code);
  const oppositeType = getOppositeType(code);
  const resultUrl = `${window.location.origin}/apps/lbti/result/${code.toLowerCase()}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(resultUrl);
      setShareStatus("링크를 복사했어요.");
    } catch {
      setShareStatus("링크를 복사하지 못했어요.");
    }
  };

  const shareResult = async () => {
    if (!navigator.share) {
      await copyLink();
      return;
    }
    try {
      await navigator.share({
        title: `LBTI ${code} · ${type.name}`,
        text: `나의 LBTI는 ${code}, ${type.name}!`,
        url: resultUrl,
      });
    } catch {
      setShareStatus("");
    }
  };

  return (
    <LbtiLayout>
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-red-700 via-red-600 to-orange-500 px-5 py-9 text-white shadow-[0_24px_60px_rgba(185,28,28,0.24)] sm:px-10 sm:py-12 lg:px-14">
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full border border-white/15 bg-white/5" />
          <div className="absolute -bottom-32 -left-16 h-72 w-72 rounded-full border border-white/10" />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-bold tracking-[0.18em] text-red-100">MY LAW SCHOOL STUDY TYPE</p>
              <div className="mt-5"><LbtiTypeCode code={code} large /></div>
              <h1 className="mt-6 text-3xl font-black tracking-[-0.04em] sm:text-5xl">{type.name}</h1>
              <blockquote className="mt-4 text-lg font-bold text-orange-50 sm:text-xl">“{typeQuotes[code]}”</blockquote>
              <p className="mt-5 max-w-3xl text-sm leading-7 text-red-50/90 sm:text-base">{type.description}</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row lg:w-44 lg:flex-col">
              <button type="button" onClick={shareResult} className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-red-700 shadow-sm transition hover:bg-red-50">
                결과 공유하기
              </button>
              <button type="button" onClick={copyLink} className="rounded-xl border border-white/35 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/20">
                링크 복사
              </button>
              {shareStatus ? <p className="text-center text-xs text-red-100" aria-live="polite">{shareStatus}</p> : null}
            </div>
          </div>
        </section>

        <section className="mt-8" aria-labelledby="axis-result-title">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-[0.15em] text-red-600 dark:text-red-400">TYPE BREAKDOWN</p>
              <h2 id="axis-result-title" className="mt-2 text-2xl font-black tracking-tight">네 글자를 풀어보면</h2>
            </div>
            {axisScores ? <span className="text-xs text-stone-400">내 응답 점수 반영</span> : null}
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {selectedPoles.map(({ axisId, axis, selected, opposite }) => {
              const score = scoreByAxis.get(axisId);
              return (
                <article key={axisId} className="app-card rounded-2xl border p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold text-stone-400">{axis.code} · {axis.name}</p>
                      <h3 className="mt-2 text-xl font-black text-red-600 dark:text-red-400">{selected.code} · {selected.label}</h3>
                    </div>
                    {score ? <strong className="text-2xl font-black text-stone-800 dark:text-stone-200">{score.winnerPercent}%</strong> : null}
                  </div>
                  <p className="mt-3 text-sm leading-6 text-stone-600 dark:text-stone-300">{selected.summary}</p>
                  {score ? (
                    <>
                      <div className="mt-4 flex items-center justify-between text-xs font-semibold">
                        <span className="text-red-600 dark:text-red-400">{selected.code} {selected.label}</span>
                        <span className="text-stone-400">{opposite.code} {opposite.label}</span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-700">
                        <div className="app-progress-gradient h-full rounded-full" style={{ width: `${score.winnerPercent}%` }} />
                      </div>
                    </>
                  ) : (
                    <p className="app-subtle-surface mt-4 rounded-lg border px-3 py-2 text-xs font-semibold text-stone-500 dark:text-stone-400">
                      이 유형은 {selected.code} · {selected.label} 방향을 선택합니다.
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-2">
          <article className="app-card rounded-2xl border p-5 sm:p-7">
            <p className="text-xs font-bold tracking-[0.15em] text-red-600 dark:text-red-400">DESK SCENE</p>
            <h2 className="mt-2 text-xl font-black">책상 위 풍경</h2>
            <ul className="mt-5 space-y-3">
              {selectedPoles.map(({ selected }) => (
                <li key={selected.code} className="flex gap-3 text-sm leading-6 text-stone-600 dark:text-stone-300">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                  {poleContent[selected.code].desk}
                </li>
              ))}
            </ul>
          </article>
          <article className="app-card rounded-2xl border p-5 sm:p-7">
            <p className="text-xs font-bold tracking-[0.15em] text-orange-600 dark:text-orange-400">D-30</p>
            <h2 className="mt-2 text-xl font-black">시험 30일 전의 당신</h2>
            <ul className="mt-5 space-y-3">
              {selectedPoles.map(({ selected }) => (
                <li key={selected.code} className="flex gap-3 text-sm leading-6 text-stone-600 dark:text-stone-300">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                  {poleContent[selected.code].thirtyDays}
                </li>
              ))}
            </ul>
          </article>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 sm:p-7 dark:border-emerald-900/70 dark:bg-emerald-950/25">
            <p className="text-xs font-bold tracking-[0.15em] text-emerald-700 dark:text-emerald-400">STRENGTH</p>
            <h2 className="mt-2 text-xl font-black">이 유형이 가진 힘</h2>
            <ul className="mt-5 space-y-3">
              {selectedPoles.map(({ selected }) => <li key={selected.code} className="text-sm leading-6 text-stone-700 dark:text-stone-300">✓ {poleContent[selected.code].strength}</li>)}
            </ul>
          </article>
          <article className="rounded-2xl border border-blue-200 bg-blue-50/70 p-5 sm:p-7 dark:border-blue-900/70 dark:bg-blue-950/25">
            <p className="text-xs font-bold tracking-[0.15em] text-blue-700 dark:text-blue-400">STUDY TIP</p>
            <h2 className="mt-2 text-xl font-black">조금 더 잘 쓰는 방법</h2>
            <ul className="mt-5 space-y-3">
              {selectedPoles.map(({ selected }) => <li key={selected.code} className="text-sm leading-6 text-stone-700 dark:text-stone-300">→ {poleContent[selected.code].tip}</li>)}
            </ul>
          </article>
        </section>

        <section className="app-subtle-surface mt-8 rounded-2xl border p-5 sm:p-7">
          <p className="text-xs font-bold tracking-[0.15em] text-amber-700 dark:text-amber-400">OVERDRIVE</p>
          <h2 className="mt-2 text-xl font-black">과몰입 모드가 켜지면</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {selectedPoles.map(({ selected }) => (
              <p key={selected.code} className="rounded-xl bg-white/70 p-4 text-sm leading-6 text-stone-600 dark:bg-stone-900/50 dark:text-stone-300">
                <strong className="mr-2 text-amber-700 dark:text-amber-400">{selected.code}</strong>{poleContent[selected.code].overdrive}
              </p>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <p className="text-xs font-bold tracking-[0.15em] text-red-600 dark:text-red-400">TYPE CONNECTIONS</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight">가까운 유형과 정반대 유형</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {relatedTypes.map((related) => (
              <Link key={related.code} to={`/apps/lbti/result/${related.code.toLowerCase()}`} className="app-card rounded-2xl border p-4 transition hover:border-red-300 dark:hover:border-red-800">
                <LbtiTypeCode code={related.code as TypeCode} />
                <h3 className="mt-3 font-black">{related.name}</h3>
                <p className="mt-2 text-xs leading-5 text-stone-500 dark:text-stone-400">한 글자 차이로 다른 공부 리듬</p>
              </Link>
            ))}
            {oppositeType ? (
              <Link to={`/apps/lbti/result/${oppositeType.code.toLowerCase()}`} className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-4 transition hover:border-red-300 dark:border-stone-700 dark:bg-stone-900/50 dark:hover:border-red-800">
                <LbtiTypeCode code={oppositeType.code as TypeCode} />
                <h3 className="mt-3 font-black">{oppositeType.name}</h3>
                <p className="mt-2 text-xs leading-5 text-stone-500 dark:text-stone-400">네 축이 모두 반대인 유형</p>
              </Link>
            ) : null}
          </div>
        </section>

        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/apps/lbti/test" className="app-button-primary rounded-xl px-6 py-3.5 text-center text-sm font-bold">테스트 다시 하기</Link>
          <Link to="/apps/lbti/types" className="app-button-secondary rounded-xl px-6 py-3.5 text-center text-sm font-bold">16개 유형 모두 보기</Link>
        </div>
      </main>
    </LbtiLayout>
  );
}
