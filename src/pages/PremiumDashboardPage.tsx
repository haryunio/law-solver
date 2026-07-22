import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PremiumCourseCatalogSkeleton } from "../components/premium/PremiumLoadingStates";
import { AppFooter } from "../components/ui/AppFooter";
import { DashboardHeaderTitle } from "../components/ui/DashboardHeaderTitle";
import { PremiumBadge } from "../components/ui/PremiumBadge";
import { ReturnLinkLabel } from "../components/ui/ReturnLinkLabel";
import { SubjectCardCover } from "../components/ui/SubjectCardCover";
import { Toast } from "../components/ui/Toast";
import {
  getPremiumErrorMessage,
  listPremiumCourses,
  type PremiumCourse,
} from "../lib/premiumApi";
import {
  premiumOrangeAccentColor,
  premiumOrangeCoverStyle,
} from "../lib/subjectCover";
import { useAccountStore } from "../store/useAccountStore";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(new Date(value));

export function PremiumDashboardPage() {
  const initialized = useAccountStore((state) => state.initialized);
  const isSignedIn = useAccountStore((state) => state.isSignedIn);
  const isPremiumActive = useAccountStore((state) => state.isPremiumActive);
  const [courses, setCourses] = useState<PremiumCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedCourses, setHasLoadedCourses] = useState(false);
  const [didLoadFail, setDidLoadFail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialized || !isSignedIn || !isPremiumActive) {
      setCourses([]);
      setDidLoadFail(false);
      setIsLoading(false);
      setHasLoadedCourses(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setHasLoadedCourses(false);
    setDidLoadFail(false);
    setError(null);
    void listPremiumCourses()
      .then((data) => {
        if (!cancelled) setCourses(data);
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setDidLoadFail(true);
          setError(getPremiumErrorMessage(
            cause,
            "온라인 과목을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
          ));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
          setHasLoadedCourses(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [initialized, isSignedIn, isPremiumActive]);

  return (
    <div className="app-page px-4 py-8 transition-colors duration-300 md:px-6">
      <Toast message={error} onDismiss={() => setError(null)} />
      <div className="mx-auto max-w-6xl">
        <DashboardHeaderTitle
          title="온라인 문제 풀이"
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

        {!initialized || (isSignedIn && isPremiumActive && (!hasLoadedCourses || isLoading)) ? (
          <PremiumCourseCatalogSkeleton />
        ) : !isSignedIn ? (
          <div className="app-card rounded-2xl border p-6 text-center">
            <PremiumBadge />
            <h2 className="mt-4 text-xl font-bold text-stone-950 dark:text-stone-100">로그인이 필요합니다</h2>
            <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">계정 페이지에서 로그인한 뒤 온라인 과목을 이용할 수 있습니다.</p>
            <Link to="/account" className="app-button-primary app-button-primary-standalone mt-5 inline-flex rounded-xl px-5 py-3 text-sm font-semibold">
              로그인하러 가기
            </Link>
          </div>
        ) : !isPremiumActive ? (
          <div className="app-card rounded-2xl border p-6 text-center">
            <PremiumBadge />
            <h2 className="mt-4 text-xl font-bold text-stone-950 dark:text-stone-100">Premium 회원권이 필요합니다</h2>
            <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">로컬 결제로 30일 회원권을 발급한 뒤 과목 이용권을 구매해 주세요.</p>
            <Link to="/account?tab=premium" className="app-button-primary app-button-primary-standalone mt-5 inline-flex rounded-xl px-5 py-3 text-sm font-semibold">
              Premium 회원권 구매
            </Link>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Link
                to="/account?tab=packages"
                className="app-card app-subject-card group overflow-hidden rounded-2xl border transition hover:-translate-y-0.5 hover:shadow-[var(--app-shadow-hover)]"
                style={{ "--subject-accent": premiumOrangeAccentColor } as CSSProperties}
              >
                <SubjectCardCover title="과목 이용권 관리" coverStyle={premiumOrangeCoverStyle} titleLines={2} />
                <div className="flex h-[104px] items-center justify-between gap-3 p-4">
                  <span className="text-sm font-semibold text-stone-700 dark:text-stone-300">새 과목 이용권 구매</span>
                  <span className="text-xl font-semibold text-red-500 dark:text-red-400" aria-hidden="true">→</span>
                </div>
              </Link>

              {courses.map((course) => (
                <Link
                  key={course.id}
                  to={`/premium/courses/${course.id}`}
                  state={{ courseTitle: course.name }}
                  className="app-card app-subject-card group overflow-hidden rounded-2xl border transition hover:-translate-y-0.5 hover:shadow-[var(--app-shadow-hover)]"
                  style={{ "--subject-accent": premiumOrangeAccentColor } as CSSProperties}
                >
                  <SubjectCardCover
                    title={course.name}
                    coverStyle={premiumOrangeCoverStyle}
                    topRight={<PremiumBadge />}
                    titleLines={2}
                  />
                  <div className="h-[104px] p-4">
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400">이용 중</span>
                      <span className="text-stone-500">{formatDate(course.entitlement_valid_until)}까지</span>
                    </div>
                    <span className="app-button-primary mt-3 inline-flex h-11 w-full items-center justify-center rounded-xl px-4 text-sm font-semibold">
                      문제 목록
                    </span>
                  </div>
                </Link>
              ))}
            </div>
            {courses.length === 0 ? (
              <div className="app-card mt-4 rounded-2xl border p-6 text-center text-sm text-stone-600 dark:text-stone-300">
                {didLoadFail
                  ? "온라인 과목을 표시하지 못했습니다. 잠시 후 페이지를 새로고침해 주세요."
                  : "활성 과목 이용권이 없습니다. 과목 이용권 관리에서 법조윤리 패키지를 구매해 주세요."}
              </div>
            ) : null}
          </>
        )}

        <AppFooter />
      </div>
    </div>
  );
}
