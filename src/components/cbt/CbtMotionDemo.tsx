import { useRef, useState } from "react";
import { MobileOmrSheet } from "./MobileOmrSheet";
import { OmrShortcutButton } from "./OmrShortcutButton";
import { QuestionContentMotion } from "./QuestionContentMotion";
import { useQuestionPanelHeightMotion } from "./useQuestionPanelHeightMotion";

const examples = [
  ["문제를 이동하면 본문과 선택지가 함께 부드럽게 바뀝니다."],
  [
    "이 문제는 내용이 긴 경우를 확인하는 예시입니다. 첫 번째 문제에서 넘어오면 본문과 선택지가 바뀌고, 문제 박스도 내용에 필요한 높이로 부드럽게 늘어납니다.",
    "문제가 길어도 화면 아래로 박스가 계속 늘어나지는 않습니다. 사용할 수 있는 높이에 도달하면 문제 안쪽에서 스크롤하며, 이전과 다음 버튼은 그대로 사용할 수 있습니다.",
    "아래에서 답안을 고른 뒤 다른 문제로 이동해 보세요. 이 예시에서 고른 답안은 돌아왔을 때 그대로 남아 있습니다. 답안을 선택하는 동안에는 전환 효과를 다시 재생하지 않습니다.",
    "다음 문제로 이동하면 짧은 내용에 맞춰 박스가 다시 줄어듭니다. OMR을 열어 첫 번째 문제로 바로 돌아가도 같은 방식으로 확인할 수 있습니다.",
  ],
  ["OMR에서 번호를 누르면 해당 문제로 바로 이동합니다."],
];

/** Local-only preview of the same motion components used during active solving. */
export function CbtMotionDemo() {
  const [index, setIndex] = useState(0);
  const [omrOpen, setOmrOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const panelRef = useRef<HTMLDivElement>(null);
  useQuestionPanelHeightMotion(panelRef, `motion-demo-${index}`, false);

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-base font-semibold">문제 이동, 박스 높이와 OMR</h3>
        <p className="mt-1 text-sm leading-6 text-stone-500 dark:text-stone-400">두 번째 문제는 내용이 길어 박스가 늘어납니다. 이전과 다음 버튼이나 OMR로 이동해 보세요. 답안은 이 예시 안에서만 유지됩니다.</p>
      </div>
      <div className="app-focus-page h-[420px]">
        <div ref={panelRef} className="app-card relative flex max-h-full min-h-64 w-full flex-col overflow-hidden rounded-2xl border">
          <div className="cbt-question-toolbar flex shrink-0 items-center justify-between gap-3 border-b border-stone-200 px-4 py-3 dark:border-stone-700">
            <p className="text-sm font-semibold">예시 문제 {index + 1} / {examples.length}</p>
            <OmrShortcutButton expanded={omrOpen} onClick={() => setOmrOpen(true)} />
          </div>
          <div className="cbt-question-content min-h-0 flex-1 overflow-auto p-4">
            <QuestionContentMotion questionKey={`motion-demo-${index}`} questionIndex={index} className="space-y-5">
              <div className="min-h-12 space-y-3 text-sm leading-6">{examples[index]?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
              <div className="grid grid-cols-2 gap-3" role="group" aria-label="예시 답안">
                {["O", "X"].map((answer) => (
                  <button key={answer} type="button" aria-pressed={answers[index] === answer} onClick={() => setAnswers((previous) => ({ ...previous, [index]: answer }))} className={`rounded-xl border px-4 py-3 text-sm font-semibold ${answers[index] === answer ? "border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-950/30 dark:text-red-300" : "app-button-secondary"}`}>
                    {answer}
                  </button>
                ))}
              </div>
            </QuestionContentMotion>
          </div>
          <div className="cbt-navigation grid shrink-0 grid-cols-2 gap-3 px-4 pb-4">
            <button type="button" disabled={index === 0} onClick={() => setIndex((value) => value - 1)} className="app-button-secondary rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-40">이전 문제</button>
            <button type="button" disabled={index === examples.length - 1} onClick={() => setIndex((value) => value + 1)} className="app-button-primary rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-40">다음 문제</button>
          </div>
          <MobileOmrSheet open={omrOpen} onClose={() => setOmrOpen(false)} layerClassName="absolute inset-0 z-10">
            <div className="grid grid-cols-3 gap-2">
              {examples.map((_, questionIndex) => (
                <button key={questionIndex} type="button" aria-label={`예시 ${questionIndex + 1}번 문제로 이동`} aria-current={index === questionIndex ? "step" : undefined} onClick={() => { setIndex(questionIndex); setOmrOpen(false); }} className={`rounded-xl border py-3 text-sm font-semibold ${index === questionIndex ? "border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-950/30 dark:text-red-300" : "app-button-secondary"}`}>
                  {questionIndex + 1}<span className="ml-2 text-xs font-normal">{answers[questionIndex] ?? "미응답"}</span>
                </button>
              ))}
            </div>
          </MobileOmrSheet>
        </div>
      </div>
      <p className="text-xs leading-5 text-stone-500 dark:text-stone-400">문제 이동은 방향에 따라 좌우 4px를 120ms 동안 움직입니다. 768px 이상에서는 내용에 따른 박스 높이 변화도 140ms로 이어집니다. OMR은 열 때 160ms와 12px, 닫을 때 120ms와 8px를 사용합니다. 첫 진입과 답안 선택에는 효과를 적용하지 않습니다.</p>
    </div>
  );
}
