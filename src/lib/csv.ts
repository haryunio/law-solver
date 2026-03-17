import Papa from "papaparse";
import { ParsedQuestion, TestSession, TestType } from "../types/test";

type RawRow = Record<string, string>;

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[()]/g, "")
    .replace(/[\[\]_]/g, "");

const getValue = (row: RawRow, keys: string[], fallbackIndex?: number) => {
  const keySet = new Set(keys.map(normalize));
  for (const key of Object.keys(row)) {
    if (keySet.has(normalize(key))) return (row[key] ?? "").toString().trim();
  }
  if (fallbackIndex !== undefined) {
    const values = Object.values(row);
    return (values[fallbackIndex] ?? "").toString().trim();
  }
  return "";
};

const parseRawRows = (csvText: string): RawRow[] => {
  const result = Papa.parse<RawRow>(csvText, {
    header: true,
    skipEmptyLines: "greedy",
  });

  const firstError = result.errors[0];
  if (firstError) {
    throw new Error(firstError.message);
  }

  return result.data.filter((row) =>
    Object.values(row).some((value) => String(value ?? "").trim() !== ""),
  );
};

const parseOxAnswer = (value: string): "O" | "X" => {
  const token = value.trim().toUpperCase();
  if (token === "O" || token === "0") return "O";
  if (token === "X" || token === "1") return "X";
  throw new Error(`OX 정답 값이 올바르지 않습니다: ${value}`);
};

const parseChoiceAnswer = (value: string): "1" | "2" | "3" | "4" | "5" => {
  const token = value.trim();
  if (["1", "2", "3", "4", "5"].includes(token)) return token as "1" | "2" | "3" | "4" | "5";
  throw new Error(`5지선다 정답 값이 올바르지 않습니다: ${value}`);
};

const parseOxRows = (rows: RawRow[]): ParsedQuestion[] => {
  return rows.map((row, idx) => {
    const no = Number(getValue(row, ["번호", "no", "num", "number"], 0)) || idx + 1;
    const chapter = getValue(row, ["챕터", "chapter", "단원", "파트"]);
    const question = getValue(row, ["문제", "question", "문항"], 1);
    const answerRaw = getValue(row, ["정답", "answer"], 2);
    if (!question || !answerRaw) {
      throw new Error(`${idx + 2}번째 행에 문제/정답이 비어 있습니다.`);
    }

    return {
      id: crypto.randomUUID(),
      no,
      chapter,
      question,
      answer: parseOxAnswer(answerRaw),
      explanation: getValue(row, ["해설", "해설optional", "explanation"], 3),
      source: getValue(row, ["출처", "출처optional", "source"], 4),
      my_answer: "",
      originalRow: row,
    };
  });
};

const parseChoiceRows = (rows: RawRow[]): ParsedQuestion[] => {
  return rows.map((row, idx) => {
    const no = Number(getValue(row, ["번호", "no", "num", "number"], 0)) || idx + 1;
    const chapter = getValue(row, ["챕터", "chapter", "단원", "파트"]);
    const question = getValue(row, ["문제", "question", "문항"], 1);
    const choices: [string, string, string, string, string] = [
      getValue(row, ["지문1", "선지1", "선택지1", "choice1", "option1"], 2),
      getValue(row, ["지문2", "선지2", "선택지2", "choice2", "option2"], 3),
      getValue(row, ["지문3", "선지3", "선택지3", "choice3", "option3"], 4),
      getValue(row, ["지문4", "선지4", "선택지4", "choice4", "option4"], 5),
      getValue(row, ["지문5", "선지5", "선택지5", "choice5", "option5"], 6),
    ];
    const answerRaw = getValue(row, ["정답", "answer"], 7);

    if (!question || choices.some((choice) => !choice) || !answerRaw) {
      throw new Error(`${idx + 2}번째 행에 문제/선지/정답이 비어 있습니다.`);
    }

    return {
      id: crypto.randomUUID(),
      no,
      chapter,
      question,
      choices,
      answer: parseChoiceAnswer(answerRaw),
      explanation: getValue(row, ["해설", "해설optional", "explanation"], 8),
      source: getValue(row, ["출처", "출처optional", "source"], 9),
      my_answer: "",
      originalRow: row,
    };
  });
};

export const parseCsvByType = (csvText: string, type: TestType): ParsedQuestion[] => {
  const rows = parseRawRows(csvText);
  if (!rows.length) throw new Error("CSV 데이터가 비어 있습니다.");
  return type === "OX" ? parseOxRows(rows) : parseChoiceRows(rows);
};

export const buildSessionExportCsv = (session: TestSession): string => {
  const rows = session.questions.map((question) => ({
    ...question.originalRow,
    my_answer: question.my_answer,
  }));
  return Papa.unparse(rows);
};

const stripBom = (text: string) => text.replace(/^\uFEFF/, "");

export const readCsvFileText = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  const hasUtf8Bom = bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf;
  if (hasUtf8Bom) {
    return stripBom(new TextDecoder("utf-8").decode(bytes));
  }

  const encodings = ["utf-8", "euc-kr", "windows-949", "cp949"];
  for (const encoding of encodings) {
    try {
      const decoded = new TextDecoder(encoding, { fatal: true }).decode(bytes);
      if (!decoded.includes("\u0000")) {
        return stripBom(decoded);
      }
    } catch {
      // Try next encoding
    }
  }

  return stripBom(new TextDecoder("utf-8").decode(bytes));
};

export const downloadSessionCsv = (session: TestSession) => {
  const csv = buildSessionExportCsv(session).replace(/\r?\n/g, "\r\n");
  const withBom = `\uFEFF${csv}`;
  const blob = new Blob([withBom], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${session.title.replace(/\s+/g, "_")}_with_answers.csv`;
  link.click();
  URL.revokeObjectURL(url);
};
