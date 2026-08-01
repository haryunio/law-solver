import {
  NO_SUBJECT_ID,
  type DashboardBackupData,
  type ParsedQuestion,
  type SessionSubjectMap,
  type Subject,
  type SubjectCoverPalette,
  type TestSession,
  type TestType,
} from "../types/test";

export const DASHBOARD_BACKUP_VERSION = 3 as const;

export class DashboardBackupValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DashboardBackupValidationError";
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const validDate = (value: unknown, fallback: string): string =>
  typeof value === "string" && Number.isFinite(Date.parse(value))
    ? new Date(value).toISOString()
    : fallback;

const requiredString = (value: unknown, label: string, maxLength = 100_000): string => {
  if (typeof value !== "string" || value.length === 0 || value.length > maxLength) {
    throw new DashboardBackupValidationError(`${label} 형식을 확인해 주세요.`);
  }
  return value;
};

const optionalString = (value: unknown, maxLength = 1_000_000): string | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string" || value.length > maxLength) {
    throw new DashboardBackupValidationError("문제 텍스트 형식을 확인해 주세요.");
  }
  return value;
};

const nonNegativeInteger = (value: unknown, fallback = 0): number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : fallback;

const palettes: SubjectCoverPalette[] = ["warm", "green", "blue", "purple", "gray"];
const types: TestType[] = ["OX", "5-choice", "short"];

function normalizeQuestion(value: unknown, index: number): ParsedQuestion {
  if (!isRecord(value)) {
    throw new DashboardBackupValidationError(`${index + 1}번째 문제 형식을 확인해 주세요.`);
  }
  const choices = value.choices;
  if (
    choices !== undefined &&
    (!Array.isArray(choices) || choices.length !== 5 || choices.some((choice) => typeof choice !== "string"))
  ) {
    throw new DashboardBackupValidationError(`${index + 1}번째 문제의 선택지를 확인해 주세요.`);
  }
  const boxes = value.boxes;
  if (boxes !== undefined && (!Array.isArray(boxes) || boxes.some((box) => typeof box !== "string"))) {
    throw new DashboardBackupValidationError(`${index + 1}번째 문제의 박스형 지문을 확인해 주세요.`);
  }
  const answer = requiredString(value.answer, `${index + 1}번째 문제의 정답`);
  const myAnswer = value.my_answer === "" ? "" : typeof value.my_answer === "string"
    ? value.my_answer
    : "";
  const originalRow = isRecord(value.originalRow)
    ? Object.fromEntries(
      Object.entries(value.originalRow).filter((entry): entry is [string, string] =>
        typeof entry[1] === "string"
      ),
    )
    : {};

  return {
    id: requiredString(value.id, `${index + 1}번째 문제 ID`, 200),
    no: nonNegativeInteger(value.no, index + 1),
    chapter: optionalString(value.chapter, 10_000),
    question: requiredString(value.question, `${index + 1}번째 문제 본문`, 1_000_000),
    boxes: boxes as string[] | undefined,
    choices: choices as ParsedQuestion["choices"],
    answer,
    explanation: optionalString(value.explanation),
    source: optionalString(value.source, 100_000),
    my_answer: myAnswer,
    wrong_note: optionalString(value.wrong_note),
    bookmark: typeof value.bookmark === "boolean" ? value.bookmark : false,
    originalRow,
  };
}

function normalizeSession(value: unknown, index: number): TestSession {
  if (!isRecord(value) || !Array.isArray(value.questions)) {
    throw new DashboardBackupValidationError(`${index + 1}번째 풀이 세션 형식을 확인해 주세요.`);
  }
  if (!types.includes(value.type as TestType)) {
    throw new DashboardBackupValidationError(`${index + 1}번째 풀이 세션의 문제 유형을 확인해 주세요.`);
  }
  if (value.status !== "in-progress" && value.status !== "completed") {
    throw new DashboardBackupValidationError(`${index + 1}번째 풀이 세션 상태를 확인해 주세요.`);
  }
  const questions = value.questions.map(normalizeQuestion);
  const questionIds = new Set(questions.map((question) => question.id));
  if (questionIds.size !== questions.length) {
    throw new DashboardBackupValidationError(`${index + 1}번째 풀이 세션에 중복 문제 ID가 있습니다.`);
  }
  const solved = questions.filter((question) => question.my_answer !== "").length;
  return {
    id: requiredString(value.id, `${index + 1}번째 풀이 세션 ID`, 200),
    title: requiredString(value.title, `${index + 1}번째 풀이 세션 제목`, 10_000),
    type: value.type as TestType,
    order_mode: value.order_mode === "chapter-random" || value.order_mode === "random"
      ? value.order_mode
      : "number",
    total_questions: questions.length,
    solved_questions: solved,
    score: typeof value.score === "number" && Number.isFinite(value.score)
      ? Math.max(0, Math.min(100, value.score))
      : 0,
    elapsed_time: nonNegativeInteger(value.elapsed_time),
    created_at: validDate(value.created_at, new Date(0).toISOString()),
    status: value.status,
    questions,
  };
}

function normalizeSubjects(value: unknown): Subject[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    throw new DashboardBackupValidationError("과목 목록 형식을 확인해 주세요.");
  }
  return value.map((subject, index) => {
    if (!isRecord(subject)) {
      throw new DashboardBackupValidationError(`${index + 1}번째 과목 형식을 확인해 주세요.`);
    }
    const id = requiredString(subject.id, `${index + 1}번째 과목 ID`, 200);
    if (id === NO_SUBJECT_ID) {
      throw new DashboardBackupValidationError("과목 ID 형식을 확인해 주세요.");
    }
    const cover = palettes.includes(subject.cover_palette as SubjectCoverPalette)
      ? subject.cover_palette as SubjectCoverPalette
      : undefined;
    return {
      id,
      name: requiredString(subject.name, `${index + 1}번째 과목 이름`, 10_000),
      created_at: validDate(subject.created_at, new Date(0).toISOString()),
      cover_palette: cover,
    };
  });
}

export function parseDashboardBackup(value: unknown): DashboardBackupData {
  const exportedAt = new Date().toISOString();
  const root = Array.isArray(value) ? { sessions: value } : value;
  if (!isRecord(root) || !Array.isArray(root.sessions)) {
    throw new DashboardBackupValidationError("올바른 Law Solver 백업 JSON이 아닙니다.");
  }
  if (root.app !== undefined && root.app !== "law-solver") {
    throw new DashboardBackupValidationError("다른 앱에서 만든 백업 파일은 불러올 수 없습니다.");
  }
  if (typeof root.version === "number" && root.version > DASHBOARD_BACKUP_VERSION) {
    throw new DashboardBackupValidationError("더 최신 버전에서 만든 백업입니다. Law Solver를 업데이트해 주세요.");
  }
  if (root.sessions.length > 100_000) {
    throw new DashboardBackupValidationError("풀이 세션 수가 허용 범위를 넘었습니다.");
  }
  const sessions = root.sessions.map(normalizeSession);
  if (new Set(sessions.map((session) => session.id)).size !== sessions.length) {
    throw new DashboardBackupValidationError("중복된 풀이 세션 ID가 있습니다.");
  }
  const subjects = normalizeSubjects(root.subjects);
  if (new Set(subjects.map((subject) => subject.id)).size !== subjects.length) {
    throw new DashboardBackupValidationError("중복된 과목 ID가 있습니다.");
  }
  const sessionIds = new Set(sessions.map((session) => session.id));
  const subjectIds = new Set(subjects.map((subject) => subject.id));
  const sessionSubjectMap: SessionSubjectMap = {};
  if (root.sessionSubjectMap !== undefined && !isRecord(root.sessionSubjectMap)) {
    throw new DashboardBackupValidationError("세션과 과목 연결 형식을 확인해 주세요.");
  }
  if (isRecord(root.sessionSubjectMap)) {
    for (const [sessionId, subjectId] of Object.entries(root.sessionSubjectMap)) {
      if (typeof subjectId === "string" && sessionIds.has(sessionId) && subjectIds.has(subjectId)) {
        sessionSubjectMap[sessionId] = subjectId;
      }
    }
  }
  const normalizedExportedAt = validDate(root.exported_at, exportedAt);
  const dataModifiedAt = validDate(root.data_modified_at, normalizedExportedAt);
  return {
    app: "law-solver",
    version: DASHBOARD_BACKUP_VERSION,
    exported_at: normalizedExportedAt,
    data_modified_at: dataModifiedAt,
    sessions,
    subjects,
    sessionSubjectMap,
  };
}

export function parseDashboardBackupJson(json: string): DashboardBackupData {
  try {
    return parseDashboardBackup(JSON.parse(json) as unknown);
  } catch (error) {
    if (error instanceof DashboardBackupValidationError) throw error;
    throw new DashboardBackupValidationError("JSON 파일이 손상되었거나 읽을 수 없는 형식입니다.");
  }
}

export function getDashboardBackupStats(data: DashboardBackupData) {
  return {
    subjectCount: data.subjects.length,
    sessionCount: data.sessions.length,
    questionCount: data.sessions.reduce((total, session) => total + session.questions.length, 0),
    dataModifiedAt: data.data_modified_at,
  };
}
