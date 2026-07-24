import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { IconCloseButton } from "./IconCloseButton";

type LegalItem = {
  text: ReactNode;
  children?: ReactNode[];
};

type LegalClause = {
  text: ReactNode;
  items?: LegalItem[];
};

type LegalArticle = {
  number: number;
  title: string;
  opening?: ReactNode;
  items?: LegalItem[];
  clauses?: LegalClause[];
  notice?: ReactNode;
};

type LegalChapter = {
  number: number;
  title: string;
  articles: LegalArticle[];
};

const circledNumbers = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩"];
const koreanLetters = ["가", "나", "다", "라", "마", "바", "사", "아", "자", "차"];

const chapters: LegalChapter[] = [
  {
    number: 1,
    title: "총칙",
    articles: [
      {
        number: 1,
        title: "목적",
        opening:
          "이 약관은 신하륜(이하 “운영자”)이 운영하는 Law Solver 서비스(이하 “서비스”)의 이용 조건과 절차, 운영자와 이용자 사이의 권리·의무 및 책임 사항을 규정함을 목적으로 합니다.",
      },
      {
        number: 2,
        title: "용어의 정의",
        opening: "이 약관에서 사용하는 용어의 뜻은 다음과 같습니다.",
        items: [
          { text: "“서비스”란 운영자가 lawsolver.haryun.io 도메인을 통해 제공하는 웹 기반 법학 학습 서비스 전체를 말합니다." },
          { text: "“이용자”란 서비스를 이용하는 모든 사람을 말하며, 계정 없이 오프라인 기능만 사용하는 사람도 포함합니다." },
          { text: "“회원”이란 이메일 주소와 비밀번호로 계정을 생성하고 로그인하여 서비스를 이용하는 이용자를 말합니다." },
          { text: "“오프라인 기능”이란 이용자가 자신의 CSV 파일을 업로드하여 브라우저의 localStorage 안에서 문제를 풀고 학습 기록을 관리하는 무료 기능을 말합니다." },
          { text: "“Premium 기능”이란 운영자가 서버에 등록한 문제 세트를 온라인으로 풀고 학습 기록을 서버에 저장하는 기능을 말합니다." },
          { text: "“Premium 회원권”이란 Premium 기능 이용의 전제가 되는 기간제 이용권으로, 활성 기간에만 과목 이용권을 취득하거나 사용할 수 있습니다." },
          { text: "“과목 이용권”이란 특정 과목의 문제 세트를 일정 기간 이용할 수 있는 기간제 이용권으로, 유효한 Premium 회원권과 함께 보유해야 사용할 수 있습니다." },
          { text: "“선불 기간제 이용권”이란 활성화 시점부터 일정 기간 이용 권한이 부여되며 자동 결제·자동 연장되지 않는 이용권을 말합니다." },
          { text: "“프로모션 코드”란 적용 시 특정 상품의 이용권을 0원으로 생성하는 16자리 일회용 코드를 말합니다." },
          { text: "“오프라인 데이터”란 이용자가 업로드한 CSV 파일, 풀이 기록, 점수, 책갈피, 오답 노트 등 브라우저 localStorage에만 저장되는 학습 데이터를 말합니다." },
          { text: "“Premium 데이터”란 이메일, 표시 이름, 이용권 정보와 온라인 학습 기록 등 Supabase 기반 서버에 계정과 연결하여 저장되는 데이터를 말합니다." },
          { text: "“LBTI”란 서비스 내 ‘LBTI: 로스쿨생 MBTI 테스트’라는 오락·자기점검 목적의 미니 앱을 말합니다." },
          { text: "“부정행위”란 대량 계정 생성, 서버 공격, 프로모션 코드 위·변조, 자동화 도구를 이용한 콘텐츠 무단 수집 등 정상적인 운영을 방해하거나 타인의 이용을 침해하는 행위를 말합니다." },
        ],
      },
      {
        number: 3,
        title: "약관의 게시·효력·변경 및 이용자 통지",
        clauses: [
          { text: "운영자는 이 약관을 서비스 화면에 게시하여 이용자가 확인할 수 있도록 합니다. 회원은 가입할 때 이 약관에 명시적으로 동의합니다." },
          { text: "운영자는 「약관의 규제에 관한 법률」, 「전자상거래 등에서의 소비자보호에 관한 법률」 등 관계 법령을 위반하지 않는 범위에서 약관을 변경할 수 있습니다." },
          { text: "운영자는 약관을 변경하는 경우 변경 내용과 시행일을 서비스 화면 또는 회원의 등록 이메일로 알립니다. 이용자에게 불리한 변경은 시행일 30일 전부터, 그 밖의 변경은 7일 전부터 알립니다." },
          { text: "변경된 약관에 동의하지 않는 이용자는 시행일 전에 서비스 이용을 중단하고 탈퇴할 수 있습니다. 법령상 별도 동의가 필요한 변경은 필요한 동의를 받아 적용합니다." },
          { text: "변경 전에 이미 활성화된 이용권의 이용 조건은 이용자에게 불리하게 소급 변경되지 않습니다." },
          { text: "이 약관에서 정하지 않은 사항은 관계 법령과 운영자가 적법하게 정하여 게시한 개별 정책에 따릅니다." },
        ],
      },
    ],
  },
  {
    number: 2,
    title: "서비스 구성 및 이용",
    articles: [
      {
        number: 4,
        title: "서비스의 구성",
        clauses: [
          {
            text: "서비스는 다음 각 호의 기능으로 구성됩니다.",
            items: [
              { text: "오프라인 CSV 문제 풀이 기능: 이용자가 보유한 CSV 파일을 브라우저 안에서 처리하는 무료·비회원 기능입니다." },
              { text: "Premium 온라인 학습 기능: 서버 제공 문제를 풀고 답안과 학습 기록을 서버에 저장하는 회원 기능입니다. 현재 이용권은 프로모션 코드를 통해서만 취득할 수 있습니다." },
              { text: "LBTI 미니 앱: 오락과 자기점검 목적의 무료 학습 성향 테스트입니다." },
            ],
          },
          { text: "운영자는 서비스의 일부를 추가·수정·종료할 수 있습니다. 유료 이용자의 이용 조건에 불리한 변경은 제3조제3항에 따라 미리 알립니다." },
          { text: "문제·해설·채점 결과는 학습 보조 정보이며 법률상담, 변호사 자문 또는 합격 보장 서비스가 아닙니다." },
        ],
      },
      {
        number: 5,
        title: "회원가입 및 계정 관리",
        clauses: [
          {
            text: "회원가입은 이메일 주소와 비밀번호를 입력하고 이용약관과 개인정보처리방침을 확인·동의하여 신청합니다. 운영자는 다음 각 호의 경우 가입을 거부하거나 사후에 취소할 수 있습니다.",
            items: [
              { text: "타인의 명의·이메일 또는 허위 정보를 이용한 경우" },
              { text: "약관 위반으로 이용이 제한된 사람이 제한을 회피하여 신청한 경우" },
              { text: "부정행위를 목적으로 계정을 생성한다고 합리적으로 판단되는 경우" },
              { text: "그 밖에 법령 위반 또는 명백한 기술적 장애로 승낙하기 어려운 경우" },
            ],
          },
          { text: "현재 운영 환경에서는 이메일 소유 확인 절차가 생략될 수 있습니다. 회원은 자신이 적법하게 사용할 수 있는 이메일 주소를 입력해야 합니다." },
          { text: "회원은 이메일과 비밀번호 등 계정 정보를 안전하게 관리해야 합니다. 운영자의 귀책사유가 없는 회원의 관리 소홀로 발생한 손해는 회원이 부담합니다." },
          { text: "회원은 계정을 양도하거나 대여하거나 타인과 공유할 수 없습니다." },
          { text: "계정 정보의 열람·정정·삭제는 운영자 이메일 haryun@knu.ac.kr로 요청할 수 있습니다." },
        ],
      },
      {
        number: 6,
        title: "미성년자",
        clauses: [
          { text: "서비스는 만 14세 미만 아동을 대상으로 설계되지 않았습니다. 법정대리인의 적법한 동의 없이 만 14세 미만 아동의 개인정보가 처리된 사실을 확인하면 이를 삭제하거나 필요한 보호조치를 합니다." },
          { text: "만 19세 미만의 미성년자를 대상으로 유료결제를 제공하게 되는 경우 법정대리인 동의와 계약 취소 가능성을 결제 전에 별도로 고지합니다." },
          { text: "미성년자가 법정대리인의 동의 없이 유료 계약을 체결한 경우 본인이나 법정대리인은 관계 법령에 따라 계약을 취소할 수 있습니다. 다만 미성년자가 성년자이거나 법정대리인의 동의가 있는 것으로 믿게 한 경우에는 취소가 제한될 수 있습니다." },
        ],
      },
      {
        number: 7,
        title: "계정 탈퇴와 계약 해지",
        clauses: [
          { text: "회원은 언제든지 haryun@knu.ac.kr로 탈퇴를 요청할 수 있습니다." },
          {
            text: "탈퇴 요청이 처리되면 계정과 Premium 데이터는 지체 없이 삭제하는 것을 원칙으로 합니다. 다만 다음 각 호의 정보는 예외로 합니다.",
            items: [
              { text: "관계 법령에 따라 보존해야 하는 거래·분쟁 기록은 해당 기간 동안 다른 정보와 분리하여 보관합니다." },
              { text: "보안 사고나 진행 중인 분쟁의 처리를 위해 필요한 최소 정보는 해당 목적이 끝날 때까지 보관할 수 있습니다." },
            ],
          },
          { text: "오프라인 데이터는 운영자가 보유하지 않으므로 탈퇴해도 자동으로 삭제되지 않습니다. 이용자가 환경설정 또는 브라우저 기능으로 직접 삭제해야 합니다." },
          { text: "운영자는 회원이 약관을 위반하거나 부정행위를 한 경우 위반의 경중을 고려해 이용을 제한하거나 계약을 해지할 수 있습니다. 원칙적으로 사유와 이의제기 방법을 미리 알리며 긴급한 경우 사후에 알릴 수 있습니다." },
        ],
      },
    ],
  },
  {
    number: 3,
    title: "이용자 의무 및 부정행위 제재",
    articles: [
      {
        number: 8,
        title: "이용자의 의무 및 금지행위",
        clauses: [
          {
            text: "이용자는 관계 법령을 준수해야 하며 다음 각 호의 행위를 해서는 안 됩니다.",
            items: [
              { text: "타인의 계정을 무단 사용하거나 계정을 공유하는 행위" },
              { text: "동일인 또는 자동화 수단으로 계정을 대량 생성하는 행위" },
              { text: "DDoS, 스크래핑 봇 등으로 서버에 과도한 부하를 주거나 운영을 방해하는 행위" },
              { text: "접근 통제를 우회하거나 기술적 보호조치를 해제하는 행위" },
              { text: "Premium 콘텐츠를 무단으로 캡처·녹화·복제·배포하거나 영리 목적으로 이용하는 행위" },
              { text: "자동화 도구로 서비스에 접근하거나 콘텐츠를 수집하는 행위" },
              { text: "프로모션 코드를 부정하게 취득하거나 위조·변조하는 행위" },
              { text: "타인의 개인정보 또는 민감정보를 적법한 근거 없이 처리하는 행위" },
              { text: "운영자 또는 제3자를 사칭하거나 허위 정보를 제공하는 행위" },
              { text: "그 밖에 공서양속 또는 관계 법령에 위반하는 행위" },
            ],
          },
          {
            text: "운영자는 제1항을 위반한 이용자에게 위반의 경중과 반복 여부를 고려해 다음 각 호의 조치를 할 수 있습니다.",
            items: [
              { text: "서비스 이용의 일시 정지" },
              { text: "계정 차단" },
              { text: "계약 해지와 계정 삭제" },
              { text: "실제 발생한 손해의 배상 청구" },
              { text: "수사기관 신고 등 필요한 법적 조치" },
            ],
          },
          { text: "운영자는 원칙적으로 조치 전에 사유와 이의제기 방법을 알립니다. 서버 공격 등 즉각적인 대응이 필요한 경우 먼저 이용을 제한하고 사후에 알릴 수 있습니다." },
        ],
      },
      {
        number: 9,
        title: "사용자 업로드 콘텐츠",
        clauses: [
          { text: "오프라인 기능에서 업로드한 CSV 파일은 이용자의 브라우저 안에서만 처리되며 운영자 서버로 전송·저장되지 않습니다." },
          {
            text: "이용자는 업로드 자료를 이용할 적법한 권한을 보유해야 하며 다음 각 호의 자료를 사용해서는 안 됩니다.",
            items: [
              { text: "타인의 저작권을 침해하는 자료" },
              { text: "타인의 영업비밀을 포함한 자료" },
              { text: "타인의 개인정보를 무단으로 포함한 자료" },
              { text: "그 밖에 관계 법령을 위반하는 자료" },
            ],
          },
          { text: "운영자는 브라우저 안에서만 처리되는 파일을 열람하거나 검열하지 않습니다. 업로드 자료로 제3자의 권리를 침해한 경우 해당 이용자가 책임을 부담합니다." },
        ],
      },
      {
        number: 10,
        title: "지식재산권",
        clauses: [
          { text: "서비스의 화면, 프로그램, 브랜드와 운영자가 작성한 콘텐츠에 관한 지식재산권은 운영자에게 있습니다." },
          { text: "Premium 문제·해설 등 콘텐츠의 권리는 운영자 또는 적법한 권리자에게 있습니다." },
          { text: "오프라인 기능에서 이용자가 업로드한 자료의 권리는 해당 권리자에게 있으며 운영자는 그 자료에 관한 권리를 취득하지 않습니다." },
          { text: "이용자는 서비스 콘텐츠를 허용된 개인 학습 범위에서만 이용할 수 있으며 운영자의 명시적 동의 없이 복제·배포·전송·수정하거나 영리 목적으로 이용할 수 없습니다." },
        ],
      },
      {
        number: 11,
        title: "Premium 콘텐츠 보호",
        clauses: [
          { text: "Premium 콘텐츠는 저작권 보호를 위해 CSV 다운로드나 외부 내보내기 기능을 제공하지 않습니다." },
          { text: "이용자는 Premium 콘텐츠를 캡처·녹화·복사 등으로 추출하여 제3자에게 제공해서는 안 됩니다. 다만 관계 법령이 허용하는 정당한 이용까지 제한하지 않습니다." },
          { text: "하나의 계정을 여러 사람이 함께 사용하거나 계정 정보를 타인과 공유해서는 안 됩니다." },
          { text: "자동화 프로그램·봇·스크래핑 도구 등을 이용한 Premium 콘텐츠 수집은 금지됩니다." },
        ],
      },
    ],
  },
  {
    number: 4,
    title: "이용권 및 프로모션 코드",
    articles: [
      {
        number: 12,
        title: "선불 이용권의 유효기간과 이용 조건",
        clauses: [
          { text: "Premium 이용권은 자동 결제·자동 연장이 없는 선불 기간제 이용권입니다." },
          { text: "현재 이용권은 프로모션 코드로만 취득할 수 있으며 카드와 무통장입금 등 금전 결제수단은 비활성화되어 있습니다." },
          { text: "이용권의 유효기간은 이용권이 활성화된 시점부터 한국 표준시(KST)를 기준으로 계산하며 상품 화면에 표시된 기간이 지나면 만료됩니다." },
          { text: "유효기간 중 실제로 이용하지 않은 경우에도 기간은 계속 경과합니다." },
          { text: "Premium 회원권을 중복 취득하면 새 기간은 활성·예약된 Premium 회원권 중 가장 늦은 종료 시점 다음부터 이어집니다." },
        ],
      },
      {
        number: 13,
        title: "Premium 회원권과 과목 이용권의 관계",
        notice: "이 조는 이용 권한에 직접 영향을 미치는 중요 사항입니다.",
        clauses: [
          {
            text: "Premium 온라인 과목을 이용하려면 다음 각 호의 이용권을 모두 보유해야 합니다.",
            items: [
              { text: "Premium 회원권: Premium 기능 이용과 과목 이용권 취득의 전제 조건" },
              { text: "과목 이용권: 특정 과목의 문제 세트를 이용할 수 있는 권한" },
            ],
          },
          { text: "Premium 회원권이 만료되면 과목 이용권의 기간이 남아 있더라도 해당 과목을 이용할 수 없습니다." },
          { text: "Premium 회원권이 만료되어 과목을 이용하지 못하는 동안에도 과목 이용권의 유효기간은 계속 경과합니다." },
          { text: "이 조의 조건은 이용자에게 불리하게 소급 변경되지 않습니다." },
        ],
      },
      {
        number: 14,
        title: "풀이 횟수 제한",
        clauses: [
          { text: "상품에 따라 문제 세트별 풀이 세션 생성 횟수가 제한될 수 있으며 구체적인 횟수는 상품 화면에 표시합니다." },
          { text: "단답형은 입력 문자열의 정확한 일치를 기준으로 채점하므로 띄어쓰기·맞춤법·표현 차이로 오답 처리될 수 있습니다. 채점 결과에 이의가 있으면 제20조에 따라 신고할 수 있습니다." },
          { text: "재풀이는 기존 기록을 덮어쓰지 않고 새 세션으로 누적됩니다." },
        ],
      },
      {
        number: 15,
        title: "프로모션 코드",
        clauses: [
          { text: "운영자는 특정 상품의 이용권을 0원으로 생성하는 16자리 일회용 프로모션 코드를 발급할 수 있습니다." },
          { text: "각 코드는 한 번만 사용할 수 있으며 이미 사용된 코드는 재사용할 수 없습니다." },
          { text: "코드에는 대상 상품·유효기간·사용 상태가 설정될 수 있으며 조건에 맞지 않는 코드는 사용할 수 없습니다." },
          { text: "프로모션 코드는 현금으로 교환하거나 타인에게 양도·재판매할 수 없습니다." },
          { text: "무상 배포된 코드로 생성한 이용권에는 금전적 환불이 발생하지 않습니다." },
          { text: "시스템·코드 생성 오류 또는 부정 사용이 확인되면 운영자는 사유를 알리고 코드 사용과 이용권을 취소할 수 있으며 이용자에게 이의제기 기회를 제공합니다." },
          { text: "부정하게 취득하거나 위조·변조한 코드를 사용해서는 안 됩니다." },
        ],
      },
      {
        number: 16,
        title: "청약철회, 계약 해제·해지 및 환불",
        clauses: [
          { text: "현재는 프로모션 코드를 통한 0원 주문만 제공하므로 금전 환불이 발생하지 않습니다." },
          { text: "운영자의 귀책사유로 이용권을 정상적으로 사용하지 못한 경우 운영자는 장애 기간과 영향을 고려해 이용권 연장 등 합리적인 조치를 제공합니다." },
          {
            text: "향후 유료결제를 활성화하는 경우 다음 각 호의 원칙을 구체적인 환불 기준과 함께 별도로 고지한 뒤 적용합니다.",
            items: [
              { text: "소비자는 관계 법령에서 정한 기간 안에 청약을 철회할 수 있습니다." },
              { text: "디지털콘텐츠 제공이 개시된 부분은 적법한 사전 고지와 조치가 있는 경우 청약철회가 제한될 수 있으나, 가분적인 미사용 부분과 법령상 권리는 제한하지 않습니다." },
              { text: "정답 또는 해설을 한 번 열람했다는 이유만으로 잔여 이용권 전체의 환불을 일률적으로 거부하지 않습니다." },
              { text: "적법한 청약철회에 따른 환급은 관계 법령이 정한 기간과 방법에 따르며 과오금은 확인 후 환급합니다." },
            ],
          },
        ],
      },
    ],
  },
  {
    number: 5,
    title: "서비스 변경·중단 및 데이터",
    articles: [
      {
        number: 17,
        title: "서비스 변경·점검·중단·종료와 이용자 보호",
        clauses: [
          {
            text: "운영자는 다음 각 호의 경우 서비스의 전부 또는 일부를 일시 중단할 수 있습니다.",
            items: [
              { text: "정기 또는 긴급 점검" },
              { text: "서버·통신 장비의 장애" },
              { text: "천재지변, 정전 또는 그 밖의 불가항력" },
            ],
          },
          { text: "예정된 점검은 미리 알리고 긴급 사유로 미리 알릴 수 없었던 경우에는 사후에 알립니다." },
          { text: "유료결제 활성화 후 운영자의 귀책사유로 유료 서비스를 이용하지 못한 경우에는 관계 법령과 별도 고지한 기준에 따라 이용권 연장 또는 환급 등 합리적인 보상을 제공합니다." },
          { text: "서비스 전체를 종료하는 경우 원칙적으로 종료일 30일 전에 알리고, 유료 이용권이 있다면 잔여 기간의 처리 방법을 함께 안내합니다." },
          { text: "운영자의 고의 또는 중대한 과실로 인한 책임은 이 조로 면제되지 않습니다." },
        ],
      },
      {
        number: 18,
        title: "오프라인 데이터의 저장 및 백업 책임",
        clauses: [
          { text: "오프라인 데이터는 이용자 기기의 브라우저 localStorage에만 저장되며 운영자 서버로 전송·동기화되지 않습니다." },
          {
            text: "다음 각 호의 경우 오프라인 데이터가 삭제되거나 접근할 수 없게 될 수 있습니다.",
            items: [
              { text: "브라우저의 캐시·쿠키·사이트 데이터를 삭제한 경우" },
              { text: "시크릿 모드 사용 후 창을 닫은 경우" },
              { text: "다른 기기나 브라우저에서 접속한 경우" },
              { text: "브라우저 저장공간이 부족하거나 제한된 경우" },
              { text: "기기를 교체하거나 초기화한 경우" },
            ],
          },
          { text: "이용자는 JSON 백업 기능을 이용해 중요한 데이터를 정기적으로 백업해야 합니다. 운영자는 원본을 보유하지 않으므로 유실된 오프라인 데이터를 복구할 수 없습니다." },
          { text: "운영자의 고의 또는 중대한 과실로 발생한 경우를 제외하고 운영자는 오프라인 데이터 유실에 책임을 지지 않습니다." },
        ],
      },
      {
        number: 19,
        title: "서버 데이터의 보존·삭제와 탈퇴 후 처리",
        clauses: [
          { text: "Premium 데이터는 Supabase 기반 서버에 저장되며 운영자는 합리적인 기술적·관리적 보호조치를 적용합니다." },
          {
            text: "서버 데이터는 다음 각 호의 기간 동안 보유합니다.",
            items: [
              { text: "계정 정보와 Premium 학습 기록: 회원 탈퇴, 삭제 요청 또는 처리 목적 달성 시까지" },
              { text: "표시·광고 기록: 법정 보존의무가 적용되는 경우 6개월" },
              { text: "계약·청약철회 및 대금결제·공급 기록: 법정 보존의무가 적용되는 경우 5년" },
              { text: "소비자 불만·분쟁 기록: 법정 보존의무가 적용되는 경우 3년" },
            ],
          },
          { text: "Premium 데이터는 오프라인 JSON 백업에 포함되지 않습니다. 개인정보 열람·삭제 요청 방법은 개인정보처리방침에서 안내합니다." },
        ],
      },
    ],
  },
  {
    number: 6,
    title: "채점·콘텐츠 및 책임",
    articles: [
      {
        number: 20,
        title: "채점 오류 및 콘텐츠 오류의 신고와 정정",
        clauses: [
          { text: "이용자는 문제·해설·정답 또는 채점 결과의 명백한 오류를 haryun@knu.ac.kr로 신고할 수 있습니다." },
          { text: "운영자는 신고를 합리적인 기간 안에 확인하고 결과를 알립니다." },
          { text: "오류가 확인되면 문제 수정, 재채점 또는 재풀이 기회 제공 등 합리적인 조치를 할 수 있습니다." },
          { text: "단답형은 정확한 문자열 일치를 기준으로 하므로 띄어쓰기·맞춤법·동의어 차이에 따른 결과는 시스템 오류로 보지 않을 수 있습니다. 다만 정답 데이터나 채점 시스템의 명백한 오류는 정정을 요청할 수 있습니다." },
        ],
      },
      {
        number: 21,
        title: "교육 목적 및 법률자문·합격 보장 부인",
        clauses: [
          { text: "문제·해설·채점 결과는 법학전문대학원 재학생과 변호사시험·법조윤리시험 수험생을 위한 학습 보조 정보입니다." },
          {
            text: "서비스는 다음 각 호에 해당하지 않습니다.",
            items: [
              { text: "변호사법에 따른 법률상담 또는 법률 자문" },
              { text: "개인의 구체적인 법적 상황에 대한 조언이나 판단" },
              { text: "특정 시험의 합격 또는 특정 점수 취득을 보장하는 서비스" },
            ],
          },
          { text: "이용자는 서비스 정보를 개인의 법적 판단이나 의사결정의 유일한 근거로 사용해서는 안 됩니다." },
        ],
      },
      {
        number: 22,
        title: "LBTI의 비진단성",
        clauses: [
          { text: "LBTI는 오락과 자기점검을 목적으로 하는 미니 앱입니다." },
          {
            text: "LBTI는 다음 각 호에 해당하지 않습니다.",
            items: [
              { text: "심리검사 또는 정신건강 진단" },
              { text: "표준화된 성격검사 또는 학업 능력 평가" },
              { text: "성적 또는 합격 가능성의 예측·보장" },
            ],
          },
          { text: "결과는 학습 성향을 오락적으로 표현한 것으로 개인의 역량·능력·성격에 대한 과학적·전문적 판단이 아닙니다." },
          { text: "질문별 답변과 점수는 서버 또는 localStorage에 저장하지 않으며 공유 URL에는 최종 4자 유형 코드만 포함합니다." },
        ],
      },
      {
        number: 23,
        title: "운영자의 책임 제한",
        clauses: [
          { text: "운영자의 고의 또는 중대한 과실로 발생한 손해에 대한 책임과 강행법규가 보장하는 이용자의 권리는 이 조로 제한되지 않습니다." },
          {
            text: "다음 각 호의 사유로 발생한 손해에 운영자의 귀책사유가 없는 경우 운영자는 책임을 지지 않습니다.",
            items: [
              { text: "이용자의 귀책사유로 발생한 이용 장애" },
              { text: "이용자가 오프라인 데이터를 백업하지 않아 발생한 유실" },
              { text: "브라우저 설정이나 저장공간 부족 등 이용자 기기 환경으로 인한 장애" },
              { text: "천재지변, 전쟁, 정전, 국가 비상사태 등 불가항력" },
              { text: "인터넷 서비스 제공업체, Supabase, Google 등 제3자의 귀책사유로 인한 장애" },
              { text: "이용자가 직접 업로드한 CSV 파일의 오류" },
            ],
          },
          { text: "운영자는 서비스의 완전성·정확성·적시성이나 시험 결과를 보장하지 않습니다. 다만 콘텐츠와 시스템의 오류를 알게 된 경우 합리적인 범위에서 이를 확인하고 개선합니다." },
        ],
      },
      {
        number: 24,
        title: "이용자의 손해배상",
        clauses: [
          { text: "이용자가 약관을 위반하거나 고의·과실로 운영자에게 손해를 끼친 경우 실제 발생하고 상당인과관계가 있는 손해를 배상해야 합니다." },
          { text: "Premium 콘텐츠 무단 배포, 계정 공유, 스크래핑, 서비스 공격 등으로 발생한 실질적 손해도 제1항에 따릅니다." },
          { text: "이용자에게 귀책사유가 없는 경우에는 손해배상 책임을 지지 않습니다." },
        ],
      },
    ],
  },
  {
    number: 7,
    title: "개인정보·통지 및 분쟁",
    articles: [
      {
        number: 25,
        title: "개인정보처리방침과의 관계",
        clauses: [
          { text: "운영자는 관계 법령에 따라 개인정보를 처리하며 자세한 사항은 별도의 개인정보처리방침에서 정합니다." },
          { text: "개인정보에 관한 내용이 이 약관과 개인정보처리방침에서 다르면 정보주체에게 유리한 내용과 관계 법령을 우선 적용합니다." },
          {
            text: "서비스의 주요 데이터 처리 방식은 다음 각 호와 같습니다.",
            items: [
              { text: "오프라인 기능: 학습 데이터는 브라우저 localStorage에만 저장되며 운영자 서버에 저장되지 않습니다." },
              { text: "계정·Premium 기능: 이메일, 표시 이름, 이용권과 온라인 학습 기록이 서버에 저장됩니다." },
              { text: "Google Analytics 4: 허용된 범위의 이용 통계를 처리하며 상세 항목과 거부 방법은 개인정보처리방침에서 안내합니다." },
            ],
          },
        ],
      },
      {
        number: 26,
        title: "운영자 정보 및 통지 방법",
        clauses: [
          {
            text: "현재 서비스 운영자 정보는 다음 각 호와 같습니다.",
            items: [
              { text: "운영자: 신하륜" },
              { text: "소속: 경북대학교 법학전문대학원 17기" },
              { text: "이메일: haryun@knu.ac.kr" },
              { text: "도메인: lawsolver.haryun.io" },
            ],
          },
          { text: "유료결제를 활성화할 때에는 관계 법령에 따라 상호·대표자, 사업자등록번호, 통신판매업 신고번호, 주소와 전화번호 등 필요한 사업자 정보를 추가로 표시합니다." },
          { text: "전체 이용자에 대한 통지는 서비스 화면에 게시하고 개별 회원에 대한 통지는 등록 이메일로 할 수 있습니다." },
          { text: "회원은 정확한 이메일 주소를 유지해야 합니다. 운영자는 이메일 오류가 있더라도 중요한 사항을 서비스 화면에 함께 게시하도록 노력합니다." },
          { text: "서비스 관련 문의는 haryun@knu.ac.kr로 할 수 있습니다." },
        ],
      },
      {
        number: 27,
        title: "준거법과 분쟁 해결",
        clauses: [
          { text: "이 약관과 서비스 이용계약에는 대한민국 법령을 적용합니다." },
          { text: "분쟁이 발생하면 운영자와 이용자는 우선 상호 협의하여 해결하도록 노력합니다." },
          { text: "협의로 해결되지 않으면 한국소비자원, 전자거래분쟁조정위원회 등 관계 기관의 조정 절차를 이용할 수 있습니다." },
          { text: "소송은 「민사소송법」에 따른 관할법원에 제기합니다." },
        ],
      },
    ],
  },
  {
    number: 8,
    title: "부칙",
    articles: [
      {
        number: 28,
        title: "시행일",
        opening: "이 약관은 2026년 7월 25일부터 시행합니다.",
      },
      {
        number: 29,
        title: "이전 약관의 확인",
        opening: "이전 약관이 존재하는 경우 운영자 이메일로 요청하여 확인할 수 있습니다.",
      },
    ],
  },
];

const defaultLinkClass =
  "text-stone-400 transition hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300";

function LegalItems({ items }: { items: LegalItem[] }) {
  return (
    <div className="mt-2 space-y-1.5 pl-5">
      {items.map((item, itemIndex) => (
        <div key={itemIndex} className="grid grid-cols-[1.25rem_1fr] gap-1">
          <span aria-hidden="true">{itemIndex + 1}.</span>
          <div>
            <p>{item.text}</p>
            {item.children ? (
              <div className="mt-1 space-y-1">
                {item.children.map((child, childIndex) => (
                  <div key={childIndex} className="grid grid-cols-[1.25rem_1fr] gap-1">
                    <span aria-hidden="true">{koreanLetters[childIndex]}.</span>
                    <p>{child}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function LegalArticleContent({ article }: { article: LegalArticle }) {
  return (
    <section>
      <h4 className="text-base font-bold text-stone-900 dark:text-stone-100">
        제{article.number}조 ({article.title})
      </h4>
      {article.notice ? (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 font-semibold text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
          {article.notice}
        </p>
      ) : null}
      {article.opening ? <p className="mt-3">{article.opening}</p> : null}
      {article.items ? <LegalItems items={article.items} /> : null}
      {article.clauses ? (
        <div className="mt-3 space-y-2.5">
          {article.clauses.map((clause, clauseIndex) => (
            <div key={clauseIndex} className="grid grid-cols-[1.5rem_1fr] gap-1">
              <span aria-label={`제${clauseIndex + 1}항`}>
                {circledNumbers[clauseIndex]}
              </span>
              <div>
                <p>{clause.text}</p>
                {clause.items ? <LegalItems items={clause.items} /> : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

interface TermsOfServiceLinkProps {
  className?: string;
}

export function TermsOfServiceLink({ className = defaultLinkClass }: TermsOfServiceLinkProps) {
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
      <button type="button" onClick={() => setIsOpen(true)} className={className}>
        이용약관
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 text-left"
          role="dialog"
          aria-modal="true"
          aria-labelledby="terms-of-service-title"
        >
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="app-modal-backdrop absolute inset-0"
            aria-label="이용약관 닫기"
          />
          <section className="app-modal-surface relative max-h-[88vh] w-full max-w-4xl overflow-y-auto rounded-2xl border p-5 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold tracking-[0.16em] text-red-600 dark:text-red-400">
                  TERMS OF SERVICE
                </p>
                <h2
                  id="terms-of-service-title"
                  className="mt-2 text-xl font-bold text-stone-950 dark:text-stone-100 sm:text-2xl"
                >
                  Law Solver 서비스 이용약관
                </h2>
                <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
                  시행일: 2026년 7월 25일
                </p>
              </div>
              <IconCloseButton onClick={() => setIsOpen(false)} label="이용약관 닫기" />
            </div>

            <div className="mt-7 space-y-9 text-sm leading-7 text-stone-600 dark:text-stone-300">
              {chapters.map((chapter) => (
                <section key={chapter.number}>
                  <h3 className="border-b border-stone-200 pb-2 text-lg font-bold text-stone-950 dark:border-stone-700 dark:text-stone-100">
                    제{chapter.number}장 {chapter.title}
                  </h3>
                  <div className="mt-5 space-y-7">
                    {chapter.articles.map((article) => (
                      <LegalArticleContent key={article.number} article={article} />
                    ))}
                  </div>
                </section>
              ))}
            </div>

            <div className="mt-8 flex justify-end">
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
