import { FormEvent, useEffect, useId, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CsvUploadPanel } from "../components/upload/CsvUploadPanel";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { AppFooter } from "../components/ui/AppFooter";
import { Button } from "../components/ui/Button";
import { DashboardHeaderTitle } from "../components/ui/DashboardHeaderTitle";
import { Dialog } from "../components/ui/Dialog";
import { IconCloseButton } from "../components/ui/IconCloseButton";
import { OverflowTooltipTitle } from "../components/ui/OverflowTooltipTitle";
import { ReturnLinkLabel } from "../components/ui/ReturnLinkLabel";
import { ThemeSelect } from "../components/ui/ThemeSelect";
import { getOfflineProblemSetPath } from "../lib/offlineSession";
import { useTestStore } from "../store/useTestStore";
import { NO_SUBJECT_ID, type OfflineProblemSet } from "../types/test";

const typeLabel = { OX: "OX", "5-choice": "5지선다", short: "단답형" } as const;
const typeStyle = {
  OX: "border-red-100 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400",
  "5-choice": "border-orange-100 bg-orange-50 text-orange-700 dark:border-orange-900/50 dark:bg-orange-950/30 dark:text-orange-400",
  short: "border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400",
} as const;
const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit",
});

export function DashboardPage() {
  const { subjectId = NO_SUBJECT_ID } = useParams();
  const problemSets = useTestStore((state) => state.problemSets);
  const sessions = useTestStore((state) => state.sessions);
  const subjects = useTestStore((state) => state.subjects);
  const deleteProblemSet = useTestStore((state) => state.deleteProblemSet);
  const updateProblemSet = useTestStore((state) => state.updateProblemSet);
  const navigate = useNavigate();
  const [openUpload, setOpenUpload] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingSubjectId, setEditingSubjectId] = useState(NO_SUBJECT_ID);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<OfflineProblemSet | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const uploadTitleId = useId();
  const editTitleId = useId();

  const isNoSubject = subjectId === NO_SUBJECT_ID;
  const currentSubject = isNoSubject ? null : subjects.find((subject) => subject.id === subjectId);
  const currentSubjectName = currentSubject?.name ?? "과목 없음";
  const sortedProblemSets = useMemo(() => problemSets
    .filter((problemSet) => isNoSubject ? !problemSet.subject_id : problemSet.subject_id === subjectId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
  [isNoSubject, problemSets, subjectId]);
  const sessionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const session of sessions) counts.set(session.problem_set_id, (counts.get(session.problem_set_id) ?? 0) + 1);
    return counts;
  }, [sessions]);

  useEffect(() => {
    if (!openMenuId) return;
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) setOpenMenuId(null);
    };
    const closeEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpenMenuId(null); };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeEscape);
    return () => { document.removeEventListener("pointerdown", closeOutside); document.removeEventListener("keydown", closeEscape); };
  }, [openMenuId]);

  const openEdit = (problemSet: OfflineProblemSet) => {
    setOpenMenuId(null); setEditingId(problemSet.id); setEditingTitle(problemSet.title);
    setEditingSubjectId(problemSet.subject_id ?? NO_SUBJECT_ID);
  };
  const saveEdit = (event: FormEvent) => {
    event.preventDefault();
    if (!editingId || !editingTitle.trim()) return;
    updateProblemSet(editingId, {
      title: editingTitle.trim(), subjectId: editingSubjectId === NO_SUBJECT_ID ? null : editingSubjectId,
    });
    setEditingId(null);
  };

  if (!isNoSubject && !currentSubject) return (
    <div className="app-page px-4 py-8 md:px-6"><div className="app-card mx-auto max-w-2xl rounded-2xl border p-8 text-center">
      <p className="text-stone-700 dark:text-stone-300">과목을 찾을 수 없습니다. 과목 목록에서 다시 선택해 주세요.</p>
      <Link to="/dashboard" className="app-button-primary mt-4 inline-flex rounded-lg px-4 py-2 text-sm font-semibold"><ReturnLinkLabel variant="solid">과목 목록으로</ReturnLinkLabel></Link>
    </div></div>
  );

  return (
    <div className="app-page px-4 py-8 transition-colors duration-300 md:px-6">
      <div className="mx-auto max-w-6xl">
        <DashboardHeaderTitle title={currentSubjectName} sectionTitle="문제 목록" logoTo="/dashboard" logoLabel="과목 목록으로 이동">
          <button type="button" onClick={() => setOpenUpload(true)} className="app-button-primary app-button-primary-standalone rounded-xl px-3 py-2 text-sm font-semibold sm:px-4">새 문제 등록</button>
          <Link to="/dashboard" className="app-button-secondary rounded-xl px-3 py-2 text-center text-sm font-semibold sm:px-4"><ReturnLinkLabel>과목 목록으로</ReturnLinkLabel></Link>
        </DashboardHeaderTitle>
        <p className="mb-4 text-sm text-stone-500 dark:text-stone-400">등록한 문제 {sortedProblemSets.length}개</p>
        {sortedProblemSets.length === 0 ? (
          <div className="app-card rounded-2xl border border-dashed p-10 text-center">
            <p className="text-base font-medium text-stone-700 dark:text-stone-300">아직 등록한 문제가 없습니다.</p>
            <p className="mt-2 text-sm leading-6 text-stone-500">CSV 파일을 등록하고, 문제마다 원하는 만큼 풀이 세션을 만들어 보세요.</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {sortedProblemSets.map((problemSet) => (
              <article key={problemSet.id} className="app-card app-problem-card flex min-w-0 flex-col rounded-2xl border">
                <div className="relative px-4 pb-3 pt-4 pr-12">
                  <OverflowTooltipTitle as="h2" text={problemSet.title} className="text-base font-bold leading-snug text-stone-900 dark:text-stone-100" />
                  <div className="absolute right-3 top-3" ref={openMenuId === problemSet.id ? menuRef : undefined}>
                    <button type="button" onClick={() => setOpenMenuId((current) => current === problemSet.id ? null : problemSet.id)} className="app-button-secondary flex h-7 w-7 items-center justify-center rounded-full text-base font-bold" aria-label={`${problemSet.title} 메뉴 열기`} aria-expanded={openMenuId === problemSet.id}>⋮</button>
                    {openMenuId === problemSet.id ? (
                      <div className="app-card absolute right-0 top-9 z-20 w-32 overflow-hidden rounded-xl border py-1 shadow-xl">
                        <button type="button" onClick={() => openEdit(problemSet)} className="block w-full px-4 py-2 text-left text-sm font-semibold text-stone-700 hover:bg-stone-50 dark:text-stone-200 dark:hover:bg-stone-800">편집</button>
                        <button type="button" onClick={() => { setOpenMenuId(null); setDeleting(problemSet); }} className="block w-full px-4 py-2 text-left text-sm font-semibold text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30">삭제</button>
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="px-4 pb-4">
                  <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${typeStyle[problemSet.type]}`}>{typeLabel[problemSet.type]}</span>
                  <dl className="mt-3 grid grid-cols-2 gap-2">
                    <div className="app-neutral-box rounded-xl px-3 py-2"><dt className="text-[11px] text-stone-500">전체 문항</dt><dd className="mt-1 text-sm font-semibold text-stone-900 dark:text-stone-100">{problemSet.questions.length}문항</dd></div>
                    <div className="app-neutral-box rounded-xl px-3 py-2"><dt className="text-[11px] text-stone-500">풀이 세션</dt><dd className="mt-1 text-sm font-semibold text-stone-900 dark:text-stone-100">{sessionCounts.get(problemSet.id) ?? 0}개</dd></div>
                  </dl>
                  <p className="mt-3 text-xs text-stone-400 dark:text-stone-500">문제 등록 <time dateTime={problemSet.created_at}>{Number.isFinite(new Date(problemSet.created_at).getTime()) ? dateFormatter.format(new Date(problemSet.created_at)) : "날짜 기록 없음"}</time></p>
                </div>
                <Link to={getOfflineProblemSetPath(problemSet.id, problemSet.subject_id)} className="app-result-link mt-auto flex items-center justify-center rounded-b-2xl border-t px-4 py-3 text-sm font-semibold">풀이 세션 보기</Link>
              </article>
            ))}
          </div>
        )}
        <AppFooter />
      </div>
      {openUpload ? (
        <Dialog labelledBy={uploadTitleId} onClose={() => setOpenUpload(false)}>
          <CsvUploadPanel headingId={uploadTitleId} onCancel={() => setOpenUpload(false)} subjectId={isNoSubject ? null : subjectId} onCreated={(problemSetId) => {
            setOpenUpload(false); navigate(getOfflineProblemSetPath(problemSetId, isNoSubject ? null : subjectId));
          }} />
        </Dialog>
      ) : null}
      {editingId ? (
        <Dialog labelledBy={editTitleId} onClose={() => setEditingId(null)} surfaceClassName="max-h-[calc(100dvh-2rem)] max-w-md overflow-y-auto rounded-2xl border p-5">
          <form onSubmit={saveEdit} className="space-y-4">
            <div className="flex items-center justify-between gap-3"><h2 id={editTitleId} className="text-lg font-semibold text-stone-900 dark:text-stone-100">문제 편집</h2><IconCloseButton onClick={() => setEditingId(null)} label="문제 편집 닫기" /></div>
            <label className="block space-y-2"><span className="text-sm font-medium text-stone-700 dark:text-stone-300">문제 제목</span><input required value={editingTitle} onChange={(event) => setEditingTitle(event.target.value)} className="app-control w-full rounded-lg px-3 py-2 text-sm" /></label>
            <div className="space-y-2"><span className="text-sm font-medium text-stone-700 dark:text-stone-300">과목</span><ThemeSelect value={editingSubjectId} onChange={setEditingSubjectId} ariaLabel="과목 선택" options={[{ value: NO_SUBJECT_ID, label: "과목 없음" }, ...subjects.map((subject) => ({ value: subject.id, label: subject.name }))]} /></div>
            <p className="text-xs leading-5 text-stone-500">과목을 옮기면 이 문제의 모든 풀이 세션도 함께 이동합니다.</p>
            <div className="flex justify-end gap-2"><Button onClick={() => setEditingId(null)}>취소</Button><Button type="submit" variant="primary" disabled={!editingTitle.trim()}>저장</Button></div>
          </form>
        </Dialog>
      ) : null}
      {deleting ? <ConfirmDialog title="이 문제를 삭제할까요?" description={`${deleting.title}\n\n문제와 연결된 풀이 세션 ${sessionCounts.get(deleting.id) ?? 0}개가 함께 삭제됩니다. 삭제한 데이터는 복구할 수 없습니다.`} confirmLabel="문제 삭제" variant="danger" onCancel={() => setDeleting(null)} onConfirm={() => { deleteProblemSet(deleting.id); setDeleting(null); }} /> : null}
    </div>
  );
}
