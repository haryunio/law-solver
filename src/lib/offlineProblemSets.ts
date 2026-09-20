import type { OfflineProblemSet, OfflineQuestion, OfflineSession, OfflineSessionResponse, ParsedQuestion, TestSession } from "../types/test";

export const emptyOfflineResponse = (): OfflineSessionResponse => ({ answer: "", wrong_note: "", bookmark: false });

/** Keep source content separate from each attempt's learning records. */
export function toOfflineQuestion(question: ParsedQuestion): OfflineQuestion {
  const { my_answer: _answer, wrong_note: _note, bookmark: _bookmark, ...source } = question;
  return {
    ...source,
    ...(source.boxes ? { boxes: [...source.boxes] } : {}),
    ...(source.choices ? { choices: [...source.choices] as OfflineQuestion["choices"] } : {}),
    originalRow: { ...source.originalRow },
  };
}

/** Build the shared CBT view without persisting a second copy of the questions. */
export function materializeOfflineSession(problemSet: OfflineProblemSet, session: OfflineSession): TestSession {
  if (session.problem_set_id !== problemSet.id) throw new Error("풀이 세션에 연결된 문제를 확인해 주세요.");
  const questions = new Map(problemSet.questions.map((question) => [question.id, question]));
  return {
    id: session.id,
    title: session.title,
    type: problemSet.type,
    order_mode: session.order_mode,
    total_questions: session.total_questions,
    solved_questions: session.solved_questions,
    score: session.score,
    elapsed_time: session.elapsed_time,
    created_at: session.created_at,
    status: session.status,
    questions: session.question_order.map((id) => {
      const question = questions.get(id);
      const response = Object.prototype.hasOwnProperty.call(session.responses, id) ? session.responses[id] : undefined;
      if (!question || !response) throw new Error("풀이 세션의 문항과 답안 연결을 확인해 주세요.");
      return {
        ...question,
        ...(question.boxes ? { boxes: [...question.boxes] } : {}),
        ...(question.choices ? { choices: [...question.choices] as ParsedQuestion["choices"] } : {}),
        originalRow: { ...question.originalRow },
        my_answer: response.answer,
        wrong_note: response.wrong_note,
        bookmark: response.bookmark,
      };
    }),
  };
}
