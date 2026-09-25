import { useState } from "react";
import { MobileOmrSheet } from "./MobileOmrSheet";
import { OmrShortcutButton } from "./OmrShortcutButton";
import { QuestionContentMotion } from "./QuestionContentMotion";

const examples = [
  "문제를 이동하면 본문과 선택지가 함께 부드럽게 바뀝니다.",
  "이전 문제로 돌아오면 이 예시에서 고른 답안이 남아 있습니다.",
  "OMR에서 번호를 누르면 해당 문제로 바로 이동합니다.",
];

/** Local-only preview of the same motion components used during active solving. */
export function CbtMotionDemo() {
  const [index, setIndex] = useState(0);
  const [omrOpen, setOmrOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-base font-semibold">문제 이동과 OMR</h3>
        <p className="mt-1 text-sm leading-6 text-stone-500 dark:text-stone-400">이전과 다음 버튼을 누르거나 OMR에서 번호를 골라 보세요. 답안은 이 예시 안에서만 유지됩니다.</p>
      </div>
      <div className="app-focus-page app-card relative flex min-h-80 flex-col overflow-hidden rounded-2xl border">
        <div className="flex items-center justify-between gap-3 border-b border-stone-200 px-4 py-3 dark:border-stone-700">
          <p className="text-sm font-semibold">예시 문제 {index + 1} / {examples.length}</p>
          <OmrShortcutButton expanded={omrOpen} onClick={() => setOmrOpen(true)} />
        </div>
        <div className="flex-1 p-4">
          <QuestionContentMotion questionKey={`motion-demo-${index}`} questionIndex={index} className="space-y-5">
            <p className="min-h-12 text-sm leading-6">{examples[index]}</p>
            <div className="grid grid-cols-2 gap-3" role="group" aria-label="예시 답안">
              {["O", "X"].map((answer) => (
                <button key={answer} type="button" aria-pressed={answers[index] === answer} onClick={() => setAnswers((previous) => ({ ...previous, [index]: answer }))} className={`rounded-xl border px-4 py-3 text-sm font-semibold ${answers[index] === answer ? "border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-950/30 dark:text-red-300" : "app-button-secondary"}`}>
                  {answer}
                </button>
              ))}
            </div>
          </QuestionContentMotion>
        </div>
        <div className="grid grid-cols-2 gap-3 px-4 pb-4">
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
      <p className="text-xs leading-5 text-stone-500 dark:text-stone-400">문제 이동은 방향에 따라 좌우 4px를 120ms 동안 움직입니다. OMR은 열 때 160ms와 12px, 닫을 때 120ms와 8px를 사용합니다. 첫 진입과 답안 선택에는 효과를 적용하지 않습니다.</p>
    </div>
  );
}
