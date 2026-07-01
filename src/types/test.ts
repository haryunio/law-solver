export type TestType = "OX" | "5-choice" | "short";
export type SessionStatus = "in-progress" | "completed";
export type SolveOrder = "number" | "chapter-random" | "random";
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
}

export type SessionSubjectMap = Record<TestSession["id"], Subject["id"]>;

export interface DashboardBackupData {
  app: "law-solver";
  version: 2;
  exported_at: string;
  sessions: TestSession[];
  subjects: Subject[];
  sessionSubjectMap: SessionSubjectMap;
}
