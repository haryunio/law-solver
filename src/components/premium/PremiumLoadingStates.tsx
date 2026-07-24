import { LoadingRegion, SkeletonBlock } from "../ui/AsyncLoading";

const items = (count: number) => Array.from({ length: count }, (_, index) => index);

export function PremiumCourseCatalogSkeleton() {
  return (
    <LoadingRegion label="온라인 과목을 불러오는 중입니다" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items(3).map((index) => (
        <article key={index} className="app-card overflow-hidden rounded-2xl border">
          <SkeletonBlock className="h-[104px] rounded-none" />
          <div className="h-[104px] p-4">
            <div className="flex justify-between gap-3">
              <SkeletonBlock className="h-3 w-16 rounded-full" />
              <SkeletonBlock className="h-3 w-24 rounded-full" />
            </div>
            <SkeletonBlock className="mt-4 h-11 w-full rounded-xl" />
          </div>
        </article>
      ))}
    </LoadingRegion>
  );
}

export function PremiumProblemGridSkeleton() {
  return (
    <LoadingRegion label="문제 목록을 불러오는 중입니다" className="grid gap-4 md:grid-cols-2">
      {items(4).map((index) => (
        <article key={index} className="app-card app-problem-card overflow-hidden rounded-2xl border">
          <div className="p-5">
            <SkeletonBlock className="h-6 w-3/5 rounded-lg" />
            <div className="mt-3 flex gap-2">
              <SkeletonBlock className="h-5 w-16 rounded-full" />
              <SkeletonBlock className="h-5 w-14 rounded-full" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <SkeletonBlock className="h-[66px] rounded-xl" />
              <SkeletonBlock className="h-[66px] rounded-xl" />
            </div>
          </div>
          <SkeletonBlock className="h-11 rounded-none border-t" />
        </article>
      ))}
    </LoadingRegion>
  );
}

export function PremiumAttemptListSkeleton() {
  return (
    <LoadingRegion label="풀이 세션을 불러오는 중입니다" className="space-y-2.5">
      {items(3).map((index) => (
        <article key={index} className="app-card app-problem-card rounded-2xl border px-4 py-3 sm:px-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <SkeletonBlock className="h-9 w-14 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1">
                <div className="flex gap-2">
                  <SkeletonBlock className="h-4 w-20 rounded-full" />
                  <SkeletonBlock className="h-4 w-14 rounded-full" />
                  <SkeletonBlock className="h-4 w-16 rounded-full" />
                </div>
                <SkeletonBlock className="mt-2 h-3 w-36 rounded-full" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 lg:w-[360px]">
              {items(3).map((metric) => <SkeletonBlock key={metric} className="h-[50px] rounded-lg" />)}
            </div>
            <SkeletonBlock className="h-10 rounded-xl lg:w-[116px]" />
          </div>
        </article>
      ))}
    </LoadingRegion>
  );
}

export function AccountOverviewSkeleton() {
  return (
    <LoadingRegion label="계정 정보를 확인하는 중입니다" className="mt-4">
      <div className="app-subtle-surface rounded-2xl border p-5">
        <div className="flex items-center gap-3">
          <SkeletonBlock className="h-11 w-11 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1">
            <SkeletonBlock className="h-4 w-24 rounded-full" />
            <SkeletonBlock className="mt-2 h-3 w-44 max-w-full rounded-full" />
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <SkeletonBlock className="h-[62px] rounded-xl" />
          <SkeletonBlock className="h-[62px] rounded-xl" />
        </div>
      </div>
      <SkeletonBlock className="mt-4 h-12 w-full rounded-xl" />
    </LoadingRegion>
  );
}

export function PremiumMembershipSkeleton() {
  return (
    <LoadingRegion label="회원권 정보를 확인하는 중입니다">
      <SkeletonBlock className="h-6 w-36 rounded-full" />
      <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex-1">
          <SkeletonBlock className="h-7 w-64 max-w-full rounded-lg" />
          <SkeletonBlock className="mt-4 h-5 w-28 rounded-full" />
          <SkeletonBlock className="mt-4 h-32 w-full rounded-xl" />
          <SkeletonBlock className="mt-5 h-4 w-52 max-w-full rounded-full" />
          <SkeletonBlock className="mt-3 h-4 w-60 max-w-full rounded-full" />
        </div>
        <SkeletonBlock className="h-12 w-full rounded-xl sm:w-40" />
      </div>
    </LoadingRegion>
  );
}

export function PremiumPackageGridSkeleton() {
  return (
    <LoadingRegion label="과목 이용권을 확인하는 중입니다" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items(4).map((index) => (
        <article key={index} className="app-card overflow-hidden rounded-2xl border">
          <SkeletonBlock className="h-[104px] rounded-none" />
          <div className="p-5">
            <SkeletonBlock className="h-32 rounded-xl" />
            <SkeletonBlock className="mt-5 h-12 rounded-xl" />
          </div>
        </article>
      ))}
    </LoadingRegion>
  );
}

export function PremiumSolveSkeleton({
  label = "온라인 문제를 불러오는 중입니다",
}: {
  label?: string;
} = {}) {
  return (
    <LoadingRegion label={label} className="app-focus-page app-page min-h-screen">
      <header className="app-topbar border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2 md:px-6">
          <SkeletonBlock className="h-9 w-16 rounded-lg" />
          <SkeletonBlock className="h-4 w-52 max-w-[42vw] rounded-full" />
          <SkeletonBlock className="h-9 w-44 rounded-lg" />
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 py-3 md:grid-cols-[1fr_220px] md:px-6">
        <main className="app-card min-h-[560px] rounded-2xl border p-5 md:p-8">
          <div className="flex gap-2">
            <SkeletonBlock className="h-6 w-24 rounded-full" />
            <SkeletonBlock className="h-6 w-28 rounded-full" />
          </div>
          <SkeletonBlock className="mt-7 h-5 w-11/12 rounded-full" />
          <SkeletonBlock className="mt-3 h-5 w-4/5 rounded-full" />
          <SkeletonBlock className="mt-6 h-28 rounded-xl" />
          <div className="mt-6 space-y-3">
            {items(5).map((index) => <SkeletonBlock key={index} className="h-12 rounded-xl" />)}
          </div>
        </main>
        <aside className="app-card hidden h-[560px] rounded-2xl border p-4 md:block">
          <SkeletonBlock className="h-5 w-16 rounded-full" />
          <div className="mt-4 space-y-2">
            {items(9).map((index) => <SkeletonBlock key={index} className="h-8 rounded-lg" />)}
          </div>
        </aside>
      </div>
    </LoadingRegion>
  );
}

export function PremiumResultSkeleton({ review = false }: { review?: boolean }) {
  if (review) return <PremiumSolveSkeleton label="문제 확인 화면을 불러오는 중입니다" />;

  return (
    <LoadingRegion label="채점 결과를 불러오는 중입니다" className="app-page min-h-screen px-4 py-8 md:px-6">
      <div className="mx-auto max-w-6xl">
        <SkeletonBlock className="h-[76px] rounded-2xl border" />
        <div className="mt-5 grid gap-4 lg:grid-cols-4">
          <SkeletonBlock className="h-44 rounded-2xl border lg:col-span-2" />
          <SkeletonBlock className="h-44 rounded-2xl border" />
          <SkeletonBlock className="h-44 rounded-2xl border" />
        </div>
        <SkeletonBlock className="mt-4 h-72 rounded-2xl border" />
      </div>
    </LoadingRegion>
  );
}
