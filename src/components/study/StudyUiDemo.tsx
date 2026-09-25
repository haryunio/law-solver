import { useState } from "react";
import { SolveChoiceList } from "../cbt/SolveChoiceList";
import { ChoiceReviewList } from "../review/ChoiceReviewList";
import { Button } from "../ui/Button";
import { RichTextContent } from "../ui/RichTextContent";
import { ThemeSelect } from "../ui/ThemeSelect";
import type { ParsedQuestion } from "../../types/test";
import { getQuestionAnswerToken } from "../../lib/answer";
import { QuestionPassages } from "./QuestionPassages";
import { StudyOmrTable } from "./StudyOmrTable";

const examples: readonly ParsedQuestion[] = [
  {
    id: "study-ui-ox", no: 1, question: "문제를 풀면서 선택한 답과 책갈피는 OMR에서 확인할 수 있다.",
    answer: "O", my_answer: "", explanation: "OMR에서 번호를 누르면 해당 문제로 이동할 수 있습니다.", originalRow: {},
  },
  {
    id: "study-ui-choice", no: 2, question: "다음 보기의 설명과 일치하는 것을 고르세요.",
    boxes: ["답안을 고른 뒤 정답 표시를 켜면 채점 상태를 확인할 수 있습니다.", "복습 선지에서는 내 답과 정답을 구분해 표시합니다."],
    choices: ["고른 답은 모두 정답으로 표시된다.", "정답 표시를 켜면 내 답과 정답을 비교할 수 있다.", "OMR에서는 다른 문제로 이동할 수 없다.", "책갈피는 문제에 답을 고른 경우에만 표시된다.", "복습 선지에서는 내가 고른 답을 볼 수 없다."],
    answer: "2", my_answer: "2", explanation: "정답 표시를 켜거나 복습 선지를 펼쳐 선택한 답의 표시를 비교해 보세요.", originalRow: {},
  },
  {
    id: "study-ui-review", no: 3, question: "복습 화면에서 선지와 태그는 어떻게 표시되나요?",
    choices: ["좁은 화면에서도 태그가 본문의 너비를 계속 차지한다.", "내 답과 정답은 색상으로만 구분한다.", "책갈피를 표시하면 정답이 달라진다.", "좁은 화면에서는 태그가 선지 본문 아래에 놓인다.", "화면 너비에 따라 선지의 순서가 바뀐다."],
    answer: "4", my_answer: "1", bookmark: true, wrong_note: "태그의 위치를 다시 확인하기", explanation: "모바일에서는 태그를 본문 아래에 두어 긴 선지를 읽을 공간을 확보합니다.", originalRow: {},
  },
];

/** Presentation-only examples. Answers and bookmarks never leave this component. */
export function StudyUiDemo() {
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [questions, setQuestions] = useState(() => examples.map((question) => ({ ...question })));
  const question = questions[index]!;
  const type = question.choices ? "5-choice" : "OX";
  const updateQuestion = (patch: Partial<Pick<ParsedQuestion, "my_answer" | "bookmark">>) => {
    setQuestions((previous) => previous.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  };

  return (
    <div className="app-study-page app-focus-page space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-36">
          <ThemeSelect ariaLabel="풀이 예시 유형" value={type} options={[{ value: "OX", label: "OX" }, { value: "5-choice", label: "5지선다" }]} onChange={(value) => setIndex(value === "OX" ? 0 : 1)} />
        </div>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={showAnswer} onChange={(event) => setShowAnswer(event.target.checked)} className="h-4 w-4 accent-red-600" />
          정답 표시
        </label>
        <Button size="sm" onClick={() => { setQuestions(examples.map((item) => ({ ...item }))); setIndex(0); setShowAnswer(false); }}>예시 초기화</Button>
      </div>
      <div className="grid items-start gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
        <div className="app-study-panel min-w-0 overflow-hidden border">
          <div className="app-study-divider flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="app-study-tag app-study-inset border px-2.5 py-1 text-xs font-semibold">{index + 1}번 / 총 {questions.length}문항</span>
              <span className="app-study-tag border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{type === "OX" ? "OX" : "5지선다"}</span>
            </div>
            <button type="button" aria-label="예시 문제 책갈피" aria-pressed={Boolean(question.bookmark)} onClick={() => updateQuestion({ bookmark: !question.bookmark })} className={`flex h-8 w-8 items-center justify-center rounded-full border text-lg ${question.bookmark ? "border-amber-300 bg-amber-50 text-amber-600 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400" : "app-button-secondary"}`}>★</button>
          </div>
          <div className="p-4 sm:p-5">
            <RichTextContent content={question.question} className="text-sm font-medium leading-7 sm:text-base" />
            <QuestionPassages boxes={question.boxes} compact />
            <div className="mt-5 space-y-3">
              <SolveChoiceList question={question} type={type} showAnswer={showAnswer} showNext={index < questions.length - 1} onAnswer={(answer) => updateQuestion({ my_answer: answer })} onInlineNext={() => setIndex((value) => Math.min(value + 1, questions.length - 1))} />
            </div>
            {showAnswer ? (
              <div className="app-study-answer-panel mt-4 border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/20 dark:text-blue-200">
                <p className="font-semibold">정답 {getQuestionAnswerToken(question)}</p>
                <p className="mt-2 leading-6">{question.explanation}</p>
              </div>
            ) : null}
            {question.choices ? (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-semibold text-stone-600 dark:text-stone-300">선택한 답으로 복습 선지 보기</summary>
                <ChoiceReviewList question={question} />
              </details>
            ) : null}
          </div>
        </div>
        <aside className="app-study-panel min-w-0 border p-4" aria-label="풀이 UI 예시 OMR">
          <h3 className="mb-3 text-sm font-semibold">{showAnswer ? "복습 OMR" : "풀이 OMR"}</h3>
          <StudyOmrTable questions={questions} currentIndex={index} mode={showAnswer ? "review" : "solve"} onSelect={setIndex} className="overflow-hidden" />
          <p className="mt-3 text-xs leading-5 text-stone-500 dark:text-stone-400">번호를 눌러 문제를 바꿔 보세요. 정답 표시를 켜면 채점 상태와 오답 노트 표시도 확인할 수 있습니다.</p>
        </aside>
      </div>
    </div>
  );
}
