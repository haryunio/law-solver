import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import Papa from "papaparse";
import {
  buildSessionExportCsv,
  buildWrongNoteCsv,
  buildWrongQuestionsOnlyCsv,
  createSessionTitleFromFileName,
  inferTestTypeFromCsv,
  parseCsvByType,
  readCsvFileText,
} from "./csv";
import { TestSession, TestType } from "../types/test";

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

  it.each<{ type: TestType; csv: string; answer: string }>([
    { type: "OX", csv: "번호,챕터,문제,정답,메모\n1,총칙,가상 문제,O,개인 메모", answer: "O" },
    { type: "short", csv: "번호,챕터,문제,정답,메모\n1,총칙,가상 문제,계약,개인 메모", answer: "계약" },
    { type: "5-choice", csv: "번호,챕터,문제,선택지1,선택지2,선택지3,선택지4,선택지5,정답,메모\n1,총칙,가상 문제,갑,을,병,정,무,0,개인 메모", answer: "0" },
  ])("does not treat other named columns as optional metadata for $type", ({ type, csv, answer }) => {
    const question = parseCsvByType(csv, type)[0];
    expect(question).toMatchObject({ chapter: "총칙", question: "가상 문제", answer, explanation: "", source: "" });
  });

  it("reads named optional metadata independently of column order", () => {
    const csv = "출처(optional),챕터,정답,문항,번호,해설(optional)\n참고 자료,총칙,X,가상 문제,1,실제 해설";
    expect(parseCsvByType(csv, "OX")[0]).toMatchObject({
      chapter: "총칙", question: "가상 문제", answer: "X", explanation: "실제 해설", source: "참고 자료",
    });
  });

  it.each<{ type: TestType; csv: string }>([
    { type: "OX", csv: "a,b,c,d,e\n1,가상 문제,O,레거시 해설,레거시 출처" },
    { type: "short", csv: "a,b,c,d,e\n1,가상 문제,계약,레거시 해설,레거시 출처" },
    { type: "5-choice", csv: "a,b,c,d,e,f,g,h,i,j\n1,가상 문제,갑,을,병,정,무,3,레거시 해설,레거시 출처" },
  ])("preserves positional metadata for unknown legacy headers in $type", ({ type, csv }) => {
    expect(parseCsvByType(csv, type)[0]).toMatchObject({ question: "가상 문제", explanation: "레거시 해설", source: "레거시 출처" });
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

  it("preserves line breaks inside a quoted explanation cell", () => {
    const csv = [
      "번호,문제,선택지1,선택지2,선택지3,선택지4,선택지5,정답,해설,출처",
      '1,옳은 것은?,갑,을,병,정,무,4,"ㄱ. 틀리다.\nㄴ. 맞다.\n따라서 정답은 4번.",변호사시험',
    ].join("\n");

    const parsed = parseCsvByType(csv, "5-choice");
    expect(parsed[0]?.explanation).toBe("ㄱ. 틀리다.\nㄴ. 맞다.\n따라서 정답은 4번.");
  });

  it("normalizes multiple accepted choices from a quoted answer cell", () => {
    const csv = [
      "번호,문제,선택지1,선택지2,선택지3,선택지4,선택지5,정답",
      '1,옳은 것은?,갑,을,병,정,무,"2, 1,2"',
      '2,정답이 없는 문항,갑,을,병,정,무," 0 "',
    ].join("\n");

    expect(inferTestTypeFromCsv(csv)).toBe("5-choice");
    expect(parseCsvByType(csv, "5-choice")[0]?.answer).toBe("1,2");
    expect(parseCsvByType(csv, "5-choice")[0]?.originalRow.정답).toBe("2, 1,2");
    expect(parseCsvByType(csv, "5-choice")[1]?.answer).toBe("0");
  });

  it("rejects invalid accepted choice values without changing short-answer comma handling", () => {
    for (const answer of ["0,1", "1,6", "1,", "1,,2", "1;2", "01"]) {
      const csv = `번호,문제,선택지1,선택지2,선택지3,선택지4,선택지5,정답\n1,옳은 것은?,갑,을,병,정,무,"${answer}"`;
      expect(() => parseCsvByType(csv, "5-choice"), answer).toThrow("5지선다 정답");
    }
    const shortCsv = '번호,문제,정답\n1,가상 문제,"1, 2"';
    expect(parseCsvByType(shortCsv, "short")[0]?.answer).toBe("1, 2");
  });

  it("parses the downloadable box-style 5-choice sample", () => {
    const csv = readFileSync(resolve("public/samples/5지선다_box_sample.csv"), "utf8");
    const parsed = parseCsvByType(csv, "5-choice");
    const first = parsed[0];
    expect(parsed).toHaveLength(2);
    expect(first?.boxes).toHaveLength(3);
    expect(first?.choices?.[4]).toBe("ㄱ·ㄴ·ㄷ");
    expect(first?.answer).toBe("5");
  });

  it("parses the multiple-answer and no-correct-option examples in both 5-choice samples", () => {
    for (const path of ["public/samples/5지선다_sample.csv", "samples/5지선다_sample.csv"]) {
      const csv = readFileSync(resolve(path), "utf8");
      const parsed = parseCsvByType(csv, "5-choice");
      expect(parsed.slice(-2).map((question) => question.answer), path).toEqual(["2,4", "0"]);
    }
  });

  it("parses the downloadable short-answer sample", () => {
    const csv = readFileSync(resolve("public/samples/단답형_sample.csv"), "utf8");
    const parsed = parseCsvByType(csv, "short");
    expect(parsed).toHaveLength(2);
    expect(parsed[0]?.answer).toBe("해제");
    expect(parsed[1]?.answer).toBe("배상");
  });
});

describe("CSV upload metadata", () => {
  it("creates a clean session title from the selected file name", () => {
    expect(createSessionTitleFromFileName("민법_기출(2026)-최종.csv")).toBe("민법 기출 2026 최종");
    expect(createSessionTitleFromFileName("채권각론.v2.CSV")).toBe("채권각론 v2");
  });

  it("infers 5-choice from choice headers", () => {
    const csv = [
      "번호,문제,선택지1,선택지2,선택지3,선택지4,선택지5,정답",
      "1,옳은 것은?,갑,을,병,정,무,3",
    ].join("\n");

    expect(inferTestTypeFromCsv(csv)).toBe("5-choice");
  });

  it("distinguishes OX and short answer csv by answer values", () => {
    const oxCsv = ["번호,문제,정답", "1,계약은 합의로 성립한다,O", "2,언제나 서면이 필요하다,X"].join("\n");
    const shortCsv = ["번호,문제,정답", "1,계약을 해소하는 의사표시는?,해제"].join("\n");

    expect(inferTestTypeFromCsv(oxCsv)).toBe("OX");
    expect(inferTestTypeFromCsv(shortCsv)).toBe("short");
  });

  it("keeps the current selection when required headers cannot be identified", () => {
    expect(inferTestTypeFromCsv("이름,내용\n민법,테스트")).toBeNull();
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

describe("wrong answer CSV exports", () => {
  it("excludes accepted choices, no-correct-option questions, and unanswered questions from both wrong-only exports", () => {
    const csv = [
      "번호,문제,선택지1,선택지2,선택지3,선택지4,선택지5,정답",
      ...[1, 2, 3, 4].map((number) => `${number},가상 문제 ${number},갑,을,병,정,무,"1, 2"`),
      ...[5, 6].map((number) => `${number},정답이 없는 문항 ${number},갑,을,병,정,무,0`),
    ].join("\n");
    const answers = ["1", "2", "3", "", "4", ""];
    const questions = parseCsvByType(csv, "5-choice").map((question, index) => ({
      ...question,
      my_answer: answers[index] ?? "",
      wrong_note: `검토 ${index + 1}`,
    }));
    const session: TestSession = {
      id: "choice-export",
      title: "복수 허용 정답",
      type: "5-choice",
      total_questions: 6,
      solved_questions: 4,
      score: 67,
      elapsed_time: 60,
      created_at: "2026-09-21T00:00:00Z",
      status: "completed",
      questions,
    };

    const wrongRows = Papa.parse<Record<string, string>>(buildWrongQuestionsOnlyCsv(session), { header: true }).data;
    const noteRows = Papa.parse<Record<string, string>>(buildWrongNoteCsv(session), { header: true }).data;
    expect(wrongRows).toHaveLength(1);
    expect(wrongRows[0]).toMatchObject({ 번호: "3", 정답: "1, 2", my_answer: "3" });
    expect(noteRows).toHaveLength(1);
    expect(noteRows[0]).toMatchObject({ 번호: "3", 정답: "1,2", "내 답": "3", "오답 노트": "검토 3" });
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
