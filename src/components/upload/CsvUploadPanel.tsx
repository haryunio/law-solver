import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import {
  createSessionTitleFromFileName,
  inferTestTypeFromCsv,
  parseCsvByType,
  readCsvFileText,
} from "../../lib/csv";
import { toAnalyticsQuestionType, trackEvent } from "../../lib/analytics";
import { useTestStore } from "../../store/useTestStore";
import { TestType } from "../../types/test";
import { Button } from "../ui/Button";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { IconCloseButton } from "../ui/IconCloseButton";
import { ThemeSelect } from "../ui/ThemeSelect";
import { Toast } from "../ui/Toast";

const testTypeOptions = [
  { value: "OX", label: "OX" },
  { value: "5-choice", label: "5지선다" },
  { value: "short", label: "단답형" },
];

interface CsvUploadPanelProps {
  subjectId?: string | null;
  headingId?: string;
  onCancel?: () => void;
  onCreated?: (problemSetId: string) => void;
  onBatchCreated?: (problemSetIds: string[]) => void;
}

export function CsvUploadPanel({ subjectId, headingId, onCancel, onCreated, onBatchCreated }: CsvUploadPanelProps) {
  const createProblemSet = useTestStore((state) => state.createProblemSet);
  const createProblemSets = useTestStore((state) => state.createProblemSets);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<TestType>("OX");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInspecting, setIsInspecting] = useState(false);
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [showBatchConfirm, setShowBatchConfirm] = useState(false);
  const batchFilesRef = useRef<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedFileRef = useRef<File | null>(null);
  const fileTextRef = useRef<string | null>(null);
  const mounted = useRef(true);
  const submitting = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; selectedFileRef.current = null; batchFilesRef.current = []; };
  }, []);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (submitting.current) return;
    const selectedFiles = Array.from(event.currentTarget.files ?? []);
    batchFilesRef.current = [];
    setBatchFiles([]);
    setShowBatchConfirm(false);
    setIsInspecting(false);
    selectedFileRef.current = null;
    fileTextRef.current = null;
    setFile(null);
    setError("");
    if (selectedFiles.some((item) => !/\.csv$/i.test(item.name))) {
      event.currentTarget.value = "";
      setError("CSV 파일만 선택해 주세요.");
      return;
    }
    if (selectedFiles.length > 1) {
      batchFilesRef.current = selectedFiles;
      setBatchFiles(selectedFiles);
      setShowBatchConfirm(true);
      return;
    }
    const selectedFile = selectedFiles[0] ?? null;
    selectedFileRef.current = selectedFile;
    setFile(selectedFile);
    if (!selectedFile) { setIsInspecting(false); return; }
    setTitle(createSessionTitleFromFileName(selectedFile.name));
    setIsInspecting(true);
    try {
      const csvText = await readCsvFileText(selectedFile);
      if (!mounted.current || selectedFileRef.current !== selectedFile) return;
      fileTextRef.current = csvText;
      const inferredType = inferTestTypeFromCsv(csvText);
      if (inferredType) setType(inferredType);
    } catch {
      if (mounted.current && selectedFileRef.current === selectedFile) setError("CSV 파일을 읽지 못했습니다. 파일을 다시 선택해 주세요.");
    } finally {
      if (mounted.current && selectedFileRef.current === selectedFile) setIsInspecting(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting.current || isInspecting) return;
    if (batchFiles.length > 1) { setShowBatchConfirm(true); return; }
    if (!title.trim()) { setError("문제 제목을 입력해 주세요."); return; }
    if (!file) { setError("CSV 파일을 선택해 주세요."); return; }
    submitting.current = true;
    setError(""); setIsLoading(true);
    try {
      const csvText = fileTextRef.current ?? await readCsvFileText(file);
      if (!mounted.current || selectedFileRef.current !== file) return;
      const questions = parseCsvByType(csvText, type);
      const problemSetId = createProblemSet({ title: title.trim(), type, questions, subjectId });
      trackEvent("problem_upload_completed", { question_type: toAnalyticsQuestionType(type) });
      onCreated?.(problemSetId);
    } catch (cause) {
      if (!mounted.current) return;
      trackEvent("problem_upload_failed", { question_type: toAnalyticsQuestionType(type), failure_type: "read_or_parse" });
      setError(cause instanceof Error ? cause.message : "CSV 파일을 읽지 못했습니다. 파일 형식을 확인한 뒤 다시 시도해 주세요.");
    } finally {
      submitting.current = false;
      if (mounted.current) setIsLoading(false);
    }
  };

  const handleBatchSubmit = async () => {
    const selectedFiles = batchFilesRef.current;
    if (submitting.current || selectedFiles.length < 2) return;
    submitting.current = true;
    setError("");
    setIsLoading(true);
    let activeFile: File | null = null;
    let activeType = type;
    try {
      const problems: Parameters<typeof createProblemSets>[0] = [];
      for (const [index, selectedFile] of selectedFiles.entries()) {
        activeFile = selectedFile;
        const csvText = await readCsvFileText(selectedFile);
        if (!mounted.current || batchFilesRef.current !== selectedFiles) return;
        const inferredType = inferTestTypeFromCsv(csvText);
        if (!inferredType) throw new Error("문제 유형을 확인하지 못했습니다. 이 파일을 하나만 선택한 뒤 유형을 지정해 등록해 주세요.");
        activeType = inferredType;
        problems.push({
          title: createSessionTitleFromFileName(selectedFile.name) || `새 문제 ${index + 1}`,
          type: inferredType,
          questions: parseCsvByType(csvText, inferredType),
          subjectId,
        });
      }
      activeFile = null;
      const problemSetIds = createProblemSets(problems);
      for (const problem of problems) {
        trackEvent("problem_upload_completed", { question_type: toAnalyticsQuestionType(problem.type) });
      }
      batchFilesRef.current = [];
      setBatchFiles([]);
      setShowBatchConfirm(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onBatchCreated?.(problemSetIds);
    } catch (cause) {
      if (!mounted.current || batchFilesRef.current !== selectedFiles) return;
      trackEvent("problem_upload_failed", { question_type: toAnalyticsQuestionType(activeType), failure_type: "read_or_parse" });
      const message = cause instanceof Error ? cause.message : "CSV 파일을 읽지 못했습니다. 파일 형식을 확인한 뒤 다시 시도해 주세요.";
      setError(`${activeFile ? `${activeFile.name}: ` : ""}${message} 선택한 파일은 아직 등록하지 않았습니다.`);
      setShowBatchConfirm(false);
    } finally {
      submitting.current = false;
      if (mounted.current) setIsLoading(false);
    }
  };

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-4">
      <Toast message={error} onDismiss={() => setError("")} />
      <div className="flex items-center justify-between gap-3">
        <h2 id={headingId} className="text-lg font-semibold text-stone-900 dark:text-stone-100">새 문제 등록</h2>
        {onCancel ? <IconCloseButton onClick={onCancel} disabled={isLoading} label="새 문제 등록 닫기" /> : null}
      </div>
      <div className="space-y-2">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-stone-700 dark:text-stone-300">CSV 파일</span>
          <input ref={fileInputRef} type="file" multiple accept=".csv,text/csv" disabled={isLoading} onChange={(event) => void handleFileChange(event)} className="app-control block w-full rounded-lg px-3 py-2 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-red-600 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white" />
        </label>
        <p className="text-xs leading-5 text-stone-500 dark:text-stone-400">여러 CSV 파일을 선택하면 한 번에 등록할 수 있습니다.</p>
      </div>
      {batchFiles.length > 1 ? (
        <div className="app-neutral-box rounded-xl border p-3">
          <p className="text-sm font-medium text-stone-800 dark:text-stone-200">선택한 CSV 파일 {batchFiles.length}개</p>
          <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto text-xs leading-5 text-stone-500 dark:text-stone-400">
            {batchFiles.map((item, index) => <li key={index} className="break-all">{item.name}</li>)}
          </ul>
          <p className="mt-2 text-xs leading-5 text-stone-500 dark:text-stone-400">파일명으로 제목을 정하고, 파일마다 문제 유형을 자동으로 확인합니다.</p>
        </div>
      ) : <>
      <label className="block space-y-2">
        <span className="text-sm font-medium text-stone-700 dark:text-stone-300">문제 제목</span>
        <input required value={title} disabled={isLoading} onChange={(event) => setTitle(event.target.value)} className="app-control w-full rounded-lg px-3 py-2 text-sm" placeholder="예: 민법 기출 2025" />
      </label>
      <div className="space-y-2">
        <span className="text-sm font-medium text-stone-700 dark:text-stone-300">문제 타입</span>
        <ThemeSelect value={type} onChange={(value) => setType(value as TestType)} options={testTypeOptions} ariaLabel="문제 타입 선택" />
      </div>
      </>}
      <p className="text-sm leading-6 text-stone-500 dark:text-stone-400">등록한 문제에서 풀이 세션을 만들어 시작할 수 있습니다. 세션마다 제목과 풀이 순서를 따로 정할 수 있습니다.</p>
      <Button type="submit" variant="primary" className="w-full" pending={isLoading || isInspecting} pendingLabel={isInspecting ? "파일 확인 중" : "문제 등록 중"}>{batchFiles.length > 1 ? "일괄 등록 확인" : "문제 등록"}</Button>
    </form>
    {showBatchConfirm ? (
      <ConfirmDialog
        title="문제를 일괄 등록할까요?"
        description={`총 ${batchFiles.length}개의 CSV 파일을 선택했습니다.\n파일마다 제목과 유형을 자동으로 정해 등록할까요?`}
        confirmLabel="일괄 등록"
        onConfirm={handleBatchSubmit}
        onCancel={() => setShowBatchConfirm(false)}
        pending={isLoading}
        pendingLabel="문제 등록 중"
      />
    ) : null}
    </>
  );
}
