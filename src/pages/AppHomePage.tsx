import { Link } from "react-router-dom";
import { AppFooter } from "../components/ui/AppFooter";
import { DashboardHeaderTitle } from "../components/ui/DashboardHeaderTitle";
import { PremiumBadge } from "../components/ui/PremiumBadge";
import { ReturnLinkLabel } from "../components/ui/ReturnLinkLabel";
import { useAccountPreviewStore } from "../store/useAccountPreviewStore";

type HomeMenuKind = "online" | "offline" | "settings" | "account";

const homeMenus: Array<{
  to: string;
  title: string;
  kind: HomeMenuKind;
  premium?: boolean;
}> = [
  { to: "/premium", title: "온라인 문제 풀이", kind: "online", premium: true },
  { to: "/dashboard", title: "오프라인 문제 풀이", kind: "offline" },
  { to: "/settings", title: "환경설정", kind: "settings" },
  { to: "/account", title: "계정 및 구독", kind: "account" },
];

function HomeMenuGraphic({ kind }: { kind: HomeMenuKind }) {
  if (kind === "online") {
    return (
      <div className="home-menu-graphic is-online" aria-hidden="true">
        <div className="home-online-panel">
          <span className="home-online-dot" />
          <span className="home-online-line is-long" />
          <span className="home-online-line" />
          <div className="home-online-answers">
            <i />
            <i className="is-active" />
            <i />
          </div>
        </div>
        <div className="home-online-status">
          <span />
          ONLINE
        </div>
      </div>
    );
  }

  if (kind === "offline") {
    return (
      <div className="home-menu-graphic is-offline" aria-hidden="true">
        <div className="home-file-sheet">
          <b>CSV</b>
          <span />
          <span />
          <span />
        </div>
        <div className="home-local-store">
          <i />
          <i />
          <i />
        </div>
      </div>
    );
  }

  if (kind === "settings") {
    return (
      <div className="home-menu-graphic is-settings" aria-hidden="true">
        <div className="home-settings-panel">
          <div><span /><i /></div>
          <div><span /><i /></div>
          <div><span /><i /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-menu-graphic is-account" aria-hidden="true">
      <div className="home-account-avatar">
        <span />
        <i />
      </div>
      <div className="home-membership-card">
        <b>LAW SOLVER</b>
        <span>PREMIUM</span>
        <i />
      </div>
    </div>
  );
}

export function AppHomePage() {
  const isSignedIn = useAccountPreviewStore((state) => state.isSignedIn);
  const displayName = useAccountPreviewStore((state) => state.displayName);

  return (
    <div className="app-page px-4 py-8 transition-colors duration-300 md:px-6">
      <div className="mx-auto max-w-6xl">
        <DashboardHeaderTitle logoTo="/" logoLabel="메인으로 이동">
          <Link
            to="/"
            className="app-button-secondary rounded-xl px-3 py-2 text-center text-sm font-semibold sm:px-4"
          >
            <ReturnLinkLabel>메인으로</ReturnLinkLabel>
          </Link>
        </DashboardHeaderTitle>

        <main className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {homeMenus.map((menu) => (
            <Link
              key={menu.to}
              to={menu.to}
              className={[
                "app-card home-menu-card group flex min-h-[310px] flex-col rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-[var(--app-shadow-hover)]",
                menu.kind === "online" ? "app-premium-card" : "",
              ].join(" ")}
            >
              <div className="flex min-h-7 min-w-0 justify-end">
                {menu.kind === "account" ? (
                  <span className="max-w-full truncate text-right text-[11px] font-semibold leading-5 text-stone-500 dark:text-stone-400">
                    {isSignedIn ? `어서오세요, ${displayName}님.` : "로그아웃 상태입니다"}
                  </span>
                ) : menu.premium ? (
                  <PremiumBadge />
                ) : null}
              </div>
              <HomeMenuGraphic kind={menu.kind} />
              <div className="mt-auto flex items-end justify-between gap-3 px-1 pb-1 pt-5">
                <h2 className="text-lg font-bold tracking-[-0.025em] text-stone-950 dark:text-stone-100">
                  {menu.title}
                </h2>
                <span className="shrink-0 text-lg font-semibold text-red-500 transition-transform group-hover:translate-x-0.5 dark:text-red-400" aria-hidden="true">
                  →
                </span>
              </div>
            </Link>
          ))}
        </main>

        <AppFooter />
      </div>
    </div>
  );
}
