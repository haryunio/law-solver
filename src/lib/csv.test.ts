import { describe, expect, it } from "vitest";
import { buildSessionExportCsv, parseCsvByType, readCsvFileText } from "./csv";
import { TestSession } from "../types/test";

describe("parseCsvByType", () => {
  it("parses OX csv rows", () => {
    const csv = [
      "번호,문제,정답,해설,출처",
      "1,계약은 청약과 승낙으로 성립한다,O,민법 기본 원칙,기본서",
      "2,채무불이행은 언제나 해제를 허용한다,X,사정에 따라 제한된다,판례",
    ].join("\n");

    const parsed = parseCsvByType(csv, "OX");
    expect(parsed).toHaveLength(2);
    const first = parsed[0];
    const second = parsed[1];
    expect(first).toBeDefined();
    expect(second).toBeDefined();
    if (!first || !second) return;
    expect(first.answer).toBe("O");
    expect(second.answer).toBe("X");
    expect(first.my_answer).toBe("");
  });

  it("parses chapter field when header exists", () => {
    const csv = [
      "번호,챕터,문제,정답",
      "1,계약총칙,계약은 청약과 승낙으로 성립한다,O",
    ].join("\n");

    const parsed = parseCsvByType(csv, "OX");
    const first = parsed[0];
    expect(first).toBeDefined();
    if (!first) return;
    expect(first.chapter).toBe("계약총칙");
  });

  it("parses 5-choice csv rows with 선택지 header", () => {
    const csv = [
      "번호,문제,선택지1,선택지2,선택지3,선택지4,선택지5,정답,해설,출처",
      "1,다음 중 판례의 입장으로 옳은 것은?,갑,을,병,정,무,3,핵심 해설,판례집",
    ].join("\n");

    const parsed = parseCsvByType(csv, "5-choice");
    expect(parsed).toHaveLength(1);
    const first = parsed[0];
    expect(first).toBeDefined();
    if (!first) return;
    expect(first.choices?.[2]).toBe("병");
    expect(first.answer).toBe("3");
  });
});

describe("buildSessionExportCsv", () => {
  it("adds my_answer column to export", () => {
    const csv = "번호,문제,정답\n1,테스트 문제,O";
    const questions = parseCsvByType(csv, "OX");
    const first = questions[0];
    expect(first).toBeDefined();
    if (!first) return;
    first.my_answer = "X";

    const session: TestSession = {
      id: "session-1",
      title: "테스트",
      type: "OX",
      total_questions: 1,
      solved_questions: 1,
      score: 0,
      elapsed_time: 12,
      created_at: new Date().toISOString(),
      status: "completed",
      questions,
    };

    const exported = buildSessionExportCsv(session);
    expect(exported).toContain("my_answer");
    expect(exported).toContain("X");
  });
});

describe("readCsvFileText", () => {
  it("reads UTF-8 BOM csv without mojibake", async () => {
    const content = "\uFEFF번호,문제,정답\n1,테스트,O";
    const file = new File([content], "sample.csv", { type: "text/csv" });
    const text = await readCsvFileText(file);
    expect(text.startsWith("번호,문제,정답")).toBe(true);
    expect(text).toContain("테스트");
  });
});
