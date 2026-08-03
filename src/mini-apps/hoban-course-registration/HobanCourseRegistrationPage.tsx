import { Link } from "react-router-dom";
import { AsyncTransitionOverlay } from "../../components/ui/AsyncLoading";
import { PremiumBadge } from "../../components/ui/PremiumBadge";
import { ReturnLinkLabel } from "../../components/ui/ReturnLinkLabel";
import { useAccountStore } from "../../store/useAccountStore";

const ORIGINAL_PAGE_PATH = "/mini-apps/hoban-course-registration/index.html";

function CourseRegistrationFrame({ preview = false }: { preview?: boolean }) {
  return (
    <iframe
      title="호반대학교 수강신청 연습"
      src={ORIGINAL_PAGE_PATH}
      aria-hidden={preview || undefined}
      tabIndex={preview ? -1 : undefined}
      style={{
        position: "fixed",
        inset: 0,
        display: "block",
        width: "100vw",
        height: "100vh",
        border: 0,
        background: "#fff",
        pointerEvents: preview ? "none" : undefined,
      }}
    />
  );
}

export function HobanCourseRegistrationPage() {
  const initialized = useAccountStore((state) => state.initialized);
  const isSignedIn = useAccountStore((state) => state.isSignedIn);
  const isPremiumActive = useAccountStore((state) => state.isPremiumActive);

  if (!initialized) {
    return (
      <div className="app-page fixed inset-0">
        <AsyncTransitionOverlay label="Premium 이용 권한을 확인하는 중입니다" />
      </div>
    );
  }

  if (!isSignedIn || !isPremiumActive) {
    const requiresLogin = !isSignedIn;
    return (
      <div className="fixed inset-0 overflow-hidden bg-white">
        <CourseRegistrationFrame preview />
        <div className="fixed inset-0 z-[60]">
          <div
            className="app-modal-backdrop absolute inset-0"
            aria-hidden="true"
            data-testid="hoban-premium-gate-backdrop"
          />
          <div className="absolute left-1/2 top-1/2 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2">
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="hoban-premium-gate-title"
              className="app-modal-surface rounded-2xl border p-6 text-center shadow-2xl"
            >
              <PremiumBadge />
              <h1 id="hoban-premium-gate-title" className="mt-4 text-xl font-bold text-stone-950 dark:text-stone-100">
                {requiresLogin ? "로그인이 필요합니다" : "Premium 회원 전용 미니 앱입니다"}
              </h1>
              <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-300">
                {requiresLogin
                  ? "계정 페이지에서 로그인한 뒤 수강신청 연습 서비스를 이용해 주세요."
                  : "활성 Premium 회원권을 확인한 뒤 수강신청 연습 서비스를 이용할 수 있습니다."}
              </p>
              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                <Link
                  to="/apps"
                  className="app-button-secondary flex min-h-11 items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold"
                >
                  <ReturnLinkLabel>미니 앱 목록으로</ReturnLinkLabel>
                </Link>
                <Link
                  to={requiresLogin ? "/account" : "/account?tab=premium"}
                  className="app-button-primary app-button-primary-standalone flex min-h-11 items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold"
                >
                  {requiresLogin ? "로그인하러 가기" : "Premium 확인하기"}
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  return <CourseRegistrationFrame />;
}
