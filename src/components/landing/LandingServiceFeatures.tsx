import { Link } from "react-router-dom";
import { miniApps } from "../../mini-apps/catalog";
import { PremiumBadge } from "../ui/PremiumBadge";
import { LandingFeatureCard } from "./LandingFeatureCard";

const availableMiniApps = miniApps.flatMap((app) => (
  app.status === "coming-soon" || !app.route ? [] : [{ ...app, route: app.route }]
));

export function LandingServiceFeatures() {
  return (
    <div className="mt-5 grid gap-5 lg:grid-cols-3">
      <LandingFeatureCard
        label="ONLINE STUDY"
        title="준비된 온라인 문제로 바로 공부"
        description="CSV를 준비하지 않아도 과목별 문제를 풀 수 있어요. 답안과 풀이 기록은 계정에 저장되고, 오답이나 책갈피 문제를 다시 푼 기록도 따로 남아요."
        icon="▤"
        premium
      >
        <p className="mt-4 text-sm leading-6 text-stone-500 dark:text-stone-400">
          활성 Premium 회원권과 해당 과목 이용권이 필요해요. 온라인 문제와 결과는 파일로 내려받을 수 없어요.
        </p>
        <Link to="/account" className="landing-text-button mt-auto inline-flex items-center gap-2 pt-5">
          계정과 이용권 확인하기 <span aria-hidden="true">→</span>
        </Link>
      </LandingFeatureCard>

      <LandingFeatureCard
        label="CLOUD BACKUP"
        title="다른 기기에서도 내 문제 그대로"
        description="오프라인 문제와 풀이 기록을 비밀번호로 암호화해 클라우드에 보관할 수 있어요. 다른 기기에서는 같은 비밀번호로 백업을 복구해 주세요."
        icon="⇧"
        premium
      >
        <p className="mt-4 text-sm leading-6 text-stone-500 dark:text-stone-400">
          백업과 복구는 직접 실행해요. 자동으로 동기화되지 않으며, 미니 앱 데이터는 백업에 포함되지 않아요.
        </p>
        <Link to="/settings" className="landing-text-button mt-auto inline-flex items-center gap-2 pt-5">
          백업 설정 열기 <span aria-hidden="true">→</span>
        </Link>
      </LandingFeatureCard>

      <LandingFeatureCard
        label="MINI APPS"
        title="공부 사이에 쓰는 미니 앱"
        description="로스쿨 생활에 필요한 작은 도구도 함께 준비했어요. 지금 사용할 수 있는 앱을 만나보세요."
        icon="▦"
      >
        <ul className="mt-4 divide-y divide-stone-200 dark:divide-stone-700">
          {availableMiniApps.map((app) => (
            <li key={app.id}>
              <Link to={app.route} className="flex flex-wrap items-center gap-2 py-3 text-sm leading-6 text-stone-700 hover:text-red-600 dark:text-stone-300 dark:hover:text-red-400">
                <span>{app.name}</span>
                {app.premium ? <PremiumBadge /> : null}
              </Link>
            </li>
          ))}
        </ul>
        <Link to="/apps" className="landing-text-button mt-auto inline-flex items-center gap-2 pt-5">
          미니 앱 모두 보기 <span aria-hidden="true">→</span>
        </Link>
      </LandingFeatureCard>
    </div>
  );
}
