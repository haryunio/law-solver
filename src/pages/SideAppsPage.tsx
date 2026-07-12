import { Link } from "react-router-dom";
import { LandingFooter } from "../components/ui/LandingFooter";
import { LandingHeader } from "../components/ui/LandingHeader";
import { miniApps } from "../mini-apps/catalog";
import type { MiniAppDefinition, MiniAppStatus } from "../mini-apps/types";

const statusLabels: Record<MiniAppStatus, string> = {
  "coming-soon": "COMING SOON",
  beta: "BETA",
  available: "OPEN",
};

function MiniAppCard({ app }: { app: MiniAppDefinition }) {
  const isComingSoon = app.status === "coming-soon";
  const content = (
    <div className={`flex items-start gap-4 sm:gap-5 ${isComingSoon ? "select-none opacity-65 blur-[0.7px]" : ""}`}>
      <div
        className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] text-xl font-black tracking-[-0.06em] shadow-sm sm:h-[72px] sm:w-[72px] sm:text-2xl ${app.iconClass}`}
        aria-hidden="true"
      >
        {app.icon}
      </div>
      <div className="min-w-0 pt-0.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <h3 className="text-lg font-bold tracking-tight sm:text-xl">{app.name}</h3>
          <span className="rounded-full border border-stone-200 bg-stone-100 px-2.5 py-1 text-[10px] font-bold tracking-[0.1em] text-stone-500 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-400">
            {statusLabels[app.status]}
          </span>
        </div>
        <p className="mt-2.5 text-sm leading-6 text-stone-600 dark:text-stone-400">{app.description}</p>
      </div>
    </div>
  );

  const cardClass = "app-card relative overflow-hidden rounded-3xl border p-5 sm:p-6";
  if (app.route && !isComingSoon) {
    return (
      <Link
        to={app.route}
        className={`${cardClass} transition duration-200 hover:-translate-y-0.5 hover:border-red-300 hover:shadow-[var(--app-shadow-hover)] dark:hover:border-red-800`}
      >
        {content}
      </Link>
    );
  }

  return <article className={cardClass}>{content}</article>;
}

export function SideAppsPage() {
  return (
    <div className="landing-page min-h-screen overflow-hidden text-stone-950 transition-colors duration-300 dark:text-stone-50">
      <LandingHeader activePage="mini-apps" />

      <main>
        <section className="relative overflow-hidden border-b border-stone-200/70 dark:border-stone-800/70">
          <div className="landing-glow landing-glow-one" />
          <div className="landing-glow landing-glow-two" />
          <div className="landing-grid-pattern" />
          <div className="landing-container relative py-16 sm:py-20 lg:py-24">
            <div className="landing-fade-up max-w-3xl">
              <div className="landing-eyebrow">
                <span className="landing-pulse-dot" />
                LAW SOLVER MINI APPS
              </div>
              <h1 className="landing-hero-title mt-7">
                공부에 필요한 도구를<br />
                <span className="landing-gradient-text">하나의 Law Solver에서</span>
              </h1>
              <p className="landing-hero-copy mt-7 max-w-2xl text-base leading-7 text-stone-600 sm:text-[17px] sm:leading-8 dark:text-stone-300">
                문제 풀이를 넘어 로스쿨 생활의 여러 순간을 더 편리하게 만들 미니 앱들을 준비하고 있어요.
              </p>
            </div>
          </div>
        </section>

        <section className="landing-container py-14 sm:py-20" aria-labelledby="upcoming-apps-title">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="landing-section-label">MINI APPS</p>
              <h2 id="upcoming-apps-title" className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">
                Law Solver 미니 앱
              </h2>
            </div>
            <span className="shrink-0 text-sm text-stone-400 dark:text-stone-500">{miniApps.length}개</span>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:gap-5">
            {miniApps.map((app) => (
              <MiniAppCard key={app.id} app={app} />
            ))}
          </div>
          <div className="mt-10 rounded-2xl border border-stone-200 bg-white/55 px-5 py-5 text-center sm:mt-12 sm:px-8 sm:py-6 dark:border-stone-800 dark:bg-stone-900/40">
            <p className="text-sm leading-6 text-stone-600 dark:text-stone-300">
              새로운 미니 앱과 업데이트는 이곳에서 가장 먼저 소개할게요.
            </p>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
