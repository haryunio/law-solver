import { useEffect, useState } from "react";
import { IconCloseButton } from "./IconCloseButton";

const externalLinkClass =
  "break-all font-medium text-red-600 underline underline-offset-4 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300";

const tableClass =
  "w-full min-w-[680px] border-collapse text-left text-xs leading-6";
const tableHeadClass =
  "border border-stone-200 bg-stone-100 px-3 py-2 font-semibold text-stone-800 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100";
const tableCellClass =
  "border border-stone-200 px-3 py-2 align-top dark:border-stone-700";

const defaultLinkClass =
  "text-stone-400 transition hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300";

interface PrivacyPolicyLinkProps {
  className?: string;
}

export function PrivacyPolicyLink({ className = defaultLinkClass }: PrivacyPolicyLinkProps) {
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
        className={className}
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
          <section className="app-modal-surface relative max-h-[88vh] w-full max-w-4xl overflow-y-auto rounded-2xl border p-5 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold tracking-[0.16em] text-red-600 dark:text-red-400">
                  PRIVACY POLICY
                </p>
                <h2
                  id="privacy-policy-title"
                  className="mt-2 text-xl font-bold text-stone-950 dark:text-stone-100 sm:text-2xl"
                >
                  개인정보처리방침
                </h2>
                <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
                  시행일: 2026년 7월 25일
                </p>
              </div>
              <IconCloseButton onClick={() => setIsOpen(false)} label="개인정보처리방침 닫기" />
            </div>

            <div className="mt-6 space-y-7 text-sm leading-7 text-stone-600 dark:text-stone-300">
              <section>
                <p>
                  Law Solver 운영자(이하 “운영자”)는 「개인정보 보호법」 등 관계 법령을 준수하며,
                  개인정보가 어떤 목적으로 처리되고 어떻게 보호되는지 다음과 같이 안내합니다.
                </p>
                <div className="app-subtle-surface mt-4 rounded-xl border p-4">
                  <h3 className="font-bold text-stone-900 dark:text-stone-100">먼저 확인해 주세요</h3>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    <li>
                      오프라인 학습 데이터는 브라우저 저장소에만 저장되며 Premium 서버로 자동 전송되지
                      않습니다.
                    </li>
                    <li>
                      Premium 온라인 학습 데이터는 이어 풀기·서버 채점·결과 제공을 위해 계정과 연결하여
                      Supabase 기반 서버에 저장합니다.
                    </li>
                    <li>
                      Google Analytics에는 문제 원문, 사용자의 답안, 점수, 오답 노트 등 학습 데이터
                      원본을 보내지 않습니다.
                    </li>
                  </ul>
                </div>
              </section>

              <section>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  1. 처리하는 개인정보의 항목·목적·보유기간
                </h3>
                <div className="mt-3 overflow-x-auto">
                  <table className={tableClass}>
                    <thead>
                      <tr>
                        <th className={tableHeadClass}>구분</th>
                        <th className={tableHeadClass}>처리 항목</th>
                        <th className={tableHeadClass}>처리 목적</th>
                        <th className={tableHeadClass}>보유기간</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className={tableCellClass}>계정·인증</td>
                        <td className={tableCellClass}>
                          이메일, 표시 이름, Auth 사용자 식별자, 로그인·인증 상태와 관련 시각
                        </td>
                        <td className={tableCellClass}>
                          회원가입, 로그인, 계정 식별, 인증과 보안
                        </td>
                        <td className={tableCellClass}>
                          회원 탈퇴 또는 계정 삭제 요청 시까지. 다만 관계 법령에 따라 보존할 정보는 해당
                          기간까지 분리 보관
                        </td>
                      </tr>
                      <tr>
                        <td className={tableCellClass}>Premium 학습</td>
                        <td className={tableCellClass}>
                          문제 세트·풀이 세션 식별정보, 세션 제목, 문항별 선택·입력 답안과 저장 시각,
                          진행·중단·제출 상태, 책갈피, 오답 노트, 풀이 순서·재풀이 유형, 풀이 시간,
                          점수·정오 결과와 관련 시각
                        </td>
                        <td className={tableCellClass}>
                          이어 풀기, 기기 간 이용, 답안 저장, 서버 채점, 결과·복기·재풀이 제공
                        </td>
                        <td className={tableCellClass}>
                          회원 탈퇴, 삭제 요청 또는 서비스 제공 목적 달성 시까지. 법정 보존 대상 거래
                          기록은 제외
                        </td>
                      </tr>
                      <tr>
                        <td className={tableCellClass}>상품·이용권·거래</td>
                        <td className={tableCellClass}>
                          상품, 비순차 결제 식별번호, 결제수단 구분, 금액, 주문·결제 상태와 시각,
                          이용권 종류·시작일·종료일, 프로모션 사용 결과
                        </td>
                        <td className={tableCellClass}>
                          주문 처리, 이용권 발급, 구매내역 제공, 환불·분쟁 처리와 부정 이용 방지
                        </td>
                        <td className={tableCellClass}>
                          관련 거래에 법정 보존의무가 적용되면 아래 제2항의 기간까지. 그 밖의 정보는
                          회원 탈퇴 또는 목적 달성 시까지
                        </td>
                      </tr>
                      <tr>
                        <td className={tableCellClass}>서비스·보안 로그</td>
                        <td className={tableCellClass}>
                          요청 식별자, 함수명, HTTP 상태, 안정적인 오류 코드, 처리 시간, 비식별 결제 상태,
                          접속·인증 과정에서 자동 생성되는 IP 주소와 기기·브라우저 정보
                        </td>
                        <td className={tableCellClass}>
                          장애 대응, 보안 사고 조사, 비정상 이용 방지
                        </td>
                        <td className={tableCellClass}>
                          수집일로부터 최대 90일. 보안 사고 또는 분쟁이 발생한 경우 해결에 필요한 기간까지
                        </td>
                      </tr>
                      <tr>
                        <td className={tableCellClass}>Google Analytics</td>
                        <td className={tableCellClass}>
                          쿠키·온라인 식별자, 기기·브라우저 정보, 정규화된 화면 유형과 허용된 행동 이벤트,
                          문제 유형 등 정적 구분값, LBTI 최종 4자 유형 코드
                        </td>
                        <td className={tableCellClass}>
                          방문 현황과 이용 형태 분석, 서비스 개선
                        </td>
                        <td className={tableCellClass}>수집일로부터 14개월</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 text-xs leading-6 text-stone-500 dark:text-stone-400">
                  운영자는 주민등록번호, 카드번호, CVC, 카드 비밀번호, Auth 비밀번호 원문, access·refresh
                  token 원문을 서비스 데이터베이스에 저장하지 않습니다. 프로모션 코드 원문도 일반
                  결제내역·분석·로그에 남기지 않습니다.
                </p>
              </section>

              <section>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  2. 관계 법령에 따른 거래기록 보존
                </h3>
                <p className="mt-3">
                  유료 거래 등 관계 법령이 적용되는 경우에는 회원 탈퇴나 삭제 요청 후에도 아래 기록을
                  다른 개인정보와 분리하여 법정 기간 동안 보관할 수 있습니다.
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>표시·광고에 관한 기록: 6개월</li>
                  <li>계약 또는 청약철회 등에 관한 기록: 5년</li>
                  <li>대금결제 및 재화·서비스 공급에 관한 기록: 5년</li>
                  <li>소비자 불만 또는 분쟁처리에 관한 기록: 3년</li>
                </ul>
              </section>

              <section>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  3. 오프라인 학습 데이터와 수집 방법
                </h3>
                <h4 className="mt-3 font-semibold text-stone-800 dark:text-stone-200">
                  오프라인 문제 풀이
                </h4>
                <p className="mt-2">
                  사용자가 직접 업로드한 CSV의 문제 본문·박스 지문·선택지·정답·해설·출처와 사용자의
                  답안, 진행 상태, 점수, 책갈피, 오답 노트, 과목·세션 정보는 현재 브라우저의
                  localStorage에만 저장됩니다. 운영자는 이를 Premium 서버로 자동 수집하거나 동기화하지
                  않습니다. 이용자는 환경설정에서 오프라인 데이터를 백업·복원·초기화할 수 있으며,
                  브라우저 데이터 삭제 기능으로도 제거할 수 있습니다.
                </p>
                <h4 className="mt-4 font-semibold text-stone-800 dark:text-stone-200">
                  Premium 온라인 문제 풀이
                </h4>
                <p className="mt-2">
                  이용자가 회원가입·로그인하거나 Premium 문제를 열고 답안 저장·중단·제출·복기·재풀이
                  기능을 사용할 때 제1항의 정보가 직접 입력되거나 자동 생성됩니다. Premium 서버 저장은
                  온라인 기능 제공을 위한 처리이며 Google Analytics를 통한 이용 통계 수집과는
                  구분됩니다.
                </p>
              </section>

              <section>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  4. 개인정보의 제3자 제공과 처리위탁
                </h3>
                <p className="mt-3">
                  운영자는 원칙적으로 개인정보를 외부에 판매하거나 제3자에게 제공하지 않습니다. 다만
                  이용자의 동의가 있거나 법령에 근거가 있는 경우, 또는 계약 이행을 위해 필요한 범위에서
                  다음 수탁자를 이용할 수 있습니다.
                </p>
                <div className="mt-3 overflow-x-auto">
                  <table className={tableClass}>
                    <thead>
                      <tr>
                        <th className={tableHeadClass}>수탁자</th>
                        <th className={tableHeadClass}>위탁 업무</th>
                        <th className={tableHeadClass}>처리 정보</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className={tableCellClass}>Supabase, Inc.</td>
                        <td className={tableCellClass}>
                          회원 인증, 데이터베이스·서버 함수·백업 등 Premium 인프라 운영
                        </td>
                        <td className={tableCellClass}>
                          계정·인증, Premium 학습, 상품·이용권·거래 및 제한된 운영 로그
                        </td>
                      </tr>
                      <tr>
                        <td className={tableCellClass}>Google LLC</td>
                        <td className={tableCellClass}>Google Analytics 웹 이용 통계 분석</td>
                        <td className={tableCellClass}>
                          쿠키·온라인 식별자, 기기·브라우저 정보와 정규화된 이용 이벤트
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="mt-3">
                  향후 Toss Payments 등 실제 결제수단을 활성화하면 주문번호, 상품명, 금액 등 결제 승인에
                  필요한 정보를 해당 결제사업자에게 제공할 수 있습니다. 활성화 전에 제공받는 자, 목적,
                  항목과 보유기간을 결제 화면과 이 방침에 추가로 안내합니다. 카드번호 등 결제수단 상세는
                  Law Solver 서버에 직접 저장하지 않습니다.
                </p>
                <ul className="mt-3 list-disc space-y-1 pl-5">
                  <li>
                    Supabase 개인정보 안내:{" "}
                    <a
                      className={externalLinkClass}
                      href="https://supabase.com/privacy"
                      target="_blank"
                      rel="noreferrer"
                    >
                      https://supabase.com/privacy
                    </a>
                  </li>
                  <li>
                    Google 개인정보처리방침:{" "}
                    <a
                      className={externalLinkClass}
                      href="https://policies.google.com/privacy?hl=ko"
                      target="_blank"
                      rel="noreferrer"
                    >
                      https://policies.google.com/privacy?hl=ko
                    </a>
                  </li>
                </ul>
              </section>

              <section>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  5. 개인정보의 국외 처리
                </h3>
                <p className="mt-3">
                  Google Analytics를 사용하는 경우 아래 정보가 서비스 이용 시 네트워크를 통해 Google의
                  해외 데이터센터로 전송·처리될 수 있습니다.
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>이전받는 자: Google LLC</li>
                  <li>이전 국가: 미국 등 Google이 데이터센터를 운영하는 국가</li>
                  <li>
                    이전 항목: 쿠키·온라인 식별자, 기기·브라우저 정보, 정규화된 화면 유형과 허용된 행동
                    이벤트
                  </li>
                  <li>이전 목적: 이용 통계 분석과 서비스 개선</li>
                  <li>이전 시기·방법: 사이트 이용 시 암호화된 네트워크를 통한 전송</li>
                  <li>보유·이용기간: 수집일로부터 14개월</li>
                </ul>
                <p className="mt-3">
                  이용자는 브라우저의 쿠키 차단 또는 아래 Google Analytics 차단 도구를 사용하여 분석
                  정보의 처리를 거부할 수 있습니다. 거부해도 오프라인 문제 풀이와 Premium의 핵심 기능은
                  이용할 수 있으나 이용 통계 기반 개선에는 반영되지 않을 수 있습니다.
                </p>
                <a
                  className={`${externalLinkClass} mt-2 inline-block`}
                  href="https://tools.google.com/dlpage/gaoptout"
                  target="_blank"
                  rel="noreferrer"
                >
                  Google Analytics 차단 브라우저 부가 기능
                </a>
              </section>

              <section>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  6. Google Analytics에서 제외하는 정보
                </h3>
                <p className="mt-3">
                  이 사이트는 서비스 개선을 위해 랜딩·서비스 홈·환경설정·계정·Premium 대시보드·미니 앱
                  등 방문한 화면 유형과 풀이·복기·재풀이 활동 같은 이용 통계를 수집할 수 있습니다. LBTI
                  테스트 완료 시에는 16개 중 하나인 최종 4자 유형 코드만 수집할 수 있습니다.
                </p>
                <p className="mt-3">
                  Google Analytics로는 오프라인·온라인 문제의 본문·선택지·정답·해설, 사용자의 선택·입력
                  답안, 정오 여부, 점수, 진행률, 문항 수, 풀이 시간, 책갈피, 오답 노트, LBTI 질문별 응답,
                  축별 점수와 소요시간을 수집하지 않습니다. 이메일·표시 이름, 과목·세션명, CSV 파일명,
                  사용자·과목·세션·문항 내부 식별자와 학습 데이터 원본도 Google Analytics로 보내지
                  않으며 분석 정보를 다른 경로에서 얻은 개인식별 정보와 결합하지 않습니다.
                </p>
              </section>

              <section>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  7. 정보주체의 권리와 행사 방법
                </h3>
                <p className="mt-3">
                  이용자는 자신의 개인정보에 대해 열람, 정정, 삭제, 처리정지, 동의 철회와 회원 탈퇴를
                  요청할 수 있습니다. 아래 담당자 이메일로 요청하면 본인 확인 후 관계 법령에서 정한
                  절차와 기간에 따라 처리하고 결과를 안내합니다. 법령상 보존의무가 있거나 다른 사람의
                  권리를 침해할 우려가 있는 경우에는 요청이 제한될 수 있으며 그 사유를 안내합니다.
                </p>
                <p className="mt-3">
                  오프라인 학습 데이터는 운영자가 보유하지 않으므로 이용자가 환경설정의 “오프라인 데이터
                  초기화” 또는 브라우저 저장 데이터 삭제 기능으로 직접 제거해야 합니다. 법정대리인이나
                  적법한 위임을 받은 대리인도 관계 법령에 따라 권리를 행사할 수 있습니다.
                </p>
              </section>

              <section>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  8. 개인정보의 파기
                </h3>
                <p className="mt-3">
                  보유기간이 끝나거나 처리 목적을 달성한 개인정보는 지체 없이 파기합니다. 관계 법령에 따라
                  보존해야 하는 정보는 다른 정보와 분리하여 보관하고 해당 기간이 끝난 뒤 파기합니다.
                  전자적 파일은 복구하기 어려운 방법으로 삭제하고, 종이 문서가 있는 경우에는 분쇄하거나
                  소각합니다. 운영 백업에 남은 정보는 백업 순환 주기에 따라 접근이 제한된 상태로 삭제되며,
                  백업을 복구하는 경우 삭제 요청이 완료된 정보를 다시 삭제합니다.
                </p>
              </section>

              <section>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  9. 개인정보의 안전성 확보조치
                </h3>
                <ul className="mt-3 list-disc space-y-1 pl-5">
                  <li>HTTPS를 이용한 전송구간 암호화</li>
                  <li>Supabase Auth와 Row Level Security를 이용한 본인 데이터 접근 통제</li>
                  <li>관리자·비밀키 접근 최소화와 운영환경 secret 분리</li>
                  <li>정답·해설, 답안, 이메일, 인증 토큰과 결제정보의 일반 로그 기록 제한</li>
                  <li>안정적인 오류 코드와 요청 식별자를 이용한 개인정보 노출 최소화</li>
                  <li>결제 금액·권한·채점 결과에 대한 서버 검증</li>
                </ul>
              </section>

              <section>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  10. 아동의 개인정보
                </h3>
                <p className="mt-3">
                  Law Solver는 만 14세 미만 아동을 대상으로 설계된 서비스가 아닙니다. 운영자가 법정대리인의
                  적법한 동의 없이 만 14세 미만 아동의 개인정보가 처리된 사실을 확인하면 해당 정보를
                  지체 없이 삭제하거나 필요한 보호조치를 합니다.
                </p>
              </section>

              <section>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  11. 개인정보 보호 담당자와 문의
                </h3>
                <div className="app-subtle-surface mt-3 rounded-xl border p-4">
                  <dl className="grid gap-x-4 gap-y-1 sm:grid-cols-[120px_1fr]">
                    <dt className="font-semibold text-stone-800 dark:text-stone-200">담당자</dt>
                    <dd>신하륜</dd>
                    <dt className="font-semibold text-stone-800 dark:text-stone-200">이메일</dt>
                    <dd>
                      <a className={externalLinkClass} href="mailto:haryun@knu.ac.kr">
                        haryun@knu.ac.kr
                      </a>
                    </dd>
                  </dl>
                </div>
                <p className="mt-3">
                  개인정보 침해에 대한 신고나 상담이 필요한 경우 개인정보침해 신고센터(국번 없이 118),
                  개인정보분쟁조정위원회 등 관계 기관에 문의할 수 있습니다.
                </p>
              </section>

              <section>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  12. 처리방침의 변경
                </h3>
                <p className="mt-3">
                  이 방침은 2026년 7월 25일부터 시행합니다. 처리 항목, 목적, 수탁자 등 중요한 내용이
                  변경되면 시행 전에 서비스 화면을 통해 알기 쉽게 안내하고, 필요한 경우 별도의 동의를
                  받습니다. 이전 처리방침은 운영자에게 이메일로 요청하여 확인할 수 있습니다.
                </p>
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
