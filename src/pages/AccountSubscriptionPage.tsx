import type { CSSProperties, FormEvent } from "react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AppFooter } from "../components/ui/AppFooter";
import { DashboardHeaderTitle } from "../components/ui/DashboardHeaderTitle";
import { PremiumBadge } from "../components/ui/PremiumBadge";
import { ReturnLinkLabel } from "../components/ui/ReturnLinkLabel";
import { SubjectCardCover } from "../components/ui/SubjectCardCover";
import {
  premiumOrangeAccentColor,
  premiumOrangeCoverStyle,
} from "../lib/subjectCover";
import { useAccountPreviewStore } from "../store/useAccountPreviewStore";

type AccountTab = "account" | "premium" | "packages";
type AuthMode = "login" | "signup";

const accountTabs: Array<{ id: AccountTab; label: string }> = [
  { id: "account", label: "계정" },
  { id: "premium", label: "Law Solver Premium" },
  { id: "packages", label: "과목 이용권" },
];

const getAccountTab = (value: string | null): AccountTab =>
  value === "premium" || value === "packages" ? value : "account";

const packageCatalog = [
  {
    id: "bar-14-civil-law",
    title: "2025년도 제14회 변호사시험 민법 기출",
    price: "19,900원",
    period: "1개월",
    retry: "무제한",
  },
  {
    id: "legal-ethics-recent-5",
    title: "법조윤리시험 최근 5회 기출 + 해설",
    price: "14,900원",
    period: "1개월",
    retry: "무제한",
  },
  {
    id: "bar-14-criminal-law",
    title: "2025년도 제14회 변호사시험 형법 기출",
    price: "17,900원",
    period: "1개월",
    retry: "무제한",
  },
  {
    id: "bar-14-public-law",
    title: "2025년도 제14회 변호사시험 공법 기출",
    price: "17,900원",
    period: "1개월",
    retry: "무제한",
  },
] as const;

export function AccountSubscriptionPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = getAccountTab(searchParams.get("tab"));
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const isSignedIn = useAccountPreviewStore((state) => state.isSignedIn);
  const displayName = useAccountPreviewStore((state) => state.displayName);
  const isPremiumActive = useAccountPreviewStore((state) => state.isPremiumActive);
  const packageIds = useAccountPreviewStore((state) => state.packageIds);
  const signIn = useAccountPreviewStore((state) => state.signIn);
  const logout = useAccountPreviewStore((state) => state.logout);
  const togglePremium = useAccountPreviewStore((state) => state.togglePremium);
  const togglePackage = useAccountPreviewStore((state) => state.togglePackage);

  const selectTab = (tab: AccountTab) => {
    setSearchParams(tab === "account" ? {} : { tab });
  };

  const handleAuthSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const submittedName = formData.get("displayName");
    signIn(typeof submittedName === "string" ? submittedName : undefined);
  };

  const handlePackageAction = (packageId: string) => {
    if (!isSignedIn) {
      selectTab("account");
      return;
    }

    if (!isPremiumActive) {
      selectTab("premium");
      return;
    }

    togglePackage(packageId);
  };

  const handlePremiumAction = () => {
    if (!isSignedIn) {
      selectTab("account");
      return;
    }

    togglePremium();
  };

  return (
    <div className="app-page px-4 py-8 transition-colors duration-300 md:px-6">
      <div className="mx-auto max-w-6xl">
        <DashboardHeaderTitle
          title="계정 및 구독"
          logoTo="/home"
          logoLabel="홈으로 이동"
        >
          <Link
            to="/home"
            className="app-button-secondary rounded-xl px-3 py-2 text-center text-sm font-semibold sm:px-4"
          >
            <ReturnLinkLabel>홈으로</ReturnLinkLabel>
          </Link>
        </DashboardHeaderTitle>

        <div className="app-card mb-4 rounded-2xl border p-2">
          <div className="grid grid-cols-3 gap-2" role="tablist" aria-label="계정 및 구독 메뉴">
            {accountTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                id={`${tab.id}-tab`}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`${tab.id}-panel`}
                onClick={() => selectTab(tab.id)}
                className={[
                  "min-h-11 rounded-xl px-2 py-2.5 text-xs font-semibold leading-5 transition-colors sm:px-4 sm:text-sm",
                  activeTab === tab.id
                    ? "bg-red-600 text-white shadow-sm"
                    : "text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800",
                ].join(" ")}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "account" ? (
          <section
            id="account-panel"
            role="tabpanel"
            aria-labelledby="account-tab"
            className="app-card mx-auto max-w-2xl rounded-2xl border p-5 sm:p-6"
          >
            <p className="text-xs font-bold tracking-[0.14em] text-red-600 dark:text-red-400">ACCOUNT</p>
            {isSignedIn ? (
              <div className="mt-4">
                <div className="app-subtle-surface rounded-2xl border p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-red-100 text-sm font-black text-red-700 dark:bg-red-950/50 dark:text-red-300">
                      LS
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-stone-950 dark:text-stone-100">{displayName}</p>
                      <p className="truncate text-sm text-stone-500 dark:text-stone-400">preview@lawsolver.dev</p>
                    </div>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="rounded-xl bg-white px-3 py-3 dark:bg-stone-900">
                      <p className="text-stone-500">Premium</p>
                      <p className="mt-1 font-bold text-stone-900 dark:text-stone-100">
                        {isPremiumActive ? "이용 중" : "미구독"}
                      </p>
                    </div>
                    <div className="rounded-xl bg-white px-3 py-3 dark:bg-stone-900">
                      <p className="text-stone-500">과목 이용권</p>
                      <p className="mt-1 font-bold text-stone-900 dark:text-stone-100">{packageIds.length}개</p>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="app-button-secondary mt-4 w-full rounded-xl px-4 py-3 text-sm font-semibold"
                >
                  로그아웃 미리보기
                </button>
              </div>
            ) : (
              <div className="mt-4">
                <div
                  className="grid grid-cols-2 gap-2 rounded-xl bg-stone-100 p-1 dark:bg-stone-800"
                  role="tablist"
                  aria-label="계정 접근 방식"
                >
                  {[
                    ["login", "로그인"],
                    ["signup", "회원가입"],
                  ].map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      aria-selected={authMode === id}
                      onClick={() => setAuthMode(id as AuthMode)}
                      className={[
                        "rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
                        authMode === id
                          ? "bg-white text-red-700 shadow-sm dark:bg-stone-900 dark:text-red-400"
                          : "text-stone-500 dark:text-stone-400",
                      ].join(" ")}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <form onSubmit={handleAuthSubmit} className="mt-5 space-y-4">
                  {authMode === "signup" ? (
                    <label className="block">
                      <span className="text-sm font-semibold text-stone-700 dark:text-stone-300">이름</span>
                      <input
                        className="app-control mt-2 w-full rounded-xl px-4 py-3 text-sm"
                        name="displayName"
                        placeholder="이름"
                        autoComplete="name"
                      />
                    </label>
                  ) : null}
                  <label className="block">
                    <span className="text-sm font-semibold text-stone-700 dark:text-stone-300">이메일</span>
                    <input
                      className="app-control mt-2 w-full rounded-xl px-4 py-3 text-sm"
                      type="email"
                      placeholder="name@example.com"
                      autoComplete="email"
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-stone-700 dark:text-stone-300">비밀번호</span>
                    <input
                      className="app-control mt-2 w-full rounded-xl px-4 py-3 text-sm"
                      type="password"
                      placeholder="8자 이상 입력"
                      autoComplete={authMode === "login" ? "current-password" : "new-password"}
                      minLength={8}
                      required
                    />
                  </label>
                  <button type="submit" className="app-button-primary w-full rounded-xl px-4 py-3 text-sm font-semibold">
                    {authMode === "login" ? "로그인 화면 미리보기" : "회원가입 화면 미리보기"}
                  </button>
                </form>
              </div>
            )}
          </section>
        ) : null}

        {activeTab === "premium" ? (
          <section
            id="premium-panel"
            role="tabpanel"
            aria-labelledby="premium-tab"
            className="app-card app-premium-card mx-auto max-w-2xl rounded-2xl border p-5 sm:p-6"
          >
            <PremiumBadge label="Law Solver Premium" />
            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-[-0.03em] text-stone-950 dark:text-stone-100">
                  Law Solver Premium 회원권
                </h2>
                <p className="mt-3 flex items-baseline gap-1.5 text-stone-950 dark:text-stone-100">
                  <span className="text-sm font-semibold text-stone-500 dark:text-stone-400">월</span>
                  <strong className="text-xl font-bold tracking-[-0.02em]">9,900원</strong>
                </p>
                <p className="mt-2 text-sm font-semibold text-stone-500 dark:text-stone-400">
                  {isPremiumActive ? "현재 이용 중" : "현재 미구독"}
                </p>
                <ul className="mt-4 space-y-2 text-sm font-medium text-stone-700 dark:text-stone-300">
                  <li className="flex items-center gap-2">
                    <span className="text-red-600 dark:text-red-400" aria-hidden="true">✓</span>
                    온라인 문제 풀이 기능 사용
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-red-600 dark:text-red-400" aria-hidden="true">✓</span>
                    Premium 전용 과목 이용권 구매 가능
                  </li>
                </ul>
              </div>
              <button
                type="button"
                onClick={handlePremiumAction}
                className={[
                  "rounded-xl px-4 py-3 text-sm font-semibold",
                  isPremiumActive
                    ? "app-button-secondary"
                    : "app-button-primary app-button-primary-standalone",
                ].join(" ")}
              >
                {!isSignedIn
                  ? "로그인 후 구독"
                  : isPremiumActive
                    ? "Premium 구독 해제 미리보기"
                    : "Premium 구독 미리보기"}
              </button>
            </div>
          </section>
        ) : null}

        {activeTab === "packages" ? (
          <section id="packages-panel" role="tabpanel" aria-labelledby="packages-tab">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {packageCatalog.map((item) => {
                const isActive = packageIds.includes(item.id);
                const actionLabel = !isSignedIn
                  ? "로그인 후 구매"
                  : !isPremiumActive
                    ? "Premium 구독 필요"
                    : isActive
                      ? "이용 중"
                      : "이용권 구매";

                return (
                  <article
                    key={item.id}
                    className="app-card app-subject-card group flex flex-col overflow-hidden rounded-2xl border transition hover:-translate-y-0.5 hover:shadow-[var(--app-shadow-hover)]"
                    style={
                      {
                        "--subject-accent": premiumOrangeAccentColor,
                      } as CSSProperties
                    }
                  >
                    <SubjectCardCover
                      title={item.title}
                      coverStyle={premiumOrangeCoverStyle}
                      titleLines={2}
                    />
                    <div className="flex min-w-0 flex-1 flex-col p-5">
                      <dl className="app-subtle-surface divide-y divide-stone-200 overflow-hidden rounded-xl border px-4 text-sm dark:divide-stone-700">
                        {[
                          ["금액", item.price],
                          ["이용 기간", item.period],
                          ["다시 풀기", item.retry],
                        ].map(([label, value]) => (
                          <div key={label} className="flex items-center justify-between gap-4 py-3">
                            <dt className="text-stone-500 dark:text-stone-400">{label}</dt>
                            <dd className="font-bold text-stone-900 dark:text-stone-100">{value}</dd>
                          </div>
                        ))}
                      </dl>
                      <button
                        type="button"
                        onClick={() => handlePackageAction(item.id)}
                        className={[
                          "mt-5 inline-flex h-12 w-full items-center justify-center rounded-xl px-4 text-sm font-semibold",
                          isActive ? "app-button-secondary" : "app-button-primary",
                        ].join(" ")}
                      >
                        {actionLabel}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}

        <AppFooter />
      </div>
    </div>
  );
}
