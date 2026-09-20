import { FormEvent, useId, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CsvUploadPanel } from "../components/upload/CsvUploadPanel";
import { ProblemSetCardMetadata } from "../components/session/ProblemSetCardMetadata";
import { ActionMenu } from "../components/ui/ActionMenu";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { AppFooter } from "../components/ui/AppFooter";
import { Button } from "../components/ui/Button";
import { DashboardHeaderTitle } from "../components/ui/DashboardHeaderTitle";
import { Dialog } from "../components/ui/Dialog";
import { IconCloseButton } from "../components/ui/IconCloseButton";
import { OverflowTooltipTitle } from "../components/ui/OverflowTooltipTitle";
import { ReturnLinkLabel } from "../components/ui/ReturnLinkLabel";
import { ThemeSelect } from "../components/ui/ThemeSelect";
import { TimestampTag } from "../components/ui/TimestampTag";
import { Toast } from "../components/ui/Toast";
import { getOfflineProblemSetPath } from "../lib/offlineSession";
import { useTestStore } from "../store/useTestStore";
import { NO_SUBJECT_ID, type OfflineProblemSet } from "../types/test";

export function DashboardPage() {
  const { subjectId = NO_SUBJECT_ID } = useParams();
  const problemSets = useTestStore((state) => state.problemSets);
  const sessions = useTestStore((state) => state.sessions);
  const subjects = useTestStore((state) => state.subjects);
  const deleteProblemSet = useTestStore((state) => state.deleteProblemSet);
  const updateProblemSet = useTestStore((state) => state.updateProblemSet);
  const navigate = useNavigate();
  const [openUpload, setOpenUpload] = useState(false);
  const [uploadNotice, setUploadNotice] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingSubjectId, setEditingSubjectId] = useState(NO_SUBJECT_ID);
  const [deleting, setDeleting] = useState<OfflineProblemSet | null>(null);
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
    const counts = new Map<string, { total: number; inProgress: number }>();
    for (const session of sessions) {
      const count = counts.get(session.problem_set_id) ?? { total: 0, inProgress: 0 };
      count.total += 1;
      if (session.status === "in-progress") count.inProgress += 1;
      counts.set(session.problem_set_id, count);
    }
    return counts;
  }, [sessions]);

  const openEdit = (problemSet: OfflineProblemSet) => {
    setEditingId(problemSet.id); setEditingTitle(problemSet.title);
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
      <Toast message={uploadNotice} tone="success" onDismiss={() => setUploadNotice("")} />
      <div className="mx-auto max-w-6xl">
        <DashboardHeaderTitle title={currentSubjectName} sectionTitle="문제 목록" logoTo="/dashboard" logoLabel="과목 목록으로 이동">
          <button type="button" onClick={() => setOpenUpload(true)} className="app-button-primary app-button-primary-standalone rounded-xl px-3 py-2 text-sm font-semibold sm:px-4">새 문제 등록</button>
          <Link to="/dashboard" className="app-button-secondary rounded-xl px-3 py-2 text-center text-sm font-semibold sm:px-4"><ReturnLinkLabel>과목 목록으로</ReturnLinkLabel></Link>
        </DashboardHeaderTitle>
        {sortedProblemSets.length === 0 ? (
          <div className="app-content-enter app-card rounded-2xl border border-dashed p-10 text-center">
            <p className="text-base font-medium text-stone-700 dark:text-stone-300">아직 등록한 문제가 없습니다.</p>
            <p className="mt-2 text-sm leading-6 text-stone-500">CSV 파일을 등록하고, 문제마다 원하는 만큼 풀이 세션을 만들어 보세요.</p>
          </div>
        ) : (
          <div className="app-content-stagger grid gap-3 lg:grid-cols-2">
            {sortedProblemSets.map((problemSet) => (
              <article key={problemSet.id} className="app-card app-problem-card flex min-w-0 flex-col rounded-2xl border">
                <div className="relative px-4 pb-4 pt-3.5 pr-12">
                  <OverflowTooltipTitle as="h2" text={problemSet.title} className="text-base font-semibold leading-6 text-stone-900 dark:text-stone-100" />
                  <div className="absolute right-3 top-2.5">
                    <ActionMenu label={`${problemSet.title} 메뉴 열기`} items={[
                      { id: "edit", label: "편집", onSelect: () => openEdit(problemSet) },
                      { id: "delete", label: "삭제", danger: true, onSelect: () => setDeleting(problemSet) },
                    ]} />
                  </div>
                </div>
                <div className="px-4 pb-3">
                  <ProblemSetCardMetadata type={problemSet.type} questionCount={problemSet.questions.length} sessionCount={sessionCounts.get(problemSet.id)?.total ?? 0} inProgressCount={sessionCounts.get(problemSet.id)?.inProgress ?? 0} />
                </div>
                <Link to={getOfflineProblemSetPath(problemSet.id, problemSet.subject_id)} aria-label="풀이 세션 보기" className="app-result-link mt-auto flex min-h-12 flex-wrap items-center justify-between gap-2 rounded-b-2xl border-t px-4 py-2.5">
                  <TimestampTag label="등록" value={problemSet.created_at} />
                  <span className="ml-auto whitespace-nowrap text-sm font-semibold">풀이 세션 보기 <span aria-hidden="true">→</span></span>
                </Link>
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
          }} onBatchCreated={(problemSetIds) => {
            setOpenUpload(false);
            setUploadNotice(`문제 ${problemSetIds.length}개를 등록했습니다.`);
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
      {deleting ? <ConfirmDialog title="이 문제를 삭제할까요?" description={`${deleting.title}\n\n문제와 연결된 풀이 세션 ${sessionCounts.get(deleting.id)?.total ?? 0}개가 함께 삭제됩니다. 삭제한 데이터는 복구할 수 없습니다.`} confirmLabel="문제 삭제" variant="danger" onCancel={() => setDeleting(null)} onConfirm={() => { deleteProblemSet(deleting.id); setDeleting(null); }} /> : null}
    </div>
  );
}
