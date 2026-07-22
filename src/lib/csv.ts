import Papa from "papaparse";
import { createId } from "./id";
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

export const createSessionTitleFromFileName = (fileName: string) => {
  const withoutExtension = fileName.replace(/\.[^.]+$/, "");
  return withoutExtension
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
};

export const inferTestTypeFromCsv = (csvText: string): TestType | null => {
  const result = Papa.parse<RawRow>(csvText, {
    header: true,
    skipEmptyLines: "greedy",
  });

  if (result.errors.length > 0) return null;

  const fields = result.meta.fields ?? [];
  const normalizedFields = fields.map(normalize);
  const hasQuestionHeader = normalizedFields.some((field) =>
    ["문제", "question", "문항"].includes(field),
  );
  const hasAnswerHeader = normalizedFields.some((field) => ["정답", "answer"].includes(field));

  if (!hasQuestionHeader || !hasAnswerHeader) return null;

  const hasChoiceHeader = normalizedFields.some((field) =>
    /^(?:지문|선지|선택지|choice|option)[1-5]$/.test(field),
  );
  if (hasChoiceHeader) return "5-choice";

  const answers = result.data
    .map((row) => getValue(row, ["정답", "answer"]))
    .filter(Boolean);
  if (answers.length === 0) return null;

  const isOxCsv = answers.every((answer) => ["O", "X", "0", "1"].includes(answer.toUpperCase()));
  return isOxCsv ? "OX" : "short";
};

const parseRawRows = (csvText: string): RawRow[] => {
  const result = Papa.parse<RawRow>(csvText, {
    header: true,
    skipEmptyLines: "greedy",
  });

  const firstError = result.errors[0];
  if (firstError) {
    const rowNumber = typeof firstError.row === "number" ? ` ${firstError.row + 2}번째 행을` : " 파일 내용을";
    throw new Error(`CSV${rowNumber} 읽지 못했습니다. 쉼표와 따옴표 형식을 확인해 주세요.`);
  }

  return result.data.filter((row) =>
    Object.values(row).some((value) => String(value ?? "").trim() !== ""),
  );
};

const parseOxAnswer = (value: string): "O" | "X" => {
  const token = value.trim().toUpperCase();
  if (token === "O" || token === "0") return "O";
  if (token === "X" || token === "1") return "X";
  throw new Error(`OX 정답은 O 또는 X로 입력해 주세요. 확인할 값: ${value}`);
};

const parseChoiceAnswer = (value: string): "1" | "2" | "3" | "4" | "5" => {
  const token = value.trim();
  if (["1", "2", "3", "4", "5"].includes(token)) return token as "1" | "2" | "3" | "4" | "5";
  throw new Error(`5지선다 정답은 1부터 5까지의 숫자로 입력해 주세요. 확인할 값: ${value}`);
};

const parseOxRows = (rows: RawRow[]): ParsedQuestion[] => {
  return rows.map((row, idx) => {
    const no = Number(getValue(row, ["번호", "no", "num", "number"], 0)) || idx + 1;
    const chapter = getValue(row, ["챕터", "chapter", "단원", "파트"]);
    const question = getValue(row, ["문제", "question", "문항"], 1);
    const answerRaw = getValue(row, ["정답", "answer"], 2);
    if (!question || !answerRaw) {
      throw new Error(`${idx + 2}번째 행의 문제와 정답을 모두 입력해 주세요.`);
    }

    return {
      id: createId(),
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

    // 박스 헤더 추출 (박스1, 박스2, ... 또는 box1, box2, ...)
    const boxes: string[] = [];
    const boxKeys = Object.keys(row)
      .filter((key) => {
        const norm = normalize(key);
        return norm.startsWith("박스") || norm.startsWith("box");
      })
      .sort((a, b) => {
        const numA = parseInt(a.replace(/[^0-9]/g, "") || "0");
        const numB = parseInt(b.replace(/[^0-9]/g, "") || "0");
        return numA - numB;
      });

    boxKeys.forEach((key) => {
      const val = row[key]?.trim();
      if (val) boxes.push(val);
    });

    if (!question || choices.some((choice) => !choice) || !answerRaw) {
      throw new Error(`${idx + 2}번째 행의 문제, 선택지 5개와 정답을 모두 입력해 주세요.`);
    }

    return {
      id: createId(),
      no,
      chapter,
      question,
      boxes: boxes.length > 0 ? boxes : undefined,
      choices,
      answer: parseChoiceAnswer(answerRaw),
      explanation: getValue(row, ["해설", "해설optional", "explanation"], 8),
      source: getValue(row, ["출처", "출처optional", "source"], 9),
      my_answer: "",
      originalRow: row,
    };
  });
};

const parseShortRows = (rows: RawRow[]): ParsedQuestion[] => {
  return rows.map((row, idx) => {
    const no = Number(getValue(row, ["번호", "no", "num", "number"], 0)) || idx + 1;
    const chapter = getValue(row, ["챕터", "chapter", "단원", "파트"]);
    const question = getValue(row, ["문제", "question", "문항"], 1);
    const answerRaw = getValue(row, ["정답", "answer"], 2);
    if (!question || !answerRaw) {
      throw new Error(`${idx + 2}번째 행의 문제와 정답을 모두 입력해 주세요.`);
    }

    return {
      id: createId(),
      no,
      chapter,
      question,
      answer: answerRaw.trim(), // 단답형은 그대로 사용
      explanation: getValue(row, ["해설", "해설optional", "explanation"], 3),
      source: getValue(row, ["출처", "출처optional", "source"], 4),
      my_answer: "",
      originalRow: row,
    };
  });
};

export const parseCsvByType = (csvText: string, type: TestType): ParsedQuestion[] => {
  const rows = parseRawRows(csvText);
  if (!rows.length) throw new Error("CSV에 등록할 문제가 없습니다. 헤더 아래에 문제를 한 개 이상 입력해 주세요.");
  
  if (type === "OX") return parseOxRows(rows);
  if (type === "5-choice") return parseChoiceRows(rows);
  return parseShortRows(rows);
};

export const buildSessionExportCsv = (session: TestSession): string => {
  const rows = session.questions.map((question) => ({
    ...question.originalRow,
    my_answer: question.my_answer,
    wrong_note: question.wrong_note || "",
  }));
  return Papa.unparse(rows);
};

export const buildWrongQuestionsOnlyCsv = (session: TestSession): string => {
  const wrongQuestions = session.questions.filter(
    (q) => q.my_answer !== "" && q.my_answer !== q.answer,
  );
  const rows = wrongQuestions.map((question) => ({
    ...question.originalRow,
    my_answer: question.my_answer,
    // 원본 양식 유지를 위해 wrong_note는 포함하지 않음
  }));
  return Papa.unparse(rows);
};

export const buildWrongNoteCsv = (session: TestSession): string => {
  const wrongQuestions = session.questions.filter(
    (q) => q.my_answer !== "" && q.my_answer !== q.answer,
  );
  const rows = wrongQuestions.map((q, idx) => ({
    번호: q.no || idx + 1,
    챕터: q.chapter || "",
    문제: q.question,
    정답: q.answer,
    해설: q.explanation || "",
    출처: q.source || "",
    "내 답": q.my_answer,
    "오답 노트": q.wrong_note || "",
  }));
  return Papa.unparse(rows);
};

export const downloadCsvFile = (csvContent: string, fileName: string) => {
  const csv = csvContent.replace(/\r?\n/g, "\r\n");
  const withBom = `\uFEFF${csv}`;
  const blob = new Blob([withBom], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName.endsWith(".csv") ? fileName : `${fileName}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

const stripBom = (text: string) => text.replace(/^\uFEFF/, "");

export const readCsvFileText = async (file: File): Promise<string> => {
  let buffer: ArrayBuffer;
  try {
    buffer = await file.arrayBuffer();
  } catch {
    throw new Error("CSV 파일을 읽지 못했습니다. 파일을 다시 선택해 주세요.");
  }
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
  const csv = buildSessionExportCsv(session);
  downloadCsvFile(csv, `${session.title.replace(/\s+/g, "_")}_전체_결과.csv`);
};
