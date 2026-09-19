// @vitest-environment jsdom
import "fake-indexeddb/auto";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useParams } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CbtSolveScreen } from "../components/cbt/CbtSolveScreen";
import { offlineDataStorage, useTestStore } from "../store/useTestStore";
import { getOfflineProblemSetPath } from "../lib/offlineSession";
import { ResultPage } from "./ResultPage";

beforeEach(() => {
  useTestStore.setState({ problemSets: [], sessions: [], subjects: [], dataUpdatedAt: new Date().toISOString() });
  Element.prototype.scrollIntoView = vi.fn();
  Element.prototype.scrollTo = vi.fn();
  vi.stubGlobal("ResizeObserver", class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
});
afterEach(async () => {
  cleanup();
  await offlineDataStorage.flush().catch(() => undefined);
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function createExample() {
  const store = useTestStore.getState();
  const subjectId = store.createSubject("예시 과목");
  const problemSetId = store.createProblemSet({ title: "예시 문제", type: "OX", subjectId, questions: [
    { id: "q1", no: 1, question: "첫 번째 예시", answer: "O", my_answer: "", originalRow: {} },
    { id: "q2", no: 2, question: "두 번째 예시", answer: "X", my_answer: "", originalRow: {} },
  ] });
  return { subjectId, problemSetId, sessionId: store.createSession({ problemSetId, orderMode: "number" }) };
}

function SolveDestination() {
  return <p>풀이 이동: {useParams().sessionId}</p>;
}

describe("normalized offline session adapters", () => {
  it("uses the existing CBT to update only the current session and records its last play time", () => {
    const { sessionId, problemSetId } = createExample();
    const secondId = useTestStore.getState().createSession({ problemSetId });
    render(<MemoryRouter><CbtSolveScreen sessionId={sessionId} /></MemoryRouter>);
    expect(screen.getByText("첫 번째 예시")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "O" }));
    const state = useTestStore.getState();
    expect(state.getSessionById(sessionId)?.questions[0]?.my_answer).toBe("O");
    expect(state.getSessionById(secondId)?.questions[0]?.my_answer).toBe("");
    expect(state.sessions.find((item) => item.id === sessionId)?.last_played_at).toEqual(expect.any(String));
    expect(state.problemSets[0]?.questions[0]).not.toHaveProperty("my_answer");
  });

  it("creates an incorrect-question retry from results without creating another problem", async () => {
    const { subjectId, problemSetId, sessionId } = createExample();
    const store = useTestStore.getState();
    store.updateAnswer(sessionId, "q1", "O");
    store.updateAnswer(sessionId, "q2", "O");
    store.updateWrongNote(sessionId, "q2", "원본 노트");
    store.toggleBookmark(sessionId, "q2");
    store.submitSession(sessionId);
    render(<MemoryRouter initialEntries={[`/result/${sessionId}`]}><Routes>
      <Route path="/result/:sessionId" element={<ResultPage />} />
      <Route path="/solve/:sessionId" element={<SolveDestination />} />
    </Routes></MemoryRouter>);
    expect(screen.getByRole("link", { name: "풀이 세션으로" }).getAttribute("href"))
      .toBe(getOfflineProblemSetPath(problemSetId, subjectId));
    fireEvent.click(screen.getByRole("button", { name: "오답 다시 풀기" }));
    fireEvent.click(screen.getByRole("button", { name: "오답 풀기 시작" }));
    await waitFor(() => expect(screen.getByText(/^풀이 이동:/)).toBeTruthy());
    const state = useTestStore.getState();
    expect(state.problemSets).toHaveLength(1);
    expect(state.sessions).toHaveLength(2);
    const retry = state.sessions.find((item) => item.id !== sessionId)!;
    expect(retry).toMatchObject({ problem_set_id: problemSetId, source_session_id: sessionId, question_order: ["q2"], retry_mode: "incorrect" });
    expect(state.getSessionById(retry.id)?.questions[0]).toMatchObject({ my_answer: "", wrong_note: "", bookmark: false });
    expect(state.getSessionById(sessionId)?.questions[1]).toMatchObject({ my_answer: "O", wrong_note: "원본 노트", bookmark: true });
  });
});
