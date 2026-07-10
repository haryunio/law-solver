import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { IconCloseButton } from "../components/ui/IconCloseButton";
import { useSettingsStore } from "../store/useSettingsStore";

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

function LogoMark({ small = false }: { small?: boolean }) {
  return (
    <img
      className={`landing-logo-mark${small ? " is-small" : ""}`}
      src="/favicon.svg"
      alt=""
      aria-hidden="true"
    />
  );
}

export function LandingPage() {
  const [isCsvGuideOpen, setIsCsvGuideOpen] = useState(false);
  const { darkMode, toggleDarkMode } = useSettingsStore();

  useEffect(() => {
    if (!isCsvGuideOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsCsvGuideOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCsvGuideOpen]);

  return (
    <div className="landing-page min-h-screen overflow-hidden text-stone-950 transition-colors duration-300 dark:text-stone-50">
      <header className="landing-nav-wrap">
        <nav className="landing-container flex h-[72px] items-center justify-between" aria-label="주요 메뉴">
          <a href="#top" className="group flex items-center gap-2.5" aria-label="Law Solver 홈">
            <LogoMark />
            <span className="text-[17px] font-semibold tracking-[-0.015em]">Law Solver</span>
          </a>

          <div className="hidden items-center gap-7 text-sm font-medium text-stone-600 md:flex dark:text-stone-300">
            <a className="landing-nav-link" href="#how-it-works">사용 방법</a>
            <a className="landing-nav-link" href="#features">주요 기능</a>
            <button className="landing-nav-link" type="button" onClick={() => setIsCsvGuideOpen(true)}>CSV 가이드</button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleDarkMode}
              className="landing-theme-button"
              aria-label={darkMode ? "라이트 모드로 전환" : "다크 모드로 전환"}
            >
              <span aria-hidden="true">{darkMode ? "☀" : "☾"}</span>
            </button>
            <Link to="/dashboard" className="landing-nav-cta">
              시작하기 <span aria-hidden="true">→</span>
            </Link>
          </div>
        </nav>
      </header>

      <main id="top">
        <section className="landing-hero relative">
          <div className="landing-glow landing-glow-one" />
          <div className="landing-glow landing-glow-two" />
          <div className="landing-grid-pattern" />

          <div className="landing-container relative grid items-center gap-14 py-20 lg:grid-cols-[1.08fr_0.92fr] lg:py-24">
            <div className="landing-fade-up">
              <div className="landing-eyebrow">
                <span className="landing-pulse-dot" />
                서버 없이, 내 브라우저에 안전하게
              </div>

              <h1 className="landing-hero-title mt-7 max-w-3xl">
                <span className="block">직접 만든 문제,</span>
                <span className="landing-gradient-text block">나만의 문제집으로</span>
              </h1>

              <p className="landing-hero-copy mt-7 max-w-xl text-base leading-7 text-stone-600 sm:text-[17px] sm:leading-8 dark:text-stone-300">
                OX, 5지선다, 단답형 문제를 직접 만들고 실제 시험처럼 풀어 보세요. 채점부터 오답 복습까지 한곳에서 이어집니다.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link to="/dashboard" className="landing-primary-cta">
                  문제 풀러 가요! <span className="landing-arrow" aria-hidden="true">→</span>
                </Link>
                <a href="#how-it-works" className="landing-secondary-cta">
                  사용법 먼저 보기 <span aria-hidden="true">↓</span>
                </a>
              </div>

              <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-stone-500 sm:text-sm dark:text-stone-400">
                <span>✓ 회원가입 없음</span>
                <span>✓ 무료로 사용</span>
                <span>✓ 브라우저 자동 저장</span>
              </div>
            </div>

            <div className="landing-hero-visual landing-fade-up landing-delay-1" aria-label="Law Solver 문제 풀이 화면 미리보기">
              <div className="landing-float-chip landing-float-chip-top">
                <span>✓</span> 자동 채점 완료
              </div>
              <div className="landing-float-chip landing-float-chip-bottom">
                <span>↗</span> 오답만 다시 풀기
              </div>

              <div className="landing-app-window">
                <div className="landing-window-bar">
                  <div className="flex gap-1.5" aria-hidden="true"><i /><i /><i /></div>
                  <span>민법 (채권각론)</span>
                  <span className="landing-timer">24:18</span>
                </div>
                <div className="landing-progress-track"><span /></div>

                <div className="p-5 sm:p-7">
                  <div className="flex items-center justify-between">
                    <span className="landing-question-tag">OX · QUESTION 08</span>
                    <span className="text-lg text-stone-400" aria-hidden="true">☆</span>
                  </div>
                  <h2 className="landing-preview-question mt-5 font-semibold tracking-[-0.015em]">
                    주택임대차보호법에 따른 임대차에서 그 기간이 끝난 후 임차인이 보증금을 반환받기 위해 목적물을 점유하고 있는 경우에도 여전히 보증금반환채권에 대한 소멸시효는 진행한다고 보아야 한다.
                  </h2>
                  <div className="landing-ox-choices mt-5" aria-label="정답 선택 미리보기">
                    <div className="landing-ox-choice"><span>O</span><p>그렇다</p></div>
                    <div className="landing-ox-choice is-selected"><span>X</span><p>아니다</p></div>
                  </div>
                  <div className="landing-preview-explanation mt-4">
                    <div><span>정답 X</span><strong>해설</strong></div>
                    <p>주택임대차보호법에 따른 임대차에서 그 기간이 끝난 후 임차인이 보증금을 반환받기 위해 목적물을 점유하고 있는 경우 보증금반환채권에 대한 소멸시효는 진행하지 않는다고 보아야 한다.</p>
                  </div>
                  <div className="mt-7 flex items-center justify-between border-t border-stone-200 pt-5 dark:border-stone-700">
                    <button className="landing-preview-button is-muted" type="button">← 이전</button>
                    <div className="hidden gap-1.5 sm:flex" aria-hidden="true">
                      {[1, 2, 3, 4, 5].map((item) => <i key={item} className={item === 3 ? "is-current" : ""} />)}
                    </div>
                    <button className="landing-preview-button" type="button">다음 →</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-marquee" aria-label="지원 기능">
          <div className="landing-container grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-stone-200 bg-stone-200 md:grid-cols-4 dark:border-stone-800 dark:bg-stone-800">
            {[
              ["3", "가지 문제 유형"],
              ["CSV", "간편 업로드"],
              ["즉시", "채점과 오답 확인"],
              ["100%", "내 기기에 저장"],
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
              <p className="landing-section-copy">설치나 회원가입 없이, 준비한 문제만 있으면 바로 시작할 수 있어요.</p>
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
                  <p className="landing-section-label text-red-200">FOCUS MODE</p>
                  <h2 className="landing-bento-title mt-4 text-3xl text-white sm:text-4xl">공부 흐름을<br />끊지 않는 풀이 화면</h2>
                  <p className="mt-5 leading-7 text-red-50/80">문제, 선택지, OMR, 타이머에만 집중하세요. 답안과 책갈피는 자동으로 저장됩니다.</p>
                </div>
                <div className="landing-focus-card" aria-hidden="true">
                  <div><span>08</span><i>BOOKMARK</i></div>
                  <p>채무불이행의 요건에 관한 설명으로 옳은 것을 고르시오.</p>
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map((item) => <b key={item} className={item === 3 ? "is-active" : ""}>{item}</b>)}
                  </div>
                </div>
              </article>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
                <article className="landing-bento-card">
                  <div className="flex items-center gap-4">
                    <span className="landing-feature-icon">↻</span>
                    <div>
                      <h3 className="text-xl font-semibold tracking-tight">틀린 문제는 바로 한 번 더</h3>
                      <p className="mt-1 text-sm leading-6 text-stone-600 dark:text-stone-400">오답만 모아 확인하고 다시 풀면서 기억을 단단하게 만들어요.</p>
                    </div>
                  </div>
                </article>
                <article className="landing-bento-card">
                  <div className="flex items-center gap-4">
                    <span className="landing-feature-icon">⇩</span>
                    <div>
                      <h3 className="text-xl font-semibold tracking-tight">학습 기록은 내 방식대로 보관</h3>
                      <p className="mt-1 text-sm leading-6 text-stone-600 dark:text-stone-400">풀이 결과는 CSV로, 전체 데이터는 JSON으로 간편하게 백업해요.</p>
                    </div>
                  </div>
                </article>
              </div>
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
                <p className="landing-final-copy mx-auto mt-5 max-w-xl leading-7 text-red-50/80">CSV가 없어도 괜찮아요. 샘플 파일로 Law Solver의 풀이 방식을 먼저 경험해 보세요.</p>
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                  <Link to="/dashboard" className="landing-primary-cta is-light">
                    문제 풀러 가요! <span className="landing-arrow" aria-hidden="true">→</span>
                  </Link>
                  <button type="button" onClick={() => setIsCsvGuideOpen(true)} className="landing-final-guide-button">샘플 CSV 받기</button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-stone-200 bg-white/60 dark:border-stone-800 dark:bg-stone-950/50">
        <div className="landing-container flex flex-col gap-4 py-7 text-xs text-stone-500 sm:flex-row sm:items-center sm:justify-between dark:text-stone-500">
          <div className="flex items-center gap-2 font-semibold text-stone-700 dark:text-stone-300"><LogoMark small /> Law Solver</div>
          <p>경북대 로스쿨 17기 신하륜 · <a className="transition hover:text-red-600" href="mailto:haryun@knu.ac.kr">haryun@knu.ac.kr</a></p>
          <p>CC BY-NC-ND ⓒ 2026 Haryun</p>
        </div>
      </footer>

      {isCsvGuideOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="csv-guide-title">
          <button onClick={() => setIsCsvGuideOpen(false)} className="absolute inset-0 bg-stone-950/55 backdrop-blur-sm" aria-label="CSV 가이드 바깥 영역 닫기" />
          <div className="landing-modal relative max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl sm:p-8 dark:border-stone-700 dark:bg-stone-900">
            <IconCloseButton onClick={() => setIsCsvGuideOpen(false)} label="CSV 가이드 닫기" className="absolute right-4 top-4" />
            <p className="landing-section-label">CSV STARTER GUIDE</p>
            <h2 id="csv-guide-title" className="mt-2 pr-10 text-2xl font-bold tracking-tight text-stone-950 dark:text-white">문제 파일은 이렇게 만들어요</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-400">첫 줄에 아래 헤더를 넣고, 둘째 줄부터 문제를 한 줄씩 작성해 주세요.</p>

            <div className="mt-6 space-y-3 text-sm">
              {[
                ["OX · 단답형", "번호,챕터,문제,정답,해설,출처"],
                ["5지선다", "번호,챕터,문제,선택지1,선택지2,선택지3,선택지4,선택지5,정답,해설,출처"],
              ].map(([title, header]) => (
                <div key={title} className="rounded-2xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-700 dark:bg-stone-800/70">
                  <p className="font-semibold text-red-600 dark:text-red-400">{title}</p>
                  <p className="mt-2 overflow-x-auto whitespace-nowrap rounded-lg bg-white px-3 py-2.5 font-mono text-xs text-stone-700 dark:bg-stone-900 dark:text-stone-300">{header}</p>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <p className="font-semibold text-stone-900 dark:text-stone-100">바로 써볼 수 있는 샘플</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {[
                  ["OX 문제", "/samples/OX_sample.csv"],
                  ["5지선다", "/samples/5지선다_sample.csv"],
                  ["단답형", "/samples/단답형_sample.csv"],
                ].map(([label, href]) => (
                  <a key={href} className="landing-sample-link" href={href} download>{label} <span>↓</span></a>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
              <strong>기억해 주세요.</strong> 데이터는 서버가 아닌 현재 브라우저에 저장됩니다. 중요한 문제와 기록은 CSV 또는 전체 백업으로 보관해 주세요.
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
