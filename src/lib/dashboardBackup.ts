import {
  NO_SUBJECT_ID,
  type DashboardBackupData,
  type OfflineProblemSet,
  type OfflineSession,
  type OfflineSessionResponse,
  type ParsedQuestion,
  type Subject,
  type SubjectCoverPalette,
  type TestType,
} from "../types/test";
import { toOfflineQuestion } from "./offlineProblemSets";

export const DASHBOARD_BACKUP_VERSION = 4 as const;

export class DashboardBackupValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DashboardBackupValidationError";
  }
}

export function validateDashboardBackupVersion(version: unknown): void {
  if (version === undefined) return;
  if (typeof version !== "number" || !Number.isSafeInteger(version) || version < 0) {
    throw new DashboardBackupValidationError("백업 버전 형식을 확인해 주세요.");
  }
  if (version > DASHBOARD_BACKUP_VERSION) {
    throw new DashboardBackupValidationError("더 최신 버전에서 만든 백업입니다. Law Solver를 업데이트해 주세요.");
  }
}

const invalid = (label: string): never => {
  throw new DashboardBackupValidationError(`${label} 형식을 확인해 주세요.`);
};
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const validDate = (value: unknown, fallback: string): string =>
  typeof value === "string" && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : fallback;
const date = (value: unknown, label: string): string => {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) return invalid(label);
  return new Date(value).toISOString();
};
const nullableDate = (value: unknown, label: string): string | null => value === null ? null : date(value, label);
const text = (value: unknown, label: string, maxLength = 1_000_000): string => {
  if (typeof value !== "string" || value.length > maxLength) return invalid(label);
  return value;
};
const requiredString = (value: unknown, label: string, maxLength = 100_000): string => {
  const result = text(value, label, maxLength);
  return result || invalid(label);
};
const optionalString = (value: unknown, maxLength = 1_000_000): string | undefined =>
  value === undefined || value === null ? undefined : text(value, "문제 텍스트", maxLength);
const nonNegativeInteger = (value: unknown, fallback = 0): number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : fallback;
const integer = (value: unknown, label: string, minimum = 0): number => {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < minimum) return invalid(label);
  return value;
};
const uniqueIds = (items: { id: string }[], label: string) => {
  if (new Set(items.map((item) => item.id)).size !== items.length) {
    throw new DashboardBackupValidationError(`중복된 ${label} ID가 있습니다.`);
  }
};
const palettes: SubjectCoverPalette[] = ["warm", "green", "blue", "purple", "gray"];
const types: TestType[] = ["OX", "5-choice", "short"];

function normalizeQuestion(value: unknown, index: number, strict = false): ParsedQuestion {
  if (!isRecord(value)) return invalid(`${index + 1}번째 문항`);
  const choices = value.choices;
  if (choices !== undefined && (!Array.isArray(choices) || choices.length !== 5 || choices.some((choice) => typeof choice !== "string"))) {
    return invalid(`${index + 1}번째 문항의 선택지`);
  }
  const boxes = value.boxes;
  if (boxes !== undefined && (!Array.isArray(boxes) || boxes.some((box) => typeof box !== "string"))) {
    return invalid(`${index + 1}번째 문항의 박스형 지문`);
  }
  if (strict && (!isRecord(value.originalRow) || Object.values(value.originalRow).some((cell) => typeof cell !== "string"))) {
    return invalid(`${index + 1}번째 문항의 원본 행`);
  }
  const answer = requiredString(value.answer, `${index + 1}번째 문항의 정답`);
  // CSV numbering may include negative values or decimals; it is not an array index.
  const no = typeof value.no === "number" && Number.isFinite(value.no)
    ? value.no : strict ? invalid("문항 번호") : index + 1;
  return {
    id: requiredString(value.id, `${index + 1}번째 문항 ID`, 200),
    no,
    chapter: optionalString(value.chapter, 10_000),
    question: requiredString(value.question, `${index + 1}번째 문항 본문`, 1_000_000),
    boxes: boxes === undefined ? undefined : [...boxes as string[]],
    choices: choices === undefined ? undefined : [...choices as string[]] as ParsedQuestion["choices"],
    answer,
    explanation: optionalString(value.explanation),
    source: optionalString(value.source, 100_000),
    my_answer: typeof value.my_answer === "string" ? value.my_answer : "",
    wrong_note: optionalString(value.wrong_note),
    bookmark: typeof value.bookmark === "boolean" ? value.bookmark : false,
    originalRow: isRecord(value.originalRow)
      ? Object.fromEntries(Object.entries(value.originalRow).filter((entry): entry is [string, string] => typeof entry[1] === "string")) : {},
  };
}

function normalizeSubjects(value: unknown, strict: boolean): Subject[] {
  if (value === undefined && !strict) return [];
  if (!Array.isArray(value)) return invalid("과목 목록");
  const subjects = value.map((subject, index) => {
    if (!isRecord(subject)) return invalid(`${index + 1}번째 과목`);
    const id = requiredString(subject.id, `${index + 1}번째 과목 ID`, 200);
    if (id === NO_SUBJECT_ID) return invalid("과목 ID");
    if (strict && subject.cover_palette !== undefined && !palettes.includes(subject.cover_palette as SubjectCoverPalette)) return invalid("과목 색상");
    return {
      id,
      name: requiredString(subject.name, `${index + 1}번째 과목 이름`, 10_000),
      created_at: strict ? date(subject.created_at, "과목 등록일") : validDate(subject.created_at, new Date(0).toISOString()),
      cover_palette: palettes.includes(subject.cover_palette as SubjectCoverPalette) ? subject.cover_palette as SubjectCoverPalette : undefined,
    };
  });
  uniqueIds(subjects, "과목");
  return subjects;
}

function normalizeProblemSet(value: unknown, subjectIds: Set<string>): OfflineProblemSet {
  if (!isRecord(value) || !Array.isArray(value.questions)) return invalid("문제");
  if (!types.includes(value.type as TestType)) return invalid("문제 유형");
  if (value.subject_id !== null && (typeof value.subject_id !== "string" || !subjectIds.has(value.subject_id))) return invalid("문제와 과목 연결");
  const questions = value.questions.map((question, index) => {
    if (isRecord(question) && ["my_answer", "wrong_note", "bookmark"].some((key) => key in question)) return invalid("원본 문항에 포함된 풀이 기록");
    return toOfflineQuestion(normalizeQuestion(question, index, true));
  });
  uniqueIds(questions, "문항");
  return {
    id: requiredString(value.id, "문제 ID", 200),
    title: requiredString(value.title, "문제 제목", 10_000),
    type: value.type as TestType,
    subject_id: value.subject_id,
    created_at: date(value.created_at, "문제 등록일"),
    updated_at: date(value.updated_at, "문제 수정일"),
    questions,
  };
}

function normalizeOfflineSession(value: unknown, problems: Map<string, OfflineProblemSet>): OfflineSession {
  if (!isRecord(value)) return invalid("풀이 세션");
  const problemSetId = requiredString(value.problem_set_id, "풀이 세션의 문제 ID", 200);
  const problem = problems.get(problemSetId);
  if (!problem) return invalid("풀이 세션과 문제 연결");
  if (value.status !== "in-progress" && value.status !== "completed") return invalid("풀이 세션 상태");
  if (value.order_mode !== "number" && value.order_mode !== "random" && value.order_mode !== "chapter-random") return invalid("문항 순서");
  if (!Array.isArray(value.question_order) || value.question_order.some((id) => typeof id !== "string")) return invalid("풀이 문항 목록");
  const order = value.question_order as string[];
  const questionIds = new Set(problem.questions.map((question) => question.id));
  if (new Set(order).size !== order.length || order.some((id) => !questionIds.has(id))) return invalid("풀이 세션의 문항 연결");
  if (!isRecord(value.responses)) return invalid("풀이 답안");
  const entries = Object.entries(value.responses);
  const orderIds = new Set(order);
  if (entries.length !== order.length || entries.some(([id]) => !orderIds.has(id))) return invalid("풀이 문항과 답안 연결");
  const responses = Object.fromEntries(entries.map(([id, response]): [string, OfflineSessionResponse] => {
    if (!isRecord(response) || typeof response.bookmark !== "boolean") return invalid("풀이 답안");
    return [id, { answer: text(response.answer, "선택한 답안"), wrong_note: text(response.wrong_note, "오답 노트"), bookmark: response.bookmark }];
  }));
  const total = integer(value.total_questions, "전체 문항 수");
  const solved = integer(value.solved_questions, "응답 문항 수");
  if (total !== order.length || solved !== Object.values(responses).filter((response) => response.answer !== "").length) return invalid("풀이 문항 수");
  if (typeof value.score !== "number" || !Number.isFinite(value.score) || value.score < 0 || value.score > 100) return invalid("풀이 점수");
  if (value.retry_mode !== null && value.retry_mode !== "all" && value.retry_mode !== "incorrect" && value.retry_mode !== "bookmarked") return invalid("재풀이 방식");
  return {
    id: requiredString(value.id, "풀이 세션 ID", 200),
    problem_set_id: problemSetId,
    title: requiredString(value.title, "풀이 세션 제목", 10_000),
    order_mode: value.order_mode,
    total_questions: total,
    solved_questions: solved,
    score: value.score,
    elapsed_time: integer(value.elapsed_time, "풀이 시간"),
    created_at: date(value.created_at, "세션 생성일"),
    last_played_at: nullableDate(value.last_played_at, "최근 풀이일"),
    submitted_at: nullableDate(value.submitted_at, "제출일"),
    status: value.status,
    question_order: [...order],
    responses,
    attempt_number: integer(value.attempt_number, "풀이 회차", 1),
    source_session_id: value.source_session_id === null ? null : requiredString(value.source_session_id, "원본 세션 ID", 200),
    retry_mode: value.retry_mode,
  };
}

function migrateLegacy(root: Record<string, unknown>, subjects: Subject[]) {
  const subjectIds = new Set(subjects.map((subject) => subject.id));
  if (root.sessionSubjectMap !== undefined && !isRecord(root.sessionSubjectMap)) return invalid("세션과 과목 연결");
  const subjectMap = isRecord(root.sessionSubjectMap) ? root.sessionSubjectMap : {};
  const problemSets: OfflineProblemSet[] = [];
  const sessions: OfflineSession[] = (root.sessions as unknown[]).map((value, index) => {
    if (!isRecord(value) || !Array.isArray(value.questions)) return invalid(`${index + 1}번째 풀이 세션`);
    if (!types.includes(value.type as TestType)) return invalid(`${index + 1}번째 풀이 세션의 문제 유형`);
    if (value.status !== "in-progress" && value.status !== "completed") return invalid(`${index + 1}번째 풀이 세션 상태`);
    const questions = value.questions.map((question, questionIndex) => normalizeQuestion(question, questionIndex));
    uniqueIds(questions, "문항");
    const id = requiredString(value.id, "풀이 세션 ID", 200);
    const title = requiredString(value.title, "풀이 세션 제목", 10_000);
    const createdAt = validDate(value.created_at, new Date(0).toISOString());
    const subjectId = Object.prototype.hasOwnProperty.call(subjectMap, id) ? subjectMap[id] : null;
    problemSets.push({ id, title, type: value.type as TestType, subject_id: typeof subjectId === "string" && subjectIds.has(subjectId) ? subjectId : null,
      created_at: createdAt, updated_at: createdAt, questions: questions.map(toOfflineQuestion) });
    return {
      id, problem_set_id: id, title,
      order_mode: value.order_mode === "chapter-random" || value.order_mode === "random" ? value.order_mode : "number",
      total_questions: questions.length,
      solved_questions: questions.filter((question) => question.my_answer !== "").length,
      score: typeof value.score === "number" && Number.isFinite(value.score) ? Math.max(0, Math.min(100, value.score)) : 0,
      elapsed_time: nonNegativeInteger(value.elapsed_time),
      created_at: createdAt, last_played_at: null, submitted_at: null, status: value.status,
      question_order: questions.map((question) => question.id),
      responses: Object.fromEntries(questions.map((question) => [question.id, { answer: question.my_answer, wrong_note: question.wrong_note ?? "", bookmark: question.bookmark ?? false }])),
      attempt_number: 1, source_session_id: null, retry_mode: null,
    };
  });
  return { problemSets, sessions };
}

/** Shared validation boundary for persistence, file imports and decrypted cloud backups. */
export function parseDashboardBackup(value: unknown): DashboardBackupData {
  const root = Array.isArray(value) ? { sessions: value } : value;
  if (!isRecord(root) || !Array.isArray(root.sessions)) throw new DashboardBackupValidationError("올바른 Law Solver 백업 JSON이 아닙니다.");
  if (root.app !== undefined && root.app !== "law-solver") throw new DashboardBackupValidationError("다른 앱에서 만든 백업 파일은 불러올 수 없습니다.");
  validateDashboardBackupVersion(root.version);
  if (root.sessions.length > 100_000) return invalid("풀이 세션 수");
  const normalized = root.version === DASHBOARD_BACKUP_VERSION || root.problemSets !== undefined;
  const subjects = normalizeSubjects(root.subjects, normalized);
  let problemSets: OfflineProblemSet[];
  let sessions: OfflineSession[];
  if (normalized) {
    if (!Array.isArray(root.problemSets) || root.problemSets.length > 100_000) return invalid("문제 목록");
    const subjectIds = new Set(subjects.map((subject) => subject.id));
    problemSets = root.problemSets.map((problem) => normalizeProblemSet(problem, subjectIds));
    uniqueIds(problemSets, "문제");
    const problems = new Map(problemSets.map((problem) => [problem.id, problem]));
    sessions = root.sessions.map((session) => normalizeOfflineSession(session, problems));
    const sessionMap = new Map(sessions.map((session) => [session.id, session]));
    for (const session of sessions) {
      if (session.source_session_id === null) continue;
      const source = sessionMap.get(session.source_session_id);
      if (!source || source.id === session.id || source.problem_set_id !== session.problem_set_id || source.attempt_number >= session.attempt_number) return invalid("재풀이와 원본 세션 연결");
      const sourceIds = new Set(source.question_order);
      if (session.question_order.some((id) => !sourceIds.has(id))) return invalid("재풀이 문항 연결");
    }
  } else {
    ({ problemSets, sessions } = migrateLegacy(root, subjects));
  }
  uniqueIds(sessions, "풀이 세션");
  const exportedAt = validDate(root.exported_at, new Date().toISOString());
  return {
    app: "law-solver", version: DASHBOARD_BACKUP_VERSION, exported_at: exportedAt,
    data_modified_at: validDate(root.data_modified_at ?? root.dataUpdatedAt ?? root.dataModifiedAt, exportedAt),
    problemSets, sessions, subjects,
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
    problemSetCount: data.problemSets.length,
    sessionCount: data.sessions.length,
    questionCount: data.problemSets.reduce((total, problem) => total + problem.questions.length, 0),
    dataModifiedAt: data.data_modified_at,
  };
}
