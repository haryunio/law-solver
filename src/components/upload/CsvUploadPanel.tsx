import { ChangeEvent, FormEvent, useRef, useState } from "react";
import {
  createSessionTitleFromFileName,
  inferTestTypeFromCsv,
  parseCsvByType,
  readCsvFileText,
} from "../../lib/csv";
import { toAnalyticsQuestionType, trackEvent } from "../../lib/analytics";
import { useTestStore } from "../../store/useTestStore";
import { SolveOrder, TestType } from "../../types/test";
import { ThemeSelect } from "../ui/ThemeSelect";

const testTypeOptions = [
  { value: "OX", label: "OX" },
  { value: "5-choice", label: "5지선다" },
  { value: "short", label: "단답형" },
];

const solveOrderOptions = [
  { value: "number", label: "번호 순서대로 풀기" },
  { value: "chapter-random", label: "챕터별로 무작위 풀기" },
  { value: "random", label: "전체 무작위 풀기" },
];

interface CsvUploadPanelProps {
  subjectId?: string | null;
  onCreated?: (sessionId: string) => void;
}

export function CsvUploadPanel({ subjectId, onCreated }: CsvUploadPanelProps) {
  const createSession = useTestStore((state) => state.createSession);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<TestType>("OX");
  const [orderMode, setOrderMode] = useState<SolveOrder>("number");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const selectedFileRef = useRef<File | null>(null);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.currentTarget.files?.[0] ?? null;
    selectedFileRef.current = selectedFile;
    setFile(selectedFile);

    if (!selectedFile) return;

    setTitle(createSessionTitleFromFileName(selectedFile.name));

    try {
      const csvText = await readCsvFileText(selectedFile);
      if (selectedFileRef.current !== selectedFile) return;

      const inferredType = inferTestTypeFromCsv(csvText);
      if (inferredType) setType(inferredType);
    } catch {
      // 파일을 제출할 때 기존 오류 UI에서 읽기 실패를 안내합니다.
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      setError("문제 세션 제목을 입력해 주세요.");
      return;
    }
    if (!file) {
      setError("CSV 파일을 선택해 주세요.");
      return;
    }

    setError("");
    setIsLoading(true);
    try {
      const csvText = await readCsvFileText(file);
      const questions = parseCsvByType(csvText, type);
      const sessionId = createSession({
        title: title.trim(),
        type,
        orderMode,
        questions,
        subjectId,
      });
      trackEvent("problem_upload_completed", {
        question_type: toAnalyticsQuestionType(type),
      });
      onCreated?.(sessionId);
    } catch (e) {
      trackEvent("problem_upload_failed", {
        question_type: toAnalyticsQuestionType(type),
        failure_type: "read_or_parse",
      });
      const message = e instanceof Error ? e.message : "CSV 파싱 중 오류가 발생했습니다.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="app-modal-surface space-y-4 rounded-2xl border p-5 shadow-xl"
    >
      <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">새 문제 등록</h2>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-stone-700 dark:text-stone-300">CSV 파일</span>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(event) => void handleFileChange(event)}
          className="app-control block w-full rounded-lg px-3 py-2 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-red-600 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-stone-700 dark:text-stone-300">세션 제목</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="app-control w-full rounded-lg px-3 py-2 text-sm"
          placeholder="예: 민법 기출 2025"
        />
      </label>

      <div className="space-y-2">
        <span className="text-sm font-medium text-stone-700 dark:text-stone-300">문제 타입</span>
        <ThemeSelect
          value={type}
          onChange={(value) => setType(value as TestType)}
          options={testTypeOptions}
          ariaLabel="문제 타입 선택"
        />
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium text-stone-700 dark:text-stone-300">풀이 순서</span>
        <ThemeSelect
          value={orderMode}
          onChange={(value) => setOrderMode(value as SolveOrder)}
          options={solveOrderOptions}
          ariaLabel="풀이 순서 선택"
        />
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">{error}</p>
      ) : null}

      <div className="pt-3">
        <button
          type="submit"
          disabled={isLoading}
          className="app-button-primary app-button-primary-standalone flex w-full items-center justify-center rounded-xl px-4 py-3 text-center text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "파싱 중..." : "등록 후 풀이 시작"}
        </button>
      </div>
    </form>
  );
}
