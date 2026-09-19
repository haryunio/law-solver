export type TestType = "OX" | "5-choice" | "short";
export type SessionStatus = "in-progress" | "completed";
export type SolveOrder = "number" | "chapter-random" | "random";
export type SubjectCoverPalette = "warm" | "green" | "blue" | "purple" | "gray";
export const NO_SUBJECT_ID = "__none__";

export type OXAnswer = "O" | "X";
export type ChoiceAnswer = "1" | "2" | "3" | "4" | "5";
export type AnswerValue = OXAnswer | ChoiceAnswer | string;

export interface ParsedQuestion {
  id: string;
  no: number;
  chapter?: string;
  question: string;
  boxes?: string[];
  choices?: [string, string, string, string, string];
  answer: AnswerValue;
  explanation?: string;
  source?: string;
  my_answer: AnswerValue | "";
  wrong_note?: string;
  bookmark?: boolean;
  originalRow: Record<string, string>;
}

export type OfflineQuestion = Omit<ParsedQuestion, "my_answer" | "wrong_note" | "bookmark">;

export interface OfflineProblemSet {
  id: string;
  title: string;
  type: TestType;
  subject_id: string | null;
  created_at: string;
  updated_at: string;
  questions: OfflineQuestion[];
}

export interface OfflineSessionResponse {
  answer: string;
  wrong_note: string;
  bookmark: boolean;
}

export type OfflineRetryMode = "all" | "incorrect" | "bookmarked";

export interface OfflineSession {
  id: string;
  problem_set_id: string;
  title: string;
  order_mode: SolveOrder;
  total_questions: number;
  solved_questions: number;
  score: number;
  elapsed_time: number;
  created_at: string;
  last_played_at: string | null;
  submitted_at: string | null;
  status: SessionStatus;
  question_order: string[];
  responses: Record<string, OfflineSessionResponse>;
  attempt_number: number;
  source_session_id: string | null;
  retry_mode: OfflineRetryMode | null;
}

export interface TestSession {
  id: string;
  title: string;
  type: TestType;
  order_mode?: SolveOrder;
  total_questions: number;
  solved_questions: number;
  score: number;
  elapsed_time: number;
  created_at: string;
  status: SessionStatus;
  questions: ParsedQuestion[];
}

export interface Subject {
  id: string;
  name: string;
  created_at: string;
  cover_palette?: SubjectCoverPalette;
}

export interface DashboardBackupData {
  app: "law-solver";
  version: 4;
  exported_at: string;
  data_modified_at: string;
  problemSets: OfflineProblemSet[];
  sessions: OfflineSession[];
  subjects: Subject[];
}
