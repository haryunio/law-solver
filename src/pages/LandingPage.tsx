import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { CsvGuideDialog } from "../components/landing/CsvGuideDialog";
import { LandingFeatureCard } from "../components/landing/LandingFeatureCard";
import { LandingServiceFeatures } from "../components/landing/LandingServiceFeatures";
import { LandingSolvePreview } from "../components/landing/LandingSolvePreview";
import { LandingFooter } from "../components/ui/LandingFooter";
import { LandingHeader } from "../components/ui/LandingHeader";

const steps = [
  {
    number: "01",
    eyebrow: "MAKE",
    title: "문제를 직접 만들어요",
    description: "OX, 5지선다, 단답형 중 필요한 형식으로 문제와 해설을 정리해 보세요.",
    visual: (
      <div className="landing-mini-sheet" aria-hidden="true">
        <span className="w-12" />
        <span className="w-full" />
        <span className="w-4/5" />
        <div className="mt-1 flex gap-1.5"><i /><i /><i /></div>
      </div>
    ),
  },
  {
    number: "02",
    eyebrow: "UPLOAD",
    title: "CSV로 간편하게 등록해요",
    description: "엑셀에서 저장한 CSV를 올리면 브라우저에 나만의 문제집이 바로 만들어져요.",
    visual: (
      <div className="landing-upload-icon" aria-hidden="true">
        <span>↑</span>
        <p>CSV</p>
      </div>
    ),
  },
  {
    number: "03",
    eyebrow: "SOLVE",
    title: "시험처럼 집중해서 풀어요",
    description: "타이머, OMR, 책갈피를 활용해 실제 시험처럼 한 문제씩 집중해서 풀어 보세요.",
    visual: (
      <div className="landing-omr-dots" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((item) => <span key={item} className={item === 3 ? "is-active" : ""}>{item}</span>)}
      </div>
    ),
  },
  {
    number: "04",
    eyebrow: "REVIEW",
    title: "오답까지 확실히 복습해요",
    description: "채점 후 틀린 문제만 모아 보고, 다시 풀거나 CSV로 내보내 복습할 수 있어요.",
    visual: (
      <div className="landing-score-ring" aria-hidden="true">
        <strong>84</strong><span>점</span>
      </div>
    ),
  },
];

export function LandingPage() {
  const [isCsvGuideOpen, setIsCsvGuideOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (new URLSearchParams(location.search).get("guide") === "csv") {
      setIsCsvGuideOpen(true);
    }
  }, [location.search]);

  return (
    <div className="landing-page min-h-screen overflow-hidden text-stone-950 transition-colors duration-300 dark:text-stone-50">
      <LandingHeader onOpenCsvGuide={() => setIsCsvGuideOpen(true)} />

      <main id="top">
        <section className="landing-hero relative">
          <div className="landing-glow landing-glow-one" />
          <div className="landing-glow landing-glow-two" />
          <div className="landing-grid-pattern" />

          <div className="landing-container relative grid items-center gap-14 py-20 lg:grid-cols-[0.94fr_1.06fr] lg:py-24">
            <div className="landing-fade-up">
              <div className="landing-eyebrow">
                <span className="landing-pulse-dot" />
                로스쿨 공부를 위한 문제 풀이 공간
              </div>

              <h1 className="landing-hero-title mt-7 max-w-3xl">
                <span className="block">오늘 공부할 문제,</span>
                <span className="landing-gradient-text block">풀이부터 복습까지</span>
              </h1>

              <p className="landing-hero-copy mt-7 max-w-xl text-base leading-7 text-stone-600 sm:text-[17px] sm:leading-8 dark:text-stone-300">
                직접 만든 CSV 문제와 Premium 온라인 문제를 같은 화면에서 풀어 보세요. 채점 후에는 오답과 책갈피를 모아 다시 공부할 수 있어요.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link to="/home" className="landing-primary-cta">
                  문제 풀이 시작하기 <span className="landing-arrow" aria-hidden="true">→</span>
                </Link>
                <a href="#how-it-works" className="landing-secondary-cta">
                  사용법 먼저 보기 <span aria-hidden="true">↓</span>
                </a>
                <Link to="/apps" className="landing-secondary-cta">
                  더 많은 미니 앱 보기 <span aria-hidden="true">→</span>
                </Link>
              </div>

              <p className="mt-8 text-sm text-stone-500 dark:text-stone-400">
                <span className="font-semibold text-stone-700 dark:text-stone-300">제작자:</span>{" "}
                경북대 로스쿨 17기 신하륜 {" - "}
                <a className="font-medium text-red-600 underline underline-offset-4 dark:text-red-400" href="mailto:haryun@knu.ac.kr">
                  haryun@knu.ac.kr
                </a>
              </p>
              <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                CC BY-NC-ND ⓒ 2026 Haryun
              </p>
            </div>

            <div className="landing-hero-visual landing-fade-up landing-delay-1" aria-label="실제 Law Solver 문제 풀이 화면 미리보기">
              <LandingSolvePreview />
            </div>
          </div>
        </section>

        <section className="landing-marquee" aria-label="지원 기능">
          <div className="landing-container grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-stone-200 bg-stone-200 md:grid-cols-4 dark:border-stone-800 dark:bg-stone-800">
            {[
              ["3", "가지 문제 유형"],
              ["CSV", "내 문제로 공부"],
              ["온라인", "Premium 문제 풀이"],
              ["복습", "오답과 책갈피"],
            ].map(([value, label]) => (
              <div key={label} className="bg-white/90 px-5 py-6 text-center dark:bg-stone-900/90">
                <strong className="text-2xl font-bold tracking-tight text-red-600 dark:text-red-500">{value}</strong>
                <p className="mt-1 text-xs font-medium text-stone-500 sm:text-sm dark:text-stone-400">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="landing-section scroll-mt-20">
          <div className="landing-container">
            <div className="mx-auto max-w-2xl text-center">
              <p className="landing-section-label">HOW IT WORKS</p>
              <h2 className="landing-section-title">문제 만들기부터 오답 정리까지<br className="hidden sm:block" /> 한 흐름으로 이어져요</h2>
              <p className="landing-section-copy">오프라인 문제 풀이는 회원가입 없이 시작할 수 있어요. 엑셀에서 문제를 정리한 뒤 CSV 파일로 저장해 주세요.</p>
            </div>

            <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {steps.map((step) => (
                <article key={step.number} className="landing-step-card group">
                  <div className="flex items-start justify-between">
                    <span className="landing-step-number">{step.number}</span>
                    <span className="text-[10px] font-bold tracking-[0.2em] text-red-500/80">{step.eyebrow}</span>
                  </div>
                  <div className="landing-step-visual">{step.visual}</div>
                  <h3 className="mt-6 text-xl font-semibold tracking-[-0.02em]">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-stone-600 dark:text-stone-400">{step.description}</p>
                </article>
              ))}
            </div>

            <div className="mt-9 text-center">
              <button type="button" onClick={() => setIsCsvGuideOpen(true)} className="landing-text-button">
                CSV 양식과 샘플 파일 확인하기 <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </section>

        <section id="features" className="landing-section scroll-mt-20 pt-4 sm:pt-10">
          <div className="landing-container">
            <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
              <article className="landing-bento-card landing-bento-main">
                <div className="relative z-10 max-w-md">
                  <p className="landing-focus-label">FOCUS MODE</p>
                  <h2 className="landing-bento-title mt-4 text-3xl text-white sm:text-4xl">공부 흐름을<br />끊지 않는 풀이 화면</h2>
                  <p className="mt-5 leading-7 text-red-50/80">문제, 선택지, OMR, 타이머를 한 화면에서 확인하세요. 오프라인 문제와 온라인 문제 모두 익숙한 화면에서 풀 수 있어요.</p>
                </div>
                <div className="landing-focus-card" aria-hidden="true">
                  <div className="landing-focus-meta">
                    <span>8번 / 총 50문항</span>
                    <span>채권총론</span>
                    <i>★</i>
                  </div>
                  <p>채무불이행 책임은 채무자의 귀책사유가 있어야 성립한다.</p>
                  <div className="landing-focus-options">
                    <span>O</span>
                    <span className="is-selected">X <b>다음 문제로 ›</b></span>
                  </div>
                  <div className="landing-focus-footer">
                    <span>‹ 이전 문제</span>
                    <strong>다음 문제 ›</strong>
                  </div>
                </div>
              </article>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
                <LandingFeatureCard
                  label="RETRY WRONG"
                  title="틀린 문제는 바로 한 번 더"
                  description="오답과 책갈피 문제를 모아 다시 풀어 보세요. 헷갈렸던 이유는 오답 노트에 남길 수 있어요."
                  icon="↻"
                  compact
                />
                <LandingFeatureCard
                  label="OFFLINE FILE BACKUP"
                  title="내 문제와 기록은 파일로 보관"
                  description="직접 올린 CSV 문제와 풀이 기록은 현재 브라우저에 저장돼요. 결과는 CSV로, 전체 오프라인 데이터는 JSON으로 백업할 수 있어요."
                  icon="⇩"
                  compact
                />
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="study-tools-title" className="landing-section !pt-0">
          <div className="landing-container">
            <div className="mx-auto max-w-2xl text-center">
              <p className="landing-section-label">MORE TOOLS</p>
              <h2 id="study-tools-title" className="landing-section-title">온라인 문제부터 미니 앱까지</h2>
            </div>
            <div className="mt-10 sm:mt-12">
              <LandingServiceFeatures />
            </div>
          </div>
        </section>

        <section className="landing-section pb-24 sm:pb-32">
          <div className="landing-container">
            <div className="landing-final-cta">
              <div className="landing-final-orb landing-final-orb-one" />
              <div className="landing-final-orb landing-final-orb-two" />
              <div className="relative z-10 mx-auto max-w-2xl text-center">
                <p className="text-xs font-bold tracking-[0.18em] text-red-200 sm:text-sm">READY TO SOLVE?</p>
                <h2 className="landing-final-title mt-4 text-white">오늘 공부할 문제,<br />지금 바로 풀어볼까요?</h2>
                <p className="landing-final-copy mx-auto mt-5 max-w-xl leading-7 text-red-50/80">내 CSV로 시작하거나 이용 가능한 온라인 문제를 골라 보세요. 샘플 파일로 풀이 화면을 먼저 살펴봐도 좋아요.</p>
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                  <Link to="/home" className="landing-primary-cta is-light">
                    문제 풀이 시작하기 <span className="landing-arrow" aria-hidden="true">→</span>
                  </Link>
                  <button type="button" onClick={() => setIsCsvGuideOpen(true)} className="landing-final-guide-button">샘플 CSV 받기</button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />

      {isCsvGuideOpen ? <CsvGuideDialog onClose={() => setIsCsvGuideOpen(false)} /> : null}
    </div>
  );
}
