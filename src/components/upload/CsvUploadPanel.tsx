import { FormEvent, useState } from "react";
import { parseCsvByType, readCsvFileText } from "../../lib/csv";
import { useTestStore } from "../../store/useTestStore";
import { SolveOrder, TestType } from "../../types/test";

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
      onCreated?.(sessionId);
    } catch (e) {
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
        <span className="text-sm font-medium text-stone-700 dark:text-stone-300">세션 제목</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="app-control w-full rounded-lg px-3 py-2 text-sm"
          placeholder="예: 민법 기출 2025"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-stone-700 dark:text-stone-300">문제 타입</span>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as TestType)}
          className="app-control w-full rounded-lg px-3 py-2 text-sm"
        >
          <option value="OX">OX</option>
          <option value="5-choice">5지선다</option>
          <option value="short">단답형</option>
        </select>
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-stone-700 dark:text-stone-300">풀이 순서</span>
        <select
          value={orderMode}
          onChange={(e) => setOrderMode(e.target.value as SolveOrder)}
          className="app-control w-full rounded-lg px-3 py-2 text-sm"
        >
          <option value="number">번호 순서대로 풀기</option>
          <option value="chapter-random">챕터별로 무작위 풀기</option>
          <option value="random">전체 무작위 풀기</option>
        </select>
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-stone-700 dark:text-stone-300">CSV 파일</span>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="app-control block w-full rounded-lg px-3 py-2 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-red-600 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white"
        />
      </label>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">{error}</p>
      ) : null}

      <button
        type="submit"
        disabled={isLoading}
        className="app-button-primary app-button-primary-standalone inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? "파싱 중..." : "등록 후 풀이 시작"}
      </button>
    </form>
  );
}
