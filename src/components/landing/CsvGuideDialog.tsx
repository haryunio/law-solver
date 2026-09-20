import { Dialog } from "../ui/Dialog";
import { IconCloseButton } from "../ui/IconCloseButton";

const csvGuides = [
  {
    title: "OX",
    description: "정답에는 O 또는 X를 입력합니다.",
    header: "번호,챕터,문제,정답,해설,출처",
    example: "1,채권각론,임대차가 끝난 뒤에도 보증금반환채권의 소멸시효는 진행한다.,X,목적물을 점유하는 동안에는 소멸시효가 진행하지 않습니다.,대법원 판례",
  },
  {
    title: "5지선다",
    description: '정답에는 1부터 5까지의 번호를 입력합니다. 복수정답은 1,2처럼 적으면 둘 중 하나만 골라도 맞습니다. 0은 정답 없음으로, 답을 고르지 않아도 정답 처리합니다. CSV를 직접 작성할 때 쉼표가 들어간 정답은 "1,2"처럼 큰따옴표로 감싸 주세요.',
    header: "번호,챕터,문제,선택지1,선택지2,선택지3,선택지4,선택지5,정답,해설,출처",
    example: "1,민법총칙,통정허위표시에 관한 설명으로 옳은 것은?,항상 유효하다,선의의 제3자에게 대항할 수 없다,취소해야 무효다,착오와 같다,사기와 같다,2,당사자 사이에서는 무효입니다.,민법 제108조",
  },
  {
    title: "5지선다 박스형",
    description: "박스1부터 박스7까지 필요한 만큼 열을 추가하세요. 입력한 순서대로 ㄱ. ㄴ. ㄷ. 보기로 표시되며, 선택지1~5에는 보기의 조합이나 개수를 적습니다.",
    header: "번호,챕터,문제,박스1,박스2,박스3,선택지1,선택지2,선택지3,선택지4,선택지5,정답,해설,출처",
    example: "1,형법총론,옳은 것을 모두 고른 것은?,고의가 있어야 한다.,위법성이 조각될 수 있다.,책임능력이 필요하다.,ㄱ,ㄴ,ㄱ과 ㄷ,ㄴ과 ㄷ,ㄱ과 ㄴ과 ㄷ,5,세 보기 모두 옳습니다.,형법 기본서",
  },
  {
    title: "단답형",
    description: "문제의 빈칸에 들어갈 답을 정답 열에 그대로 입력합니다. 현재는 띄어쓰기까지 포함해 입력값이 일치해야 정답으로 처리됩니다.",
    header: "번호,챕터,문제,정답,해설,출처",
    example: "1,매매,타인의 권리를 매매한 매도인이 권리를 이전할 수 없을 때 매수인은 계약을 ____할 수 있다.,해제,민법 제570조에 따른 해제권입니다.,민법 제570조",
  },
];

export function CsvGuideDialog({ onClose }: { onClose: () => void }) {
  return (
    <Dialog
      labelledBy="csv-guide-title"
      onClose={onClose}
      closeLabel="CSV 가이드 바깥 영역 닫기"
      surfaceClassName="landing-modal max-h-[88dvh] max-w-4xl overflow-y-auto overscroll-contain break-keep rounded-3xl border p-6 sm:p-8"
    >
      <IconCloseButton onClick={onClose} label="CSV 가이드 닫기" className="absolute right-4 top-4" />
      <p className="landing-section-label">CSV STARTER GUIDE</p>
      <h2 id="csv-guide-title" className="mt-2 pr-10 text-2xl font-bold tracking-tight text-stone-950 dark:text-white">문제 파일은 이렇게 만들어요</h2>
      <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-400">첫 줄에 아래 헤더를 넣고, 둘째 줄부터 문제를 한 줄씩 작성해 주세요.</p>

      <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
        {csvGuides.map((guide) => (
          <div key={guide.title} className="app-subtle-surface min-w-0 rounded-2xl border p-4">
            <p className="font-semibold text-red-600 dark:text-red-400">{guide.title}</p>
            <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-400">{guide.description}</p>
            <p className="mt-3 text-xs font-semibold text-stone-500 dark:text-stone-400">헤더</p>
            <code className="mt-1 block overflow-x-auto whitespace-nowrap rounded-lg bg-white px-3 py-2.5 font-mono text-xs text-stone-700 dark:bg-stone-900 dark:text-stone-300">{guide.header}</code>
            <p className="mt-3 text-xs font-semibold text-stone-500 dark:text-stone-400">작성 예시</p>
            <code className="mt-1 block overflow-x-auto whitespace-nowrap rounded-lg bg-white px-3 py-2.5 font-mono text-xs text-stone-700 dark:bg-stone-900 dark:text-stone-300">{guide.example}</code>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <p className="font-semibold text-stone-900 dark:text-stone-100">바로 써볼 수 있는 샘플</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["OX 문제", "/samples/OX_sample.csv"],
            ["5지선다", "/samples/5지선다_sample.csv"],
            ["박스형 5지선다", "/samples/5지선다_box_sample.csv"],
            ["단답형", "/samples/단답형_sample.csv"],
          ].map(([label, href]) => (
            <a key={href} className="landing-sample-link" href={href} download>{label} <span>↓</span></a>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
        <strong>기억해 주세요.</strong> 직접 올린 CSV 문제와 풀이 기록은 현재 브라우저에 저장돼요. 중요한 자료는 CSV나 전체 JSON 백업으로 보관해 주세요. Premium 클라우드 백업은 직접 실행할 때만 암호화된 사본을 서버에 보관해요.
      </div>
    </Dialog>
  );
}
