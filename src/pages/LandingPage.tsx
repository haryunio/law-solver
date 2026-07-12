import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { IconCloseButton } from "../components/ui/IconCloseButton";
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

const csvGuides = [
  {
    title: "OX",
    description: "정답에는 O 또는 X를 입력합니다.",
    header: "번호,챕터,문제,정답,해설,출처",
    example: "1,채권각론,임대차가 끝난 뒤에도 보증금반환채권의 소멸시효는 진행한다.,X,목적물을 점유하는 동안에는 소멸시효가 진행하지 않습니다.,대법원 판례",
  },
  {
    title: "5지선다",
    description: "선택지 다섯 개를 작성하고 정답에는 1부터 5까지의 번호를 입력합니다.",
    header: "번호,챕터,문제,선택지1,선택지2,선택지3,선택지4,선택지5,정답,해설,출처",
    example: "1,민법총칙,통정허위표시에 관한 설명으로 옳은 것은?,항상 유효하다,선의의 제3자에게 대항할 수 없다,취소해야 무효다,착오와 같다,사기와 같다,2,당사자 사이에서는 무효입니다.,민법 제108조",
  },
  {
    title: "5지선다 · 박스형",
    description: "박스1부터 박스7까지 필요한 만큼 열을 추가하세요. 입력한 순서대로 ㄱ. ㄴ. ㄷ. 보기로 표시되며, 선택지1~5에는 보기의 조합이나 개수를 적습니다.",
    header: "번호,챕터,문제,박스1,박스2,박스3,선택지1,선택지2,선택지3,선택지4,선택지5,정답,해설,출처",
    example: "1,형법총론,옳은 것을 모두 고른 것은?,고의가 있어야 한다.,위법성이 조각될 수 있다.,책임능력이 필요하다.,ㄱ,ㄴ,ㄱ·ㄷ,ㄴ·ㄷ,ㄱ·ㄴ·ㄷ,5,세 보기 모두 옳습니다.,형법 기본서",
  },
  {
    title: "단답형",
    description: "문제의 빈칸에 들어갈 답을 정답 열에 그대로 입력합니다. 현재는 띄어쓰기까지 포함해 입력값이 일치해야 정답으로 처리됩니다.",
    header: "번호,챕터,문제,정답,해설,출처",
    example: "1,매매,타인의 권리를 매매한 매도인이 권리를 이전할 수 없을 때 매수인은 계약을 ____할 수 있다.,해제,민법 제570조에 따른 해제권입니다.,민법 제570조",
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
                서버 없이, 내 브라우저에 안전하게
              </div>

              <h1 className="landing-hero-title mt-7 max-w-3xl">
                <span className="block">직접 만든 문제,</span>
                <span className="landing-gradient-text block">나만의 문제집으로</span>
              </h1>

              <p className="landing-hero-copy mt-7 max-w-xl text-base leading-7 text-stone-600 sm:text-[17px] sm:leading-8 dark:text-stone-300">
                OX, 5지선다, 단답형 문제를 직접 만들고 실제 시험처럼 풀어 보세요. 채점부터 오답 복습까지 한곳에서 이어집니다.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link to="/dashboard" className="landing-primary-cta">
                  문제 풀러 가요! <span className="landing-arrow" aria-hidden="true">→</span>
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
              <div className="landing-cbt-shell">
                <div className="landing-cbt-topbar">
                  <div>
                    <span>타이머</span>
                    <strong>24:18</strong>
                  </div>
                  <b>민법 (채권각론)</b>
                  <div className="landing-cbt-top-actions">
                    <span>일시 중단</span>
                    <span>제출 및 종료</span>
                  </div>
                </div>

                <div className="landing-cbt-layout">
                  <div className="landing-cbt-card">
                    <div className="landing-cbt-content">
                      <div className="landing-cbt-meta">
                        <div>
                          <span>1번 / 총 50문항</span>
                          <span>챕터 · 채권각론</span>
                        </div>
                        <div className="landing-cbt-icons" aria-hidden="true"><i>?</i><i>★</i></div>
                      </div>
                      <h2>
                        주택임대차보호법에 따른 임대차에서 그 기간이 끝난 후 임차인이 보증금을 반환받기 위해 목적물을 점유하고 있는 경우에도 여전히 보증금반환채권에 대한 소멸시효는 진행한다고 보아야 한다.
                      </h2>
                      <div className="landing-cbt-options" aria-label="답안 선택 미리보기">
                        <div><span>O</span></div>
                        <div className="is-selected">
                          <span>X</span>
                          <b>다음 문제로 <em>›</em></b>
                        </div>
                      </div>
                    </div>
                    <div className="landing-cbt-footer">
                      <span>‹ 이전 문제</span>
                      <span>다음 문제 ›</span>
                    </div>
                  </div>

                  <aside className="landing-cbt-omr">
                    <div><strong>OMR</strong><span>1/50</span></div>
                    <div className="landing-cbt-omr-table">
                      <p><b>번호</b><b>내 답</b></p>
                      {[1, 2, 3, 4, 5, 6].map((item) => (
                        <p key={item} className={item === 1 ? "is-current" : ""}>
                          <span>{item}</span><span>{item === 1 ? "X" : "-"}</span>
                        </p>
                      ))}
                    </div>
                    <button type="button" tabIndex={-1}>CSV 다운로드</button>
                  </aside>
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
                  <p className="landing-focus-label">FOCUS MODE</p>
                  <h2 className="landing-bento-title mt-4 text-3xl text-white sm:text-4xl">공부 흐름을<br />끊지 않는 풀이 화면</h2>
                  <p className="mt-5 leading-7 text-red-50/80">문제, 선택지, OMR, 타이머에만 집중하세요. 답안과 책갈피는 자동으로 저장됩니다.</p>
                </div>
                <div className="landing-focus-card" aria-hidden="true">
                  <div className="landing-focus-meta">
                    <span>8번 / 총 50문항</span>
                    <span>챕터 · 채권총론</span>
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
                <article className="landing-bento-card landing-feature-card landing-feature-card-compact">
                  <div>
                    <p className="landing-feature-eyebrow">RETRY WRONG</p>
                    <h3 className="mt-2 text-xl font-semibold tracking-tight">틀린 문제는 바로 한 번 더</h3>
                    <p className="mt-1 text-sm leading-6 text-stone-600 dark:text-stone-400">오답만 모아 확인하고 다시 풀면서 기억을 단단하게 만들어요.</p>
                  </div>
                  <span className="landing-feature-icon" aria-hidden="true">↻</span>
                </article>
                <article className="landing-bento-card landing-feature-card landing-feature-card-compact">
                  <div>
                    <p className="landing-feature-eyebrow">EXPORT &amp; BACKUP</p>
                    <h3 className="mt-2 text-xl font-semibold tracking-tight">학습 기록은 내 방식대로 보관</h3>
                    <p className="mt-1 text-sm leading-6 text-stone-600 dark:text-stone-400">풀이 결과는 CSV로, 전체 데이터는 JSON으로 간편하게 백업해요.</p>
                  </div>
                  <span className="landing-feature-icon is-download" aria-hidden="true">⇩</span>
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

      <LandingFooter />

      {isCsvGuideOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="csv-guide-title">
          <button onClick={() => setIsCsvGuideOpen(false)} className="app-modal-backdrop absolute inset-0" aria-label="CSV 가이드 바깥 영역 닫기" />
          <div className="landing-modal relative max-h-[88vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl sm:p-8 dark:border-stone-700 dark:bg-stone-900">
            <IconCloseButton onClick={() => setIsCsvGuideOpen(false)} label="CSV 가이드 닫기" className="absolute right-4 top-4" />
            <p className="landing-section-label">CSV STARTER GUIDE</p>
            <h2 id="csv-guide-title" className="mt-2 pr-10 text-2xl font-bold tracking-tight text-stone-950 dark:text-white">문제 파일은 이렇게 만들어요</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-400">첫 줄에 아래 헤더를 넣고, 둘째 줄부터 문제를 한 줄씩 작성해 주세요.</p>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {csvGuides.map((guide) => (
                <div key={guide.title} className="rounded-2xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-700 dark:bg-stone-800/70">
                  <p className="font-semibold text-red-600 dark:text-red-400">{guide.title}</p>
                  <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-400">{guide.description}</p>
                  <p className="mt-3 text-xs font-semibold text-stone-500 dark:text-stone-400">헤더</p>
                  <code className="mt-1 block overflow-x-auto whitespace-nowrap rounded-lg bg-white px-3 py-2.5 font-mono text-xs text-stone-700 dark:bg-stone-900 dark:text-stone-300">{guide.header}</code>
                  <p className="mt-3 text-xs font-semibold text-stone-500 dark:text-stone-400">작성 예시</p>
                  <code className="mt-1 block overflow-x-auto whitespace-nowrap rounded-lg bg-white px-3 py-2.5 font-mono text-xs text-stone-700 dark:bg-stone-900 dark:text-stone-300">{guide.example}</code>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <p className="font-semibold text-stone-900 dark:text-stone-100">바로 써볼 수 있는 샘플</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ["OX 문제", "/samples/OX_sample.csv"],
                  ["5지선다", "/samples/5지선다_sample.csv"],
                  ["박스형 5지선다", "/samples/5지선다_box_sample.csv"],
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
