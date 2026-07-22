import type { CSSProperties, FormEvent } from "react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  AccountOverviewSkeleton,
  PremiumMembershipSkeleton,
  PremiumPackageGridSkeleton,
} from "../components/premium/PremiumLoadingStates";
import {
  PurchaseMethodModal,
  type PurchaseModalProduct,
} from "../components/premium/PurchaseMethodModal";
import { ButtonLoadingContent } from "../components/ui/AsyncLoading";
import { AppFooter } from "../components/ui/AppFooter";
import { DashboardHeaderTitle } from "../components/ui/DashboardHeaderTitle";
import { PremiumBadge } from "../components/ui/PremiumBadge";
import { ProfileAvatar } from "../components/ui/ProfileAvatar";
import { ReturnLinkLabel } from "../components/ui/ReturnLinkLabel";
import { SubjectCardCover } from "../components/ui/SubjectCardCover";
import { Toast, type ToastTone } from "../components/ui/Toast";
import {
  getPremiumSubjectCoverStyle,
  premiumOrangeAccentColor,
} from "../lib/subjectCover";
import type { MarketplaceProduct } from "../lib/premiumApi";
import { getPremiumMembershipPeriod } from "../lib/premiumEntitlements";
import { useAccountStore } from "../store/useAccountStore";

type AccountTab = "account" | "premium" | "packages" | "payments";
type AuthMode = "login" | "signup";

const accountTabs: Array<{ id: AccountTab; label: string }> = [
  { id: "account", label: "계정" },
  { id: "premium", label: "Law Solver Premium" },
  { id: "packages", label: "과목 이용권" },
  { id: "payments", label: "결제내역" },
];

const getAccountTab = (value: string | null): AccountTab =>
  value === "premium" || value === "packages" || value === "payments" ? value : "account";

const paymentMethodLabel = {
  promotion: "프로모션 코드",
  toss: "토스페이먼츠",
  bank_transfer: "무통장입금",
  local: "로컬 테스트 결제",
} as const;

const formatPurchaseDate = (value: string) =>
  new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const formatPrice = (value: number) => `${value.toLocaleString("ko-KR")}원`;
const formatEntitlementDate = (value: string) =>
  new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(new Date(value));

export function AccountSubscriptionPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = getAccountTab(searchParams.get("tab"));
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [isConfigurationToastVisible, setIsConfigurationToastVisible] = useState(true);
  const [purchaseModalProduct, setPurchaseModalProduct] = useState<PurchaseModalProduct | null>(null);
  const configured = useAccountStore((state) => state.configured);
  const initialized = useAccountStore((state) => state.initialized);
  const isLoading = useAccountStore((state) => state.isLoading);
  const isSignedIn = useAccountStore((state) => state.isSignedIn);
  const displayName = useAccountStore((state) => state.displayName);
  const email = useAccountStore((state) => state.email);
  const isPremiumActive = useAccountStore((state) => state.isPremiumActive);
  const packageIds = useAccountStore((state) => state.packageIds);
  const purchases = useAccountStore((state) => state.purchases);
  const entitlements = useAccountStore((state) => state.entitlements);
  const marketplaceProducts = useAccountStore((state) => state.marketplaceProducts);
  const notice = useAccountStore((state) => state.notice);
  const error = useAccountStore((state) => state.error);
  const purchasingCode = useAccountStore((state) => state.purchasingCode);
  const signIn = useAccountStore((state) => state.signIn);
  const signUp = useAccountStore((state) => state.signUp);
  const logout = useAccountStore((state) => state.logout);
  const redeemPromotion = useAccountStore((state) => state.redeemPromotion);
  const clearFeedback = useAccountStore((state) => state.clearFeedback);
  const premiumProduct = marketplaceProducts.find((product) => product.kind === "premium") ?? null;
  const packageCatalog = marketplaceProducts.filter((product) => product.kind === "course_pass");
  const premiumMembershipPeriod = getPremiumMembershipPeriod(entitlements);

  const selectTab = (tab: AccountTab) => {
    setSearchParams(tab === "account" ? {} : { tab });
  };

  const handleAuthSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const submittedName = formData.get("displayName");
    const submittedEmail = String(formData.get("email") ?? "");
    const submittedPassword = String(formData.get("password") ?? "");
    try {
      if (authMode === "signup") {
        await signUp(
          submittedEmail,
          submittedPassword,
          typeof submittedName === "string" ? submittedName : "",
        );
      } else {
        await signIn(submittedEmail, submittedPassword);
      }
    } catch {
      // The account store exposes a sanitized user-facing error.
    }
  };

  const handlePackageAction = (item: MarketplaceProduct) => {
    if (!initialized || isLoading) return;
    if (!isSignedIn) {
      selectTab("account");
      return;
    }

    if (!isPremiumActive) {
      selectTab("premium");
      return;
    }
    if (packageIds.includes(item.code)) return;
    setPurchaseModalProduct({
      productCode: item.code,
      title: item.name,
      price: formatPrice(item.priceKrw),
    });
  };

  const handlePremiumAction = () => {
    if (!initialized || isLoading) return;
    if (!isSignedIn) {
      selectTab("account");
      return;
    }
    if (!premiumProduct) return;
    setPurchaseModalProduct({
      productCode: premiumProduct.code,
      title: premiumProduct.name,
      price: formatPrice(premiumProduct.priceKrw),
    });
  };

  const configurationMessage = !configured && isConfigurationToastVisible
    ? "Premium 서버에 연결되지 않았습니다. 프론트 실행 환경변수를 확인해 주세요."
    : null;
  const toastMessage = error ?? notice ?? configurationMessage;
  const toastTone: ToastTone = error ? "error" : notice ? "success" : "warning";
  const dismissToast = () => {
    if (error || notice) {
      clearFeedback();
    } else {
      setIsConfigurationToastVisible(false);
    }
  };

  return (
    <div className="app-page px-4 py-8 transition-colors duration-300 md:px-6">
      <Toast
        message={toastMessage}
        tone={toastTone}
        onDismiss={dismissToast}
        durationMs={configurationMessage ? 0 : undefined}
      />
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
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="tablist" aria-label="계정 및 구독 메뉴">
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
            {!initialized ? (
              <AccountOverviewSkeleton />
            ) : isSignedIn ? (
              <div className="mt-4">
                <div className="app-subtle-surface rounded-2xl border p-5">
                  <div className="flex items-center gap-3">
                    <ProfileAvatar displayName={displayName} />
                    <div className="min-w-0">
                      <p className="font-bold text-stone-950 dark:text-stone-100">{displayName}</p>
                      <p className="truncate text-sm text-stone-500 dark:text-stone-400">{email}</p>
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
                  onClick={() => void logout()}
                  disabled={isLoading}
                  className="app-button-secondary mt-4 w-full rounded-xl px-4 py-3 text-sm font-semibold"
                >
                  {isLoading ? <ButtonLoadingContent label="로그아웃 중" /> : "로그아웃"}
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
                        name="email"
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
                      name="password"
                      placeholder="8자 이상 입력"
                      autoComplete={authMode === "login" ? "current-password" : "new-password"}
                      minLength={8}
                      required
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={!configured || !initialized || isLoading}
                    className="app-button-primary w-full rounded-xl px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoading
                      ? <ButtonLoadingContent label={authMode === "login" ? "로그인 중" : "가입 처리 중"} />
                      : authMode === "login" ? "로그인" : "회원가입"}
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
            {!initialized ? (
              <PremiumMembershipSkeleton />
            ) : (
              <>
                <PremiumBadge />
                <div className="mt-4">
                  <h2 className="text-2xl font-bold tracking-[-0.03em] text-stone-950 dark:text-stone-100">
                    {premiumProduct?.name ?? "Law Solver Premium 회원권"}
                  </h2>
                  <p className="mt-3 flex items-baseline gap-1.5 text-stone-950 dark:text-stone-100">
                    <span className="text-sm font-semibold text-stone-500 dark:text-stone-400">{premiumProduct?.durationDays ?? 30}일</span>
                    <strong className="text-xl font-bold tracking-[-0.02em]">{formatPrice(premiumProduct?.priceKrw ?? 9900)}</strong>
                  </p>
                </div>

                <div className="mt-6 border-t border-stone-200 pt-5 dark:border-stone-700">
                  <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                    <div className="min-w-0">
                      <dl
                        className={[
                          "grid gap-x-5 gap-y-4 text-sm",
                          isPremiumActive && premiumMembershipPeriod ? "sm:grid-cols-3" : "sm:grid-cols-1",
                        ].join(" ")}
                      >
                        <div
                          className={[
                            "flex items-center justify-between gap-4 py-3",
                            isPremiumActive && premiumMembershipPeriod ? "sm:block sm:py-0" : "",
                          ].join(" ")}
                        >
                          <dt className="text-stone-500 dark:text-stone-400">이용 상태</dt>
                          <dd
                            className={[
                              "font-bold text-stone-900 dark:text-stone-100",
                              isPremiumActive && premiumMembershipPeriod ? "sm:mt-2" : "",
                            ].join(" ")}
                          >
                            {isPremiumActive ? "현재 이용 중" : "이용 중이 아닙니다"}
                          </dd>
                        </div>
                        {isPremiumActive && premiumMembershipPeriod ? (
                          <>
                            <div className="flex items-center justify-between gap-4 border-t border-stone-100 py-3 sm:block sm:border-l sm:border-t-0 sm:py-0 sm:pl-5 dark:border-stone-800">
                              <dt className="text-stone-500 dark:text-stone-400">이용 시작 일자</dt>
                              <dd className="font-bold text-stone-900 sm:mt-2 dark:text-stone-100">
                                {formatEntitlementDate(premiumMembershipPeriod.startsAt)}
                              </dd>
                            </div>
                            <div className="flex items-center justify-between gap-4 border-t border-stone-100 py-3 sm:block sm:border-l sm:border-t-0 sm:py-0 sm:pl-5 dark:border-stone-800">
                              <dt className="text-stone-500 dark:text-stone-400">종료 예정 일자</dt>
                              <dd className="font-bold text-stone-900 sm:mt-2 dark:text-stone-100">
                                {formatEntitlementDate(premiumMembershipPeriod.endsAt)}
                              </dd>
                            </div>
                          </>
                        ) : null}
                      </dl>
                    </div>
                    <button
                      type="button"
                      onClick={handlePremiumAction}
                      disabled={!configured || isLoading || !premiumProduct || purchasingCode === premiumProduct?.code}
                      className="app-button-primary app-button-primary-standalone inline-flex min-h-12 shrink-0 items-center justify-center justify-self-start rounded-xl px-5 py-3 text-sm font-semibold sm:justify-self-end disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {!premiumProduct
                        ? "현재 구매 불가"
                        : !isSignedIn
                        ? "로그인 후 구매"
                        : purchasingCode === premiumProduct?.code
                          ? <ButtonLoadingContent label="결제 처리 중" />
                          : isPremiumActive
                            ? `Premium ${premiumProduct?.durationDays ?? 30}일 연장`
                            : `Premium ${premiumProduct?.durationDays ?? 30}일 구매`}
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        ) : null}

        {activeTab === "packages" ? (
          <section id="packages-panel" role="tabpanel" aria-labelledby="packages-tab">
            {!initialized ? (
              <PremiumPackageGridSkeleton />
            ) : (
              packageCatalog.length === 0 ? (
                <div className="app-card rounded-2xl border p-8 text-center text-sm text-stone-500 dark:text-stone-400">
                  현재 구매 가능한 과목 이용권이 없습니다.
                </div>
              ) : <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {packageCatalog.map((item) => {
                  const isActive = packageIds.includes(item.code);
                  const courseName = item.courseName ?? item.name;
                  const actionLabel = !isSignedIn
                  ? "로그인 후 구매"
                  : !isPremiumActive
                    ? "Premium 회원권 필요"
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
                      title={item.name}
                      coverStyle={getPremiumSubjectCoverStyle(courseName)}
                      titleLines={2}
                    />
                    <div className="flex min-w-0 flex-1 flex-col p-5">
                      <dl className="app-subtle-surface divide-y divide-stone-200 overflow-hidden rounded-xl border px-4 text-sm dark:divide-stone-700">
                        {[
                          ["금액", formatPrice(item.priceKrw)],
                          ["이용 기간", `${item.durationDays}일`],
                          ["다시 풀기", item.maxAttempts === null ? "무제한" : `문제별 ${item.maxAttempts}회`],
                        ].map(([label, value]) => (
                          <div key={label} className="flex items-center justify-between gap-4 py-3">
                            <dt className="text-stone-500 dark:text-stone-400">{label}</dt>
                            <dd className="font-bold text-stone-900 dark:text-stone-100">{value}</dd>
                          </div>
                        ))}
                      </dl>
                      <button
                        type="button"
                        onClick={() => handlePackageAction(item)}
                        disabled={!configured || !initialized || isLoading || isActive || purchasingCode === item.code}
                        className={[
                          "mt-5 inline-flex h-12 w-full items-center justify-center rounded-xl px-4 text-sm font-semibold",
                          isActive ? "app-button-secondary cursor-not-allowed" : "app-button-primary",
                        ].join(" ")}
                      >
                        {purchasingCode === item.code
                          ? <ButtonLoadingContent label="결제 처리 중" />
                          : actionLabel}
                      </button>
                    </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        ) : null}

        {activeTab === "payments" ? (
          <section
            id="payments-panel"
            role="tabpanel"
            aria-labelledby="payments-tab"
            className="app-card overflow-hidden rounded-2xl border"
          >
            <div className="border-b border-stone-200 px-5 py-4 dark:border-stone-800">
              <p className="text-xs font-bold tracking-[0.14em] text-red-600 dark:text-red-400">PAYMENTS</p>
              <h2 className="mt-1 text-xl font-bold text-stone-950 dark:text-stone-100">결제내역</h2>
            </div>
            {!initialized ? (
              <div className="p-5"><AccountOverviewSkeleton /></div>
            ) : !isSignedIn ? (
              <div className="p-8 text-center">
                <p className="text-sm text-stone-600 dark:text-stone-300">로그인하면 구매한 이용권 내역을 확인할 수 있습니다.</p>
                <button
                  type="button"
                  onClick={() => selectTab("account")}
                  className="app-button-primary mt-4 rounded-xl px-4 py-2.5 text-sm font-semibold"
                >
                  로그인하러 가기
                </button>
              </div>
            ) : purchases.length === 0 ? (
              <div className="p-8 text-center text-sm text-stone-500 dark:text-stone-400">아직 결제내역이 없습니다.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-stone-50 text-xs font-semibold text-stone-500 dark:bg-stone-950/50 dark:text-stone-400">
                    <tr>
                      <th className="px-5 py-3">결제번호</th>
                      <th className="px-5 py-3">구매한 상품</th>
                      <th className="px-5 py-3">결제수단</th>
                      <th className="px-5 py-3 text-right">금액</th>
                      <th className="px-5 py-3">구매일시</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                    {purchases.map((purchase) => (
                      <tr key={purchase.purchaseNumber} className="text-stone-700 dark:text-stone-300">
                        <td className="whitespace-nowrap px-5 py-4 font-mono text-xs font-bold text-stone-500 dark:text-stone-400">{purchase.purchaseNumber}</td>
                        <td className="px-5 py-4 font-semibold text-stone-900 dark:text-stone-100">{purchase.productName}</td>
                        <td className="whitespace-nowrap px-5 py-4">{paymentMethodLabel[purchase.paymentMethod]}</td>
                        <td className="whitespace-nowrap px-5 py-4 text-right font-bold">{purchase.amount.toLocaleString("ko-KR")}원</td>
                        <td className="whitespace-nowrap px-5 py-4 text-stone-500 dark:text-stone-400">{formatPurchaseDate(purchase.purchasedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ) : null}

        <AppFooter />
      </div>
      {purchaseModalProduct ? (
        <PurchaseMethodModal
          product={purchaseModalProduct}
          isProcessing={purchasingCode === purchaseModalProduct.productCode}
          onClose={() => {
            if (!purchasingCode) setPurchaseModalProduct(null);
          }}
          onRedeemPromotion={(promotionCode) =>
            redeemPromotion(purchaseModalProduct.productCode, promotionCode)}
        />
      ) : null}
    </div>
  );
}
