import { Component, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { BrandMark } from "../components/ui/BrandMark";
import { Button } from "../components/ui/Button";

export function RouteLoadingScreen() {
  return (
    <main className="app-page min-h-screen px-4 py-8">
      <div className="mx-auto max-w-6xl" role="status" aria-label="화면을 불러오는 중">
        <div className="app-card flex items-center gap-3 rounded-2xl border p-5">
          <BrandMark />
          <span className="app-spinner text-red-600" aria-hidden="true" />
          <span className="text-sm text-stone-600 dark:text-stone-300">화면을 불러오고 있습니다</span>
        </div>
        <div className="app-card mt-6 rounded-2xl border p-6" aria-hidden="true">
          <div className="app-skeleton h-6 w-1/3 rounded" />
          <div className="app-skeleton mt-6 h-64 rounded-xl" />
        </div>
      </div>
    </main>
  );
}

/** Reset by pathname so a failed screen or stale attempt cannot follow navigation. */
export class AppRouteBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="app-page flex min-h-screen items-center justify-center px-4">
        <section className="app-card max-w-lg rounded-2xl border p-6 text-center" role="alert">
          <div className="flex justify-center"><BrandMark /></div>
          <h1 className="mt-4 text-lg font-bold text-stone-900 dark:text-stone-100">화면을 열지 못했습니다</h1>
          <p className="mt-3 text-sm leading-6 text-stone-600 dark:text-stone-300">
            인터넷 연결을 확인한 뒤 새로고침해 주세요. 같은 문제가 계속되면 홈에서 다시 들어와 주세요.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button variant="primary" className="rounded-xl" onClick={() => window.location.reload()}>
              새로고침
            </Button>
            <Link to="/home" className="app-button-secondary rounded-xl px-4 py-2.5 text-sm font-semibold">홈으로</Link>
          </div>
        </section>
      </main>
    );
  }
}
