import { LoadingRegion, SkeletonBlock } from "../ui/AsyncLoading";
import { BookGrid } from "../ui/BookGrid";

const items = (count: number) => Array.from({ length: count }, (_, index) => index);

function BookCoverSkeleton() {
  return (
    <div className="app-card app-subject-book relative flex h-56 flex-col overflow-hidden rounded-l-md rounded-r-xl border px-3 pb-3 pl-6 pt-[68px]">
      <SkeletonBlock className="absolute inset-x-0 top-0 h-14 rounded-none" />
      <SkeletonBlock className="h-3 w-14 rounded-full" />
      <SkeletonBlock className="mt-3 h-4 w-full rounded-full" />
      <SkeletonBlock className="mt-2 h-4 w-3/4 rounded-full" />
      <SkeletonBlock className="mt-auto h-8 w-full rounded-lg" />
    </div>
  );
}

export function PremiumCourseCatalogSkeleton() {
  return (
    <LoadingRegion label="온라인 과목을 불러오는 중입니다">
      <BookGrid>
        {items(6).map((index) => <BookCoverSkeleton key={index} />)}
      </BookGrid>
    </LoadingRegion>
  );
}

export function PremiumProblemGridSkeleton() {
  return (
    <LoadingRegion label="문제 목록을 불러오는 중입니다" className="grid gap-3 md:grid-cols-2">
      {items(4).map((index) => (
        <article key={index} className="app-card app-problem-card overflow-hidden rounded-2xl border">
          <div className="px-4 pb-3 pt-3.5">
            <div className="flex items-center justify-between gap-3">
              <SkeletonBlock className="h-6 w-3/5 rounded-lg" />
              <SkeletonBlock className="h-5 w-20 rounded-full" />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {items(3).map((metric) => <SkeletonBlock key={metric} className="h-11 rounded-lg" />)}
            </div>
          </div>
          <SkeletonBlock className="h-12 rounded-none border-t" />
        </article>
      ))}
    </LoadingRegion>
  );
}

export function PremiumAttemptListSkeleton() {
  return (
    <LoadingRegion label="풀이 세션을 불러오는 중입니다" className="space-y-2.5">
      {items(3).map((index) => (
        <article key={index} className="app-card app-problem-card rounded-xl border px-3 py-4 sm:px-4">
          <div className="lg:flex lg:items-center lg:gap-4">
            <div className="grid min-h-16 min-w-0 flex-1 grid-cols-[64px_minmax(0,1fr)] items-center gap-x-3 gap-y-2 lg:grid-rows-[auto_auto] lg:gap-y-1">
              <SkeletonBlock className="h-16 w-16 rounded-lg lg:row-span-2" />
              <SkeletonBlock className="h-5 w-36 max-w-full rounded-lg lg:self-end" />
              <div className="col-span-2 flex flex-wrap gap-1 lg:col-span-1 lg:col-start-2 lg:self-start">
                <SkeletonBlock className="h-6 w-14 rounded-full" />
                <SkeletonBlock className="h-6 w-14 rounded-full" />
                <SkeletonBlock className="h-6 w-16 rounded-full" />
                <SkeletonBlock className="h-6 w-40 rounded-md" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 lg:mt-0 lg:shrink-0">
              <div className="grid min-w-0 flex-1 grid-cols-3 gap-1.5 lg:w-[270px]">
                {items(3).map((metric) => <SkeletonBlock key={metric} className="h-16 rounded-lg" />)}
              </div>
              <SkeletonBlock className="h-16 w-24 shrink-0 rounded-lg sm:w-28" />
            </div>
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
    <LoadingRegion label="과목 이용권을 확인하는 중입니다">
      <BookGrid>
        {items(6).map((index) => (
          <article key={index} className="flex min-w-0 flex-col gap-3">
            <BookCoverSkeleton />
            <div className="app-card rounded-xl border p-3">
              <SkeletonBlock className="h-3 w-8 rounded-full" />
              <SkeletonBlock className="mt-2 h-6 w-20 max-w-full rounded-lg" />
              <div className="mt-3 space-y-3 border-t border-stone-200 pt-3 dark:border-stone-700">
                <SkeletonBlock className="h-4 w-full rounded-full" />
                <SkeletonBlock className="h-4 w-full rounded-full" />
              </div>
              <SkeletonBlock className="mt-4 h-12 rounded-lg" />
            </div>
          </article>
        ))}
      </BookGrid>
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
