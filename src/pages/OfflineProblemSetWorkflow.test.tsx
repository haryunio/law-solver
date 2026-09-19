// @vitest-environment jsdom

import "fake-indexeddb/auto";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { Link, MemoryRouter, Route, Routes, useParams } from "react-router-dom";
import { getOfflineProblemSetPath } from "../lib/offlineSession";
import { initializeOfflineData, offlineDataStorage, useTestStore } from "../store/useTestStore";
import type { ParsedQuestion } from "../types/test";
import { DashboardPage } from "./DashboardPage";
import { OfflineProblemSetSessionsPage } from "./OfflineProblemSetSessionsPage";
import { SubjectListPage } from "./SubjectListPage";

const question: ParsedQuestion = { id: "q-1", no: 1, question: "가상 문제", answer: "O", my_answer: "", originalRow: {} };

beforeAll(async () => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  await initializeOfflineData();
});
beforeEach(() => {
  useTestStore.setState({ problemSets: [], sessions: [], subjects: [], dataUpdatedAt: "2026-09-20T00:00:00Z" });
});
afterEach(async () => { cleanup(); await offlineDataStorage.flush(); });
afterAll(async () => { await offlineDataStorage.close(); vi.unstubAllGlobals(); });

function SolveDestination() {
  const { sessionId } = useParams();
  const session = useTestStore((state) => state.sessions.find((item) => item.id === sessionId));
  const problem = useTestStore((state) => state.problemSets.find((item) => item.id === session?.problem_set_id));
  return <><h1>풀이 화면 도착</h1><Link to={getOfflineProblemSetPath(problem?.id ?? "", problem?.subject_id)}>세션 목록으로 돌아가기</Link></>;
}
function renderRoute(path: string) {
  return render(<MemoryRouter initialEntries={[path]}><Routes>
    <Route path="/dashboard" element={<SubjectListPage />} />
    <Route path="/dashboard/:subjectId" element={<DashboardPage />} />
    <Route path="/dashboard/:subjectId/problem-sets/:problemSetId" element={<OfflineProblemSetSessionsPage />} />
    <Route path="/solve/:sessionId" element={<SolveDestination />} />
  </Routes></MemoryRouter>);
}
function seed() {
  const subjectId = useTestStore.getState().createSubject("민법");
  const otherSubjectId = useTestStore.getState().createSubject("헌법");
  const problemSetId = useTestStore.getState().createProblemSet({ title: "민법 문제", type: "OX", questions: [question], subjectId });
  return { subjectId, otherSubjectId, problemSetId };
}

async function openNewSession(title: string, random = false) {
  fireEvent.click(screen.getByRole("button", { name: "새로 문제 풀이 시작하기" }));
  const dialog = screen.getByRole("dialog", { name: "새 풀이 세션" });
  fireEvent.change(within(dialog).getByLabelText("세션 제목"), { target: { value: title } });
  if (random) {
    fireEvent.click(within(dialog).getByRole("button", { name: "풀이 순서 선택" }));
    fireEvent.click(within(dialog).getByRole("option", { name: "전체 무작위 풀기" }));
  }
  fireEvent.click(within(dialog).getByRole("button", { name: "세션 만들고 시작" }));
  await screen.findByRole("heading", { name: "풀이 화면 도착" });
}

describe("offline problem and session workflow", () => {
  it("registers multiple CSV files in the current subject and stays on its problem list", async () => {
    const subjectId = useTestStore.getState().createSubject("민법");
    renderRoute(`/dashboard/${subjectId}`);
    fireEvent.click(screen.getByRole("button", { name: "새 문제 등록" }));
    const files = [
      ["민법_OX.csv", "번호,문제,정답\n1,가상 문제,O"],
      ["민법_단답.csv", "번호,문제,정답\n1,가상 문제,채권"],
    ].map(([name, contents]) => {
      const csv = new TextEncoder().encode(contents);
      const file = new File([csv], name!, { type: "text/csv" });
      Object.defineProperty(file, "arrayBuffer", { value: async () => csv.buffer });
      return file;
    });
    fireEvent.change(screen.getByLabelText("CSV 파일"), { target: { files } });
    const confirmation = screen.getByRole("dialog", { name: "문제를 일괄 등록할까요?" });
    expect(useTestStore.getState().problemSets).toHaveLength(0);
    fireEvent.click(within(confirmation).getByRole("button", { name: "일괄 등록" }));
    await screen.findByRole("heading", { name: "민법 OX" });
    expect(screen.getByRole("heading", { name: "민법 단답" })).toBeTruthy();
    expect(screen.getByText("문제 2개를 등록했습니다.")).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(useTestStore.getState().problemSets.map(({ subject_id, type }) => [subject_id, type])).toEqual([
      [subjectId, "OX"], [subjectId, "short"],
    ]);
    expect(useTestStore.getState().sessions).toHaveLength(0);
  });

  it("registers CSV without a session, then creates independent sessions with their own title and order", async () => {
    const subjectId = useTestStore.getState().createSubject("민법");
    renderRoute(`/dashboard/${subjectId}`);
    fireEvent.click(screen.getByRole("button", { name: "새 문제 등록" }));
    const dialog = screen.getByRole("dialog", { name: "새 문제 등록" });
    const csv = new TextEncoder().encode("번호,문제,정답\n1,가상 문제,O");
    const file = new File([csv], "민법_기출-2026.csv", { type: "text/csv" });
    Object.defineProperty(file, "arrayBuffer", { value: async () => csv.buffer });
    fireEvent.change(within(dialog).getByLabelText("CSV 파일"), { target: { files: [file] } });
    await waitFor(() => expect(within(dialog).getByRole("button", { name: "문제 등록" }).hasAttribute("disabled")).toBe(false));
    expect((within(dialog).getByLabelText("문제 제목") as HTMLInputElement).value).toBe("민법 기출 2026");
    expect(within(dialog).queryByRole("button", { name: "풀이 순서 선택" })).toBeNull();
    fireEvent.click(within(dialog).getByRole("button", { name: "문제 등록" }));
    await screen.findByText("아직 풀이 세션이 없습니다.");
    expect(useTestStore.getState().problemSets).toHaveLength(1);
    expect(useTestStore.getState().sessions).toHaveLength(0);

    await openNewSession("첫 연습");
    fireEvent.click(screen.getByRole("link", { name: "세션 목록으로 돌아가기" }));
    await screen.findByRole("heading", { name: "첫 연습" });
    expect(screen.getByTitle(/마지막 풀이 기록 없음/)).toBeTruthy();
    await openNewSession("두 번째 연습", true);
    const state = useTestStore.getState();
    expect(state.problemSets).toHaveLength(1);
    expect(state.sessions).toHaveLength(2);
    expect(state.sessions.find((session) => session.title === "첫 연습")?.order_mode).toBe("number");
    expect(state.sessions.find((session) => session.title === "두 번째 연습")?.order_mode).toBe("random");
    expect(new Set(state.sessions.map((session) => session.problem_set_id)).size).toBe(1);
  });

  it("moves a problem together with its sessions and redirects an old subject URL", async () => {
    const { subjectId, otherSubjectId, problemSetId } = seed();
    const sessionId = useTestStore.getState().createSession({ problemSetId, title: "기존 풀이" });
    renderRoute(`/dashboard/${subjectId}`);
    fireEvent.click(screen.getByRole("button", { name: "민법 문제 메뉴 열기" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "편집" }));
    const dialog = screen.getByRole("dialog", { name: "문제 편집" });
    fireEvent.click(within(dialog).getByRole("button", { name: "과목 선택" }));
    fireEvent.click(within(dialog).getByRole("option", { name: "헌법" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "저장" }));
    expect(screen.queryByRole("heading", { name: "민법 문제" })).toBeNull();
    expect(useTestStore.getState().problemSets[0]?.subject_id).toBe(otherSubjectId);
    expect(useTestStore.getState().sessions[0]?.id).toBe(sessionId);
    cleanup();
    renderRoute(getOfflineProblemSetPath(problemSetId, subjectId));
    const back = await screen.findByRole("link", { name: "문제 목록으로" });
    expect(back.getAttribute("href")).toBe(`/dashboard/${otherSubjectId}`);
    expect(screen.getByRole("heading", { name: "기존 풀이" })).toBeTruthy();
  });

  it("renames the selected session through its menu without changing its problem or another session", () => {
    const { subjectId, problemSetId } = seed();
    const selectedId = useTestStore.getState().createSession({ problemSetId, title: "이름을 바꿀 세션" });
    const otherId = useTestStore.getState().createSession({ problemSetId, title: "기존 세션" });
    useTestStore.getState().updateAnswer(selectedId, question.id, "O");
    const before = useTestStore.getState();
    const selectedBefore = before.sessions.find((session) => session.id === selectedId)!;
    const otherBefore = before.sessions.find((session) => session.id === otherId)!;

    renderRoute(getOfflineProblemSetPath(problemSetId, subjectId));
    fireEvent.click(screen.getByRole("button", { name: "이름을 바꿀 세션 메뉴 열기" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "이름 변경" }));
    const dialog = screen.getByRole("dialog", { name: "세션 이름 변경" });
    const input = within(dialog).getByLabelText("세션 제목") as HTMLInputElement;
    expect(input.value).toBe("이름을 바꿀 세션");
    fireEvent.change(input, { target: { value: "기말고사 대비 연습" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "저장" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("heading", { name: "기말고사 대비 연습" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "기존 세션" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "이름을 바꿀 세션" })).toBeNull();
    const after = useTestStore.getState();
    expect(after.sessions).toHaveLength(2);
    expect(after.sessions.find((session) => session.id === selectedId)).toEqual({ ...selectedBefore, title: "기말고사 대비 연습" });
    expect(after.sessions.find((session) => session.id === otherId)).toEqual(otherBefore);
    expect(after.problemSets).toEqual(before.problemSets);
  });

  it("deletes only one session before deleting a problem and all its remaining sessions", async () => {
    const { subjectId, problemSetId } = seed();
    useTestStore.getState().createSession({ problemSetId, title: "삭제할 세션" });
    useTestStore.getState().createSession({ problemSetId, title: "남겨둘 세션" });
    renderRoute(getOfflineProblemSetPath(problemSetId, subjectId));
    fireEvent.click(screen.getByRole("button", { name: "삭제할 세션 메뉴 열기" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "삭제" }));
    let dialog = screen.getByRole("dialog", { name: "이 풀이 세션을 삭제할까요?" });
    expect(within(dialog).getByText(/등록한 문제와 다른 풀이 세션은 유지됩니다/)).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button", { name: "세션 삭제" }));
    expect(useTestStore.getState().problemSets).toHaveLength(1);
    expect(useTestStore.getState().sessions.map((session) => session.title)).toEqual(["남겨둘 세션"]);
    fireEvent.click(screen.getByRole("link", { name: "문제 목록으로" }));
    fireEvent.click(screen.getByRole("button", { name: "민법 문제 메뉴 열기" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "삭제" }));
    dialog = screen.getByRole("dialog", { name: "이 문제를 삭제할까요?" });
    expect(within(dialog).getByText(/풀이 세션 1개가 함께 삭제됩니다/)).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button", { name: "문제 삭제" }));
    expect(useTestStore.getState().problemSets).toHaveLength(0);
    expect(useTestStore.getState().sessions).toHaveLength(0);
  });

  it("counts source problems independently from the number of sessions on a subject card", () => {
    const { problemSetId } = seed();
    useTestStore.getState().createSession({ problemSetId, title: "풀이 하나" });
    useTestStore.getState().createSession({ problemSetId, title: "풀이 둘" });
    renderRoute("/dashboard");
    const card = screen.getByRole("heading", { name: "민법" }).closest("a")!;
    expect(card.textContent).toMatch(/문제\s*1개/);
    expect(within(card).getByText("풀이 중").nextElementSibling?.textContent).toBe("2");
  });
});
