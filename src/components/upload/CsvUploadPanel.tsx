import { FormEvent, useState } from "react";
import { parseCsvByType, readCsvFileText } from "../../lib/csv";
import { useTestStore } from "../../store/useTestStore";
import { SolveOrder, TestType } from "../../types/test";

interface CsvUploadPanelProps {
  onCreated?: (sessionId: string) => void;
}

export function CsvUploadPanel({ onCreated }: CsvUploadPanelProps) {
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
      className="space-y-4 rounded-2xl border border-stone-200 bg-stone-50 p-5 shadow-sm"
    >
      <h2 className="text-lg font-semibold text-stone-900">새 문제 등록</h2>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-stone-700">세션 제목</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none ring-red-200 transition focus:ring-2"
          placeholder="예: 민법 기출 2025"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-stone-700">문제 타입</span>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as TestType)}
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none ring-red-200 transition focus:ring-2"
        >
          <option value="OX">OX</option>
          <option value="5-choice">5지선다</option>
          <option value="short">단답형</option>
        </select>
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-stone-700">풀이 순서</span>
        <select
          value={orderMode}
          onChange={(e) => setOrderMode(e.target.value as SolveOrder)}
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none ring-red-200 transition focus:ring-2"
        >
          <option value="number">번호 순서대로 풀기</option>
          <option value="chapter-random">챕터별로 무작위 풀기</option>
          <option value="random">전체 무작위 풀기</option>
        </select>
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-stone-700">CSV 파일</span>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 file:mr-4 file:rounded file:border-0 file:bg-red-600 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white"
        />
      </label>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <button
        type="submit"
        disabled={isLoading}
        className="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? "파싱 중..." : "등록 후 풀이 시작"}
      </button>
    </form>
  );
}
