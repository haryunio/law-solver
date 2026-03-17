export type TestType = "OX" | "5-choice";
export type SessionStatus = "in-progress" | "completed";
export type SolveOrder = "number" | "chapter-random" | "random";

export type OXAnswer = "O" | "X";
export type ChoiceAnswer = "1" | "2" | "3" | "4" | "5";
export type AnswerValue = OXAnswer | ChoiceAnswer;

export interface ParsedQuestion {
  id: string;
  no: number;
  chapter?: string;
  question: string;
  choices?: [string, string, string, string, string];
  answer: AnswerValue;
  explanation?: string;
  source?: string;
  my_answer: AnswerValue | "";
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
