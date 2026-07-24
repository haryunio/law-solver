import { useEffect, useState } from "react";
import { IconCloseButton } from "./IconCloseButton";

const externalLinkClass =
  "break-all font-medium text-red-600 underline underline-offset-4 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300";

export function PrivacyPolicyLink() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="text-stone-400 transition hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300"
      >
        개인정보처리방침
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 text-left"
          role="dialog"
          aria-modal="true"
          aria-labelledby="privacy-policy-title"
        >
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="app-modal-backdrop absolute inset-0"
            aria-label="개인정보처리방침 닫기"
          />
          <section className="app-modal-surface relative max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-2xl border p-5 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold tracking-[0.16em] text-red-600 dark:text-red-400">PRIVACY POLICY</p>
                <h2 id="privacy-policy-title" className="mt-2 text-xl font-bold text-stone-950 dark:text-stone-100 sm:text-2xl">
                  개인정보처리방침
                </h2>
              </div>
              <IconCloseButton onClick={() => setIsOpen(false)} label="개인정보처리방침 닫기" />
            </div>

            <div className="mt-6 space-y-6 text-sm leading-7 text-stone-600 dark:text-stone-300">
              <section>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  1. 계정 및 Premium 서비스 데이터
                </h3>
                <h4 className="mt-3 font-semibold text-stone-800 dark:text-stone-200">
                  오프라인 문제 풀이
                </h4>
                <p className="mt-3">
                  오프라인 대시보드에 사용자가 직접 업로드한 CSV의 문제 본문·박스 지문·선택지·정답·해설·출처와
                  사용자가 선택하거나 입력한 답안, 진행 상태, 점수, 책갈피, 오답 노트 등 오프라인 학습 데이터는
                  브라우저 저장소에만 저장되며 현재 Premium 서버로 전송하지 않습니다.
                </p>
                <h4 className="mt-4 font-semibold text-stone-800 dark:text-stone-200">
                  Premium 온라인 문제 풀이
                </h4>
                <p className="mt-3">
                  Premium 온라인 기능을 사용하는 경우 회원가입·로그인을 위해 이메일과 표시 이름을 처리합니다. 온라인
                  문제의 본문·박스 지문·선택지·정답·해설 등 문제 콘텐츠는 Premium 서버에서 제공됩니다. 이어 풀기,
                  기기 간 이용, 답안 저장, 서버 채점, 결과·오답·책갈피 확인과 재풀이 기능을 제공하기 위해 문제 세트와
                  풀이 세션 식별정보, 문항별 선택·입력 답안, 답안 저장 시각, 진행·제출 상태, 책갈피, 오답 노트,
                  풀이 순서·재풀이 유형, 풀이 시간, 점수와 정오 결과 및 관련 시각을 사용자 계정에 연결하여 Supabase
                  기반 서버에 저장합니다.
                </p>
                <p className="mt-3">
                  회원권과 과목 이용권의 주문·결제 상태·유효기간도 계정에 연결하여 저장합니다. 이러한 Premium 서버
                  저장은 온라인 기능 제공을 위한 처리이며, 아래 Google Analytics를 통한 이용 통계 수집과는 구분됩니다.
                </p>
                <p className="mt-3">
                  실제 결제 기능을 사용하는 경우 결제 승인에 필요한 주문번호와 금액이 결제대행사에 전달될 수 있습니다.
                  카드번호 등 결제수단 정보는 Law Solver 서버에 직접 저장하지 않습니다. 계정 데이터 열람·정정·삭제 문의는
                  제작자 이메일로 요청할 수 있습니다.
                </p>
              </section>

              <section>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  2. 개인정보 자동 수집의 목적 및 거부에 관한 사항
                </h3>
                <p className="mt-3">
                  이 사이트는 홈페이지 방문 현황 및 이용 형태 파악을 통한 사이트 운영·개선을 위해 이용자의 정보를
                  수시로 저장하고 불러오는 쿠키(Cookie)를 사용합니다. 쿠키는 웹사이트를 운영하는 서버가 이용자의
                  브라우저에 보내는 작은 텍스트 파일로서 이용자의 기기에 저장될 수 있습니다.
                </p>
                <p className="mt-3">
                  이 사이트는 쿠키를 통해 개인을 직접 식별하는 정보를 수집하지 않으며, 이용자는 언제든지 쿠키의
                  저장을 거부하거나 삭제할 수 있습니다.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-stone-900 dark:text-stone-100">① 쿠키 등 사용 목적</h3>
                <p className="mt-2">
                  이 사이트는 방문 및 이용 형태, 이용자 규모 등을 파악하여 서비스를 개선하기 위해 Google LLC가
                  제공하는 웹 분석 서비스인 Google Analytics를 사용합니다. Google Analytics를 통해 수집되는 정보의
                  처리는 Google 개인정보처리방침과 Google Analytics 이용약관을 적용받습니다.
                </p>
                <ol className="mt-3 list-decimal space-y-2 pl-5">
                  <li>
                    Google 개인정보처리방침:{" "}
                    <a className={externalLinkClass} href="https://policies.google.com/privacy?hl=ko" target="_blank" rel="noreferrer">
                      https://policies.google.com/privacy?hl=ko
                    </a>
                  </li>
                  <li>
                    Google Analytics 이용약관:{" "}
                    <a className={externalLinkClass} href="https://marketingplatform.google.com/about/analytics/terms/kr/" target="_blank" rel="noreferrer">
                      https://marketingplatform.google.com/about/analytics/terms/kr/
                    </a>
                  </li>
                </ol>
                <p className="mt-3">
                  이 사이트는 서비스 개선을 위해 랜딩·서비스 홈·환경설정·계정·Premium 대시보드·미니 앱 등 방문한
                  풀이·복기·재풀이 활동과 같은 비식별 이용 통계를 수집할 수 있습니다. LBTI
                  테스트를 완료하면 16개 중 하나인 최종 4자 유형 코드를 수집할 수 있습니다. Google Analytics로는
                  오프라인·온라인 문제의 본문·선택지·정답·해설, 사용자의 선택·입력 답안, 정오 여부, 점수, 진행률,
                  문항 수, 풀이 시간, 책갈피, 오답 노트, LBTI 질문별 응답, 축별 점수와 소요시간을 수집하지 않습니다.
                  또한 개인을 직접 식별할 수 있는 정보, 과목·세션명과 내부 식별자, 브라우저 또는 Premium 서버에
                  저장된 학습 데이터 원본을 Google Analytics로 보내지 않으며, 분석 정보를 다른 경로를 통해 얻은
                  개인식별 정보와 결합하지 않습니다. 이는 Google Analytics 전송 제한에 관한 설명이며, Premium 온라인
                  기능 제공을 위해 앞서 명시한 풀이 내역을 Supabase 기반 서버에 저장하는 처리와는 별개입니다.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-stone-900 dark:text-stone-100">② 쿠키 설정 거부 방법</h3>
                <p className="mt-2">
                  이용자는 쿠키 설치에 대한 선택권을 가지며, 아래 방법으로 쿠키를 삭제하거나 자동 수집을 거부할 수
                  있습니다. 브라우저 버전에 따라 메뉴 이름과 위치는 달라질 수 있습니다.
                </p>

                <h4 className="mt-4 font-semibold text-stone-800 dark:text-stone-200">웹 브라우저에서 쿠키 허용·차단</h4>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>Chrome: 설정 → 개인정보 보호 및 보안 → 인터넷 사용 기록 삭제</li>
                  <li>Edge: 설정 → 쿠키 및 사이트 권한 → 쿠키 및 사이트 데이터 관리 및 삭제</li>
                </ul>

                <h4 className="mt-4 font-semibold text-stone-800 dark:text-stone-200">모바일 브라우저에서 쿠키 허용·차단</h4>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>Chrome: 설정 → 개인정보 보호 및 보안 → 인터넷 사용 기록 삭제</li>
                  <li>Safari: 기기 설정 → Safari → 고급 → 모든 쿠키 차단</li>
                  <li>삼성 인터넷: 설정 → 인터넷 사용 기록 → 인터넷 사용 기록 삭제</li>
                </ul>

                <h4 className="mt-4 font-semibold text-stone-800 dark:text-stone-200">
                  Google Analytics 차단 브라우저 부가 기능 설치
                </h4>
                <a
                  className={`${externalLinkClass} mt-2 inline-block`}
                  href="https://tools.google.com/dlpage/gaoptout"
                  target="_blank"
                  rel="noreferrer"
                >
                  https://tools.google.com/dlpage/gaoptout
                </a>
              </section>
            </div>

            <div className="mt-7 flex justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="app-button-secondary rounded-lg px-5 py-2.5 text-sm font-semibold"
              >
                닫기
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
