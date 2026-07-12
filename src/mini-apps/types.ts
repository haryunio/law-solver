export type MiniAppStatus = "coming-soon" | "beta" | "available";

export interface MiniAppDefinition {
  /** 영문 kebab-case 고유 ID. 폴더명과 localStorage namespace에 함께 사용합니다. */
  id: string;
  name: string;
  description: string;
  status: MiniAppStatus;
  /** 목록에서 사용하는 짧은 텍스트 아이콘입니다. */
  icon: string;
  /** 아이콘 표면의 Tailwind 색상 클래스만 둡니다. 크기와 배치는 목록 화면이 소유합니다. */
  iconClass: string;
  /** 출시된 앱만 설정합니다. 예: /apps/lbti */
  route?: `/apps/${string}`;
}
