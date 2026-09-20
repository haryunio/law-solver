import { useId, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { CourseProductCard } from "../components/premium/CourseProductCard";
import { ProblemSetCardMetadata } from "../components/session/ProblemSetCardMetadata";
import { SessionListItem } from "../components/session/SessionListItem";
import { ActionMenu } from "../components/ui/ActionMenu";
import { AppFooter } from "../components/ui/AppFooter";
import { LoadingRegion, SkeletonBlock } from "../components/ui/AsyncLoading";
import { BookCover, bookLinkClassName } from "../components/ui/BookCover";
import { BookGrid } from "../components/ui/BookGrid";
import { BrandMark } from "../components/ui/BrandMark";
import { Button } from "../components/ui/Button";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { DashboardHeaderTitle } from "../components/ui/DashboardHeaderTitle";
import { Dialog } from "../components/ui/Dialog";
import { IconCloseButton } from "../components/ui/IconCloseButton";
import { PremiumBadge } from "../components/ui/PremiumBadge";
import { ProfileAvatar } from "../components/ui/ProfileAvatar";
import { ReturnLinkLabel } from "../components/ui/ReturnLinkLabel";
import { ThemeSelect } from "../components/ui/ThemeSelect";
import { TimestampTag } from "../components/ui/TimestampTag";
import { Toast, type ToastTone } from "../components/ui/Toast";
import {
  getSubjectAccentColor,
  getSubjectCoverStyle,
  premiumOrangeAccentColor,
  premiumOrangeCoverStyle,
  subjectCoverPalettes,
} from "../lib/subjectCover";
import type { TestType } from "../types/test";
import type { MarketplaceProduct } from "../lib/premiumApi";

const sections = [
  ["navigation", "상단 내비게이션"], ["tokens", "색상과 표면"], ["type", "글자와 곡률"], ["controls", "버튼과 입력"],
  ["tags", "태그와 프로필"], ["books", "책 표지"], ["problems", "문제 카드"],
  ["sessions", "세션 목록"], ["feedback", "모달과 알림"], ["loading", "로딩"], ["motion", "모션"],
] as const;

const colors = [
  ["페이지 배경", "--app-bg"], ["기본 표면", "--app-surface-solid"],
  ["문제 표면", "--app-surface-problem"], ["정보 박스", "--app-surface-neutral"],
  ["기본 테두리", "--app-border"], ["본문", "--app-text"],
  ["보조 글자", "--app-muted"], ["브랜드 레드", "--app-red"],
] as const;

const sampleDate = "2026-09-20T01:30:00+09:00";
const sampleLastPlay = "2026-09-20T14:25:00+09:00";
const sampleProducts: MarketplaceProduct[] = [
  {
    id: "design-demo-course-pass-1", code: "DESIGN_DEMO_CIVIL", name: "민법 기본 문제",
    description: "디자인 시스템에서 사용하는 가상 상품", kind: "course_pass",
    courseId: "design-demo-course-1", courseCode: "DESIGN_CIVIL", courseName: "민법",
    priceKrw: 12000, currency: "KRW", durationDays: 90, maxAttempts: null, requiresPremium: true,
  },
  {
    id: "design-demo-course-pass-2", code: "DESIGN_DEMO_ETHICS", name: "법조윤리 실전 연습",
    description: "디자인 시스템에서 사용하는 가상 상품", kind: "course_pass",
    courseId: "design-demo-course-2", courseCode: "DESIGN_ETHICS", courseName: "법조윤리",
    priceKrw: 8000, currency: "KRW", durationDays: 30, maxAttempts: 5, requiresPremium: true,
  },
];
const questionTypes = [
  { value: "OX", label: "OX" }, { value: "5-choice", label: "5지선다" }, { value: "short", label: "단답형" },
];
const motionOptions = [
  { value: "home", label: "홈: 360ms / 12px" },
  { value: "subjects", label: "과목: 320ms / 10px" },
  { value: "problems", label: "문제: 280ms / 8px" },
  { value: "sessions", label: "세션: 240ms / 6px" },
  { value: "results", label: "결과: 280ms / 8px" },
];

function DemoSection({ id, title, description, children }: {
  id: string; title: string; description: string; children: ReactNode;
}) {
  return (
    <section id={`ds-${id}`} aria-labelledby={`ds-${id}-title`} className="scroll-mt-6 space-y-4">
      <div className="border-b border-stone-200 pb-3 dark:border-stone-700">
        <h2 id={`ds-${id}-title`} className="text-xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">{title}</h2>
        <p className="mt-1.5 max-w-3xl text-sm leading-6 text-stone-500 dark:text-stone-400">{description}</p>
      </div>
      {children}
    </section>
  );
}

function ProblemCardPreview({ title, type, premium, onEdit }: {
  title: string; type: TestType; premium: boolean; onEdit: () => void;
}) {
  return (
    <article className="app-card app-problem-card app-radius-card flex min-w-0 flex-col rounded-2xl border">
      <div className="px-4 pb-3 pt-3.5">
        <div className="mb-4 flex min-w-0 items-center justify-between gap-3">
          <h3 title={title} className="min-w-0 truncate text-base font-semibold">{title}</h3>
          {premium ? <PremiumBadge /> : (
            <ActionMenu label="예시 문제 관리 메뉴" items={[{ id: "edit", label: "편집", onSelect: onEdit }]} />
          )}
        </div>
        <ProblemSetCardMetadata type={type} questionCount={15} sessionCount={premium ? 1 : 3} inProgressCount={premium ? 1 : 2} />
      </div>
      <a
        href="#ds-sessions"
        aria-label={premium ? "온라인 예시 풀이 세션 보기" : "오프라인 예시 풀이 세션 보기"}
        className="app-result-link mt-auto flex min-h-12 flex-wrap items-center justify-between gap-2 border-t px-4 py-2.5"
      >
        {!premium ? <TimestampTag label="등록" value={sampleDate} /> : null}
        <span className="ml-auto whitespace-nowrap text-sm font-semibold">
          풀이 세션 보기 <span aria-hidden="true">→</span>
        </span>
      </a>
    </article>
  );
}

/** Isolated component examples. No account or offline study data is read or changed. */
export function DesignSystemPage() {
  const [headerTitle, setHeaderTitle] = useState("민법 채권총론 중간고사 대비 사례형 연습 문제");
  const [problemTitle, setProblemTitle] = useState("민법 기초 확인 문제");
  const [questionType, setQuestionType] = useState<TestType>("5-choice");
  const [memo, setMemo] = useState("");
  const [showFieldError, setShowFieldError] = useState(false);
  const [showPending, setShowPending] = useState(false);
  const [sessionTitle, setSessionTitle] = useState("중간고사 대비 첫 연습");
  const [draftTitle, setDraftTitle] = useState(sessionTitle);
  const [sessionVisible, setSessionVisible] = useState(true);
  const [dialog, setDialog] = useState<"edit" | "confirm" | null>(null);
  const [toast, setToast] = useState<{ tone: ToastTone; message: string; sequence: number } | null>(null);
  const [motion, setMotion] = useState("subjects");
  const [motionSequence, setMotionSequence] = useState(0);
  const titleId = useId();
  const formTitleId = useId();
  const typeId = useId();
  const errorId = useId();
  const draftId = useId();
  const notify = (message: string, tone: ToastTone = "success") => {
    setToast((previous) => ({ tone, message, sequence: (previous?.sequence ?? 0) + 1 }));
  };
  const openEditor = () => { setDraftTitle(sessionTitle); setDialog("edit"); };

  return (
    <div className="app-page px-4 py-8 md:px-6">
      <div className="mx-auto max-w-6xl">
        <DashboardHeaderTitle title="디자인 시스템" sectionTitle="미리보기" logoTo="/home" logoLabel="홈으로 이동">
          <Link to="/home" className="app-button-secondary app-radius-control rounded-xl px-3 py-2 text-center text-sm font-semibold sm:px-4"><ReturnLinkLabel>홈으로</ReturnLinkLabel></Link>
        </DashboardHeaderTitle>

        <div className="mb-7 space-y-4">
          <p className="max-w-3xl text-sm leading-6 text-stone-600 dark:text-stone-400">
            서비스에서 사용하는 공통 요소를 한곳에서 확인합니다. 모든 이름과 학습 기록은 예시이며, 여기서 바꾼 내용은 실제 데이터에 저장되지 않습니다. 색상은 현재 앱 테마를 따릅니다.
          </p>
          <nav aria-label="디자인 시스템 구성 요소" className="flex flex-wrap gap-2">
            {sections.map(([id, label]) => <a key={id} href={`#ds-${id}`} className="app-button-secondary app-radius-tag rounded-lg px-3 py-2 text-xs font-medium">{label}</a>)}
          </nav>
        </div>

        <main className="space-y-12">
          <DemoSection id="navigation" title="상단 내비게이션" description="768px 이상에서는 제목과 버튼을 한 줄에 표시합니다. 긴 제목은 말줄임표로 줄이고, 그보다 좁아지면 제목 크기를 줄이면서 버튼을 아래로 옮깁니다.">
            <label className="block space-y-2 text-sm font-medium">
              <span>미리보기 제목</span>
              <input className="app-control w-full rounded-xl px-3 py-2.5" value={headerTitle} onChange={(event) => setHeaderTitle(event.target.value)} />
            </label>
            <DashboardHeaderTitle title={headerTitle} sectionTitle="문제 목록" logoTo="#ds-navigation" logoLabel="내비게이션 예시로 이동">
              <Button variant="primary" onClick={() => notify("새 문제 등록 버튼을 눌렀습니다.")}>새 문제 등록</Button>
              <Button onClick={() => notify("과목 목록 버튼을 눌렀습니다.", "info")}>과목 목록</Button>
            </DashboardHeaderTitle>
          </DemoSection>

          <DemoSection id="tokens" title="색상과 표면" description="페이지 배경, 콘텐츠 표면, 정보 박스를 구분합니다. 아래 색상은 실제 CSS 토큰을 사용합니다.">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {colors.map(([label, token]) => (
                <div key={token} className="app-card app-radius-card overflow-hidden rounded-2xl border">
                  <div className="h-16 border-b border-stone-200 dark:border-stone-700" style={{ background: `var(${token})` }} aria-hidden="true" />
                  <div className="p-3"><p className="text-sm font-medium">{label}</p><code className="mt-1 block break-all text-[11px] text-stone-500 dark:text-stone-400">{token}</code></div>
                </div>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="app-card app-radius-card rounded-2xl border p-4"><h3 className="text-sm font-semibold">기본 카드</h3><p className="mt-2 text-xs leading-5 text-stone-500">페이지의 주요 콘텐츠를 담습니다.</p></div>
              <div className="app-subtle-surface app-radius-inset rounded-xl border p-4"><h3 className="text-sm font-semibold">보조 표면</h3><p className="mt-2 text-xs leading-5 text-stone-500">설명과 부가 정보를 구분합니다.</p></div>
              <div className="app-neutral-box app-radius-inset rounded-xl border p-4"><h3 className="text-sm font-semibold">정보 박스</h3><p className="mt-2 text-xs leading-5 text-stone-500">문항 수, 시간, 점수에 사용합니다.</p></div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              {[
                ["정답", "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"],
                ["오답과 선택", "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300"],
                ["정답 안내", "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300"],
                ["책갈피", "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300"],
              ].map(([label, classes]) => (
                <span key={label} className={`app-radius-tag rounded-lg border px-3 py-2 ${classes}`}>{label}</span>
              ))}
            </div>
          </DemoSection>

          <DemoSection id="type" title="글자와 곡률" description="제목은 짧고 또렷하게, 본문은 편하게 읽히도록 구성합니다. 모서리 크기는 요소의 역할에 따라 정합니다.">
            <div className="app-card app-radius-card space-y-4 rounded-2xl border p-4 sm:p-5">
              <div><p className="text-xs text-stone-500">화면 제목</p><p className="mt-1 text-xl font-semibold tracking-tight">오늘의 공부를 이어가세요</p></div>
              <div><p className="text-xs text-stone-500">카드 제목</p><p className="mt-1 text-base font-semibold">민법 사례 연습</p></div>
              <div><p className="text-xs text-stone-500">본문</p><p className="mt-1 max-w-2xl break-keep text-sm leading-6 text-stone-700 dark:text-stone-300">등록한 문제에서 새로운 풀이를 시작할 수 있습니다. 이전 답안과 오답 노트는 세션마다 따로 보관됩니다.</p></div>
              <div><p className="text-xs text-stone-500">보조 설명과 숫자</p><p className="mt-1 text-xs leading-5 text-stone-500">마지막 풀이 <span className="tabular-nums">2026.09.20 14:25</span></p></div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "카드", value: "16px", token: "--app-radius-card", className: "app-radius-card rounded-2xl" },
                { label: "버튼과 입력", value: "12px", token: "--app-radius-control", className: "app-radius-control rounded-xl" },
                { label: "내부 박스", value: "12px", token: "--app-radius-inset", className: "app-radius-inset rounded-xl" },
                { label: "태그", value: "8px", token: "--app-radius-tag", className: "app-radius-tag rounded-lg" },
              ].map((radius) => (
                <div key={radius.token} className="app-neutral-box app-radius-card rounded-2xl border p-3">
                  <div aria-hidden="true" className={`${radius.className} mb-3 h-14 w-14 border-2 border-red-400 bg-red-50 dark:bg-red-950/30`} />
                  <p className="text-sm font-medium">{radius.label} <span className="tabular-nums text-stone-500">{radius.value}</span></p>
                  <code className="mt-1 block break-all text-[10px] text-stone-500">{radius.token}</code>
                </div>
              ))}
            </div>
            <p className="text-xs leading-5 text-stone-500">아바타와 원형 아이콘은 원을 유지합니다. 책 표지의 책등과 브랜드 마크는 전용 형태를 사용합니다.</p>
          </DemoSection>

          <DemoSection id="controls" title="버튼과 입력" description="버튼 위에 포인터를 올리거나 Tab으로 이동해 상태를 확인하세요. 드롭다운은 방향키, Home, End, Enter와 Escape로도 조작할 수 있습니다.">
            <div className="app-card app-radius-card space-y-5 rounded-2xl border p-4 sm:p-5">
              <div className="flex flex-wrap gap-2">
                <Button variant="primary" onClick={() => notify("기본 버튼을 눌렀습니다.")}>대표 행동</Button>
                <Button onClick={() => notify("보조 버튼을 눌렀습니다.", "info")}>보조 행동</Button>
                <Button variant="success" onClick={() => notify("완료 상태를 확인했습니다.")}>완료</Button>
                <Button variant="danger" onClick={() => setDialog("confirm")}>삭제</Button>
                <Button size="sm" onClick={() => notify("작은 버튼을 눌렀습니다.", "info")}>작은 버튼</Button>
                <Button disabled>사용할 수 없음</Button>
              </div>
              <div className="flex flex-wrap items-center gap-3 border-t border-stone-200 pt-4 dark:border-stone-700">
                <Button variant="primary" pending={showPending} pendingLabel="저장 중" onClick={() => setShowPending(true)}>예시 저장</Button>
                <label className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400"><input type="checkbox" checked={showPending} onChange={(event) => setShowPending(event.target.checked)} className="h-4 w-4 accent-red-600" />처리 중 상태</label>
              </div>
            </div>
            <form className="app-card app-radius-card space-y-4 rounded-2xl border p-4 sm:p-5" onSubmit={(event) => { event.preventDefault(); notify(`예시 제목을 “${problemTitle.trim() || "제목 없음"}”으로 확인했습니다.`); }}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor={formTitleId} className="text-sm font-medium">문제 제목</label>
                  <input
                    id={formTitleId} value={problemTitle} onChange={(event) => setProblemTitle(event.target.value)}
                    placeholder="문제 제목을 입력하세요" aria-invalid={showFieldError || undefined}
                    aria-describedby={showFieldError ? errorId : undefined}
                    className="app-control app-radius-control w-full rounded-xl px-3 py-2.5 text-sm"
                  />
                  {showFieldError ? <p id={errorId} className="text-xs text-red-700 dark:text-red-400">제목을 입력해 주세요. 입력 오류 상태의 예시입니다.</p> : null}
                </div>
                <div className="space-y-2"><p id={typeId} className="text-sm font-medium">문제 유형</p><ThemeSelect value={questionType} options={questionTypes} onChange={(value) => setQuestionType(value as TestType)} ariaLabel="예시 문제 유형 선택" /></div>
              </div>
              <label className="block space-y-2"><span className="text-sm font-medium">메모</span><textarea value={memo} onChange={(event) => setMemo(event.target.value)} rows={3} placeholder="이 화면에서만 확인할 메모를 입력하세요" className="app-control app-radius-control block w-full resize-y rounded-xl px-3 py-2.5 text-sm leading-6" /></label>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-xs text-stone-500">
                  <input type="checkbox" checked={showFieldError} onChange={(event) => setShowFieldError(event.target.checked)} className="h-4 w-4 accent-red-600" />입력 오류 예시 보기
                </label>
                <Button type="submit" variant="primary" disabled={showFieldError}>입력 확인</Button>
              </div>
            </form>
          </DemoSection>

          <DemoSection id="tags" title="태그와 프로필" description="상태, 시각, 계정 표시는 공통 컴포넌트를 사용합니다. 이름이 같으면 아바타 색상도 같습니다.">
            <div className="app-card app-radius-card flex flex-wrap items-center gap-4 rounded-2xl border p-4 sm:p-5">
              <div className="flex items-center gap-2"><BrandMark /><span className="text-sm font-semibold">Law Solver</span></div>
              <PremiumBadge />
              <TimestampTag label="등록" value={sampleDate} />
              <TimestampTag label="마지막 풀이" value={sampleLastPlay} hideYearOnSmallScreens />
              <div className="flex items-center gap-2">{["김하늘", "이서연", "박도윤"].map((name) => <ProfileAvatar key={name} displayName={name} />)}</div>
              <div className="ml-auto flex items-center gap-2"><span className="text-xs text-stone-500">관리 메뉴</span><ActionMenu label="디자인 예시 관리 메뉴" items={[{ id: "rename", label: "이름 변경", onSelect: openEditor }, { id: "delete", label: "삭제", danger: true, onSelect: () => setDialog("confirm") }]} /></div>
            </div>
          </DemoSection>

          <DemoSection id="books" title="책 표지" description="과목은 높이 224px의 책 표지로 표시합니다. 모바일에서는 2열, 넓은 화면에서는 5열 또는 6열로 정리됩니다.">
            <BookGrid>
              {subjectCoverPalettes.map((palette, index) => {
                const title = ["민법", "헌법", "형법", "행정법", "상법"][index]!;
                return (
                  <a key={palette.id} href="#ds-sessions" className={bookLinkClassName}>
                    <BookCover title={title} coverStyle={getSubjectCoverStyle(title, palette.id)} accentColor={getSubjectAccentColor(palette.id)} eyebrow={palette.label}>
                      <div className="mt-auto border-t border-stone-200 pt-2 text-xs text-stone-500 dark:border-stone-700">
                        예시 문제 <span className="font-semibold tabular-nums">{index + 3}개</span>
                      </div>
                    </BookCover>
                  </a>
                );
              })}
              <a href="#ds-sessions" className={bookLinkClassName}>
                <BookCover title="법조윤리" coverStyle={premiumOrangeCoverStyle} accentColor={premiumOrangeAccentColor} eyebrow="온라인 과목" topRight={<PremiumBadge />}>
                  <div className="mt-auto border-t border-stone-200 pt-2 text-xs text-stone-500 dark:border-stone-700">온라인 표지 예시</div>
                </BookCover>
              </a>
            </BookGrid>
            <div className="pt-3">
              <h3 className="text-base font-semibold">상품 카드</h3>
              <p className="mb-4 mt-1 text-sm leading-6 text-stone-500">가격과 이용 조건은 책 표지 아래에 둡니다. 구매 버튼은 예시 알림만 표시합니다.</p>
              <BookGrid>
                {sampleProducts.map((product) => (
                  <CourseProductCard
                    key={product.id} product={product} priceLabel={`${product.priceKrw.toLocaleString("ko-KR")}원`}
                    actionLabel="구매 예시" active={false} disabled={false} pending={false}
                    onAction={() => notify(`${product.name} 구매 버튼의 예시입니다. 결제는 진행되지 않습니다.`, "info")}
                  />
                ))}
              </BookGrid>
            </div>
          </DemoSection>

          <DemoSection id="problems" title="문제 카드" description="제목 아래 한 줄에 유형, 문항 수, 세션 수를 담습니다. 등록 시각과 목록 이동은 하단에 배치합니다.">
            <div className="grid gap-3 lg:grid-cols-2">
              {[false, true].map((premium) => (
                <ProblemCardPreview
                  key={String(premium)} title={problemTitle || "민법 기초 확인 문제"} type={questionType} premium={premium}
                  onEdit={() => notify("버튼과 입력 영역에서 예시 제목을 바꿀 수 있습니다.", "info")}
                />
              ))}
            </div>
          </DemoSection>

          <DemoSection id="sessions" title="세션 목록" description="회차와 상태 태그, 세 개의 정보 박스, 우측 행동 버튼을 같은 구조로 표시합니다. 관리 메뉴에서 예시 이름을 바꾸거나 예시 행을 삭제해 보세요.">
            <div className="space-y-2.5">
              {sessionVisible ? (
                <SessionListItem
                  attemptNumber={1} title={sessionTitle} modeLabel="첫 풀이" completed={false}
                  orderMode="number" createdAt={sampleDate} lastPlayedAt={sampleLastPlay}
                  solvedQuestions={8} totalQuestions={15} elapsedSeconds={482} scorePercent={null}
                  destination="/debug/designsystem#ds-feedback"
                  actions={<ActionMenu label="예시 세션 메뉴 열기" size="session" items={[
                    { id: "rename", label: "이름 변경", onSelect: openEditor },
                    { id: "delete", label: "삭제", danger: true, onSelect: () => setDialog("confirm") },
                  ]} />}
                />
              ) : (
                <div className="app-card app-radius-card rounded-2xl border border-dashed p-5 text-center">
                  <p className="text-sm text-stone-500">예시 세션을 삭제했습니다.</p>
                  <Button className="mt-3" size="sm" onClick={() => setSessionVisible(true)}>예시 복원</Button>
                </div>
              )}
              <SessionListItem attemptNumber={2} title="틀린 문제 다시 확인하기" modeLabel="오답 풀기" completed orderMode="random" createdAt={sampleDate} lastPlayedAt={sampleLastPlay} solvedQuestions={5} totalQuestions={5} elapsedSeconds={195} scorePercent={80} destination="/debug/designsystem#ds-feedback" />
            </div>
          </DemoSection>

          <DemoSection id="feedback" title="모달과 알림" description="모달은 키보드 포커스를 안에 유지하고 닫힌 뒤 원래 버튼으로 돌려줍니다. 토스트는 문서 흐름 바깥에 표시되어 카드 위치를 바꾸지 않습니다.">
            <div className="app-card app-radius-card space-y-4 rounded-2xl border p-4 sm:p-5">
              <div className="flex flex-wrap gap-2"><Button variant="primary" onClick={openEditor}>입력 모달 열기</Button><Button variant="danger" onClick={() => setDialog("confirm")}>삭제 확인 열기</Button></div>
              <div className="flex flex-wrap gap-2 border-t border-stone-200 pt-4 dark:border-stone-700">
                <Button size="sm" onClick={() => notify("예시 설정을 저장했습니다.", "success")}>성공 알림</Button>
                <Button size="sm" onClick={() => notify("예시 작업을 처리하지 못했습니다. 다시 시도해 주세요.", "error")}>오류 알림</Button>
                <Button size="sm" onClick={() => notify("이것은 경고 알림의 예시입니다.", "warning")}>경고 알림</Button>
                <Button size="sm" onClick={() => notify("이 화면의 모든 값은 미리보기용입니다.", "info")}>안내 알림</Button>
              </div>
            </div>
          </DemoSection>

          <DemoSection id="loading" title="로딩" description="스켈레톤은 도착할 콘텐츠의 형태를 유지합니다. 작은 작업은 버튼 안에 진행 상태를 표시합니다.">
            <div className="grid gap-3 md:grid-cols-2">
              <LoadingRegion label="카드 로딩 상태 예시" className="app-card app-radius-card space-y-4 rounded-2xl border p-5">
                <SkeletonBlock className="h-5 w-3/5 rounded-lg" />
                <div className="grid grid-cols-3 gap-2">
                  <SkeletonBlock className="h-11 rounded-xl" /><SkeletonBlock className="h-11 rounded-xl" /><SkeletonBlock className="h-11 rounded-xl" />
                </div>
                <SkeletonBlock className="h-10 rounded-xl" />
              </LoadingRegion>
              <div className="app-card app-radius-card flex flex-col items-start justify-center gap-4 rounded-2xl border p-5">
                <Button variant="primary" pending pendingLabel="문제를 불러오는 중">문제 불러오기</Button>
                <p className="text-xs leading-5 text-stone-500">이 로딩 표시는 예시입니다. 실제 요청은 실행하지 않습니다.</p>
                <div className="app-focus-page app-subtle-surface app-radius-inset w-full rounded-xl border p-3">
                  <p className="mb-3 text-xs font-medium">풀이 화면에서는 움직임 없이 상태만 표시합니다.</p>
                  <Button variant="primary" pending pendingLabel="답안 저장 중">답안 저장</Button>
                </div>
              </div>
            </div>
          </DemoSection>

          <DemoSection id="motion" title="모션" description="카드는 20ms 간격으로 등장하며 대기 시간은 최대 100ms입니다. GNB와 푸터는 움직이지 않고, 기기에서 동작 줄이기를 켜면 효과가 생략됩니다.">
            <div className="app-card app-radius-card space-y-5 rounded-2xl border p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center"><div className="min-w-0 flex-1 sm:max-w-xs"><ThemeSelect value={motion} options={motionOptions} ariaLabel="진입 모션 선택" onChange={(value) => { setMotion(value); setMotionSequence((value) => value + 1); }} /></div><Button onClick={() => setMotionSequence((value) => value + 1)}>다시 재생</Button></div>
              <div className={`app-route-enter app-route-enter-${motion}`}>
                <div className="app-page" style={{ minHeight: 0, background: "transparent" }}>
                  <div key={motionSequence} className="app-content-stagger grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                    {[0, 20, 40, 60, 80, 100].map((delay, index) => <div key={delay} className="app-neutral-box app-radius-inset flex min-h-24 flex-col justify-center rounded-xl border px-3 py-4"><span className="text-sm font-semibold">카드 {index + 1}</span><span className="mt-2 text-xs tabular-nums text-stone-500">{delay}ms 뒤 시작</span></div>)}
                  </div>
                </div>
              </div>
            </div>
          </DemoSection>
        </main>
        <AppFooter />
      </div>

      {dialog === "edit" ? (
        <Dialog labelledBy={titleId} onClose={() => setDialog(null)} surfaceClassName="app-radius-card max-h-[calc(100dvh-2rem)] max-w-md overflow-y-auto rounded-2xl border p-5">
          <form className="space-y-4" onSubmit={(event) => {
            event.preventDefault();
            if (!draftTitle.trim()) return;
            setSessionTitle(draftTitle.trim());
            setSessionVisible(true);
            setDialog(null);
            notify("예시 세션 이름을 바꿨습니다.");
          }}>
            <div className="flex items-center justify-between gap-3">
              <h2 id={titleId} className="text-base font-semibold">예시 이름 변경</h2>
              <IconCloseButton label="예시 이름 변경 닫기" onClick={() => setDialog(null)} />
            </div>
            <p className="text-sm leading-6 text-stone-500">이 페이지의 세션 예시에만 반영됩니다.</p>
            <div className="space-y-2">
              <label htmlFor={draftId} className="text-sm font-medium">세션 제목</label>
              <input id={draftId} value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} required className="app-control app-radius-control w-full rounded-xl px-3 py-2.5 text-sm" />
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setDialog(null)}>취소</Button>
              <Button type="submit" variant="primary" disabled={!draftTitle.trim()}>이름 변경</Button>
            </div>
          </form>
        </Dialog>
      ) : null}
      {dialog === "confirm" ? (
        <ConfirmDialog
          title="예시 세션을 삭제할까요?"
          description="이 화면의 첫 번째 세션만 사라집니다. 실제 학습 기록에는 영향을 주지 않으며, 예시 복원 버튼으로 다시 표시할 수 있습니다."
          confirmLabel="예시 삭제" variant="danger" onCancel={() => setDialog(null)}
          onConfirm={() => { setSessionVisible(false); setDialog(null); notify("예시 세션을 삭제했습니다."); }}
        />
      ) : null}
      <Toast key={toast?.sequence} message={toast?.message ?? null} tone={toast?.tone} onDismiss={() => setToast(null)} />
    </div>
  );
}
