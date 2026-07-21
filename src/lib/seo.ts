import framework from "../mini-apps/lbti/data/lbti-framework.json";

export const SITE_ORIGIN = "https://lawsolver.haryun.io";
export const SITE_NAME = "Law Solver";
export const SOCIAL_IMAGE_URL = `${SITE_ORIGIN}/og-image.png`;
export const SOCIAL_IMAGE_ALT = "Law Solver 문제 풀이 화면 미리보기";
export const DEFAULT_DESCRIPTION =
  "문제 만들기부터 복습과 오답 정리까지 한 번에. 로스쿨생이 만든 로스쿨 문제 풀이 앱";

export interface SeoMetadata {
  title: string;
  description: string;
  indexable: boolean;
  canonicalPath?: string;
}

const lbtiTypes = new Map(
  framework.types.map((type) => [type.code.toLowerCase(), type] as const),
);

const toRoutePath = (pathname: string) => {
  if (pathname === "/") return pathname;
  return pathname.replace(/\/+$/, "") || "/";
};

const toCanonicalPath = (pathname: string) =>
  pathname === "/" ? pathname : `${toRoutePath(pathname)}/`;

const publicMetadata: Record<string, SeoMetadata> = {
  "/": {
    title: "Law Solver",
    description: DEFAULT_DESCRIPTION,
    indexable: true,
    canonicalPath: "/",
  },
  "/apps": {
    title: "Law Solver | 미니 앱",
    description: "문제 풀이부터 공부 유형 테스트까지 로스쿨 생활에 필요한 미니 앱을 한곳에서 만나보세요.",
    indexable: true,
    canonicalPath: "/apps/",
  },
  "/apps/lbti": {
    title: "Law Solver | LBTI",
    description: "네 가지 로스쿨 공부 방식으로 알아보는 16가지 LBTI 유형과 특징을 살펴보세요.",
    indexable: true,
    canonicalPath: "/apps/lbti/",
  },
  "/apps/lbti/types": {
    title: "Law Solver | LBTI",
    description: "네 가지 로스쿨 공부 방식으로 알아보는 16가지 LBTI 유형과 특징을 살펴보세요.",
    indexable: true,
    canonicalPath: "/apps/lbti/types/",
  },
  "/dashboard": {
    title: "Law Solver | 대시보드",
    description: "과목별로 문제를 정리하고, 시험처럼 풀고, 바로 복습하세요.",
    indexable: true,
    canonicalPath: "/dashboard/",
  },
};

const privateMetadata = (title: string, description = DEFAULT_DESCRIPTION): SeoMetadata => ({
  title,
  description,
  indexable: false,
});

export function getSeoMetadata(pathname: string): SeoMetadata {
  const routePath = toRoutePath(pathname);
  const publicPage = publicMetadata[routePath];
  if (publicPage) return publicPage;

  const resultMatch = routePath.match(/^\/apps\/lbti\/result\/([^/]+)$/);
  if (resultMatch) {
    const typeCode = resultMatch[1]?.toLowerCase();
    const type = typeCode ? lbtiTypes.get(typeCode) : undefined;
    if (type) {
      return {
        title: "Law Solver | LBTI",
        description: `${type.description} LBTI ${type.code} 유형의 강점과 공부 팁을 확인해 보세요.`,
        indexable: true,
        canonicalPath: toCanonicalPath(routePath),
      };
    }
    return privateMetadata("Law Solver | LBTI");
  }

  if (routePath === "/apps/lbti/test") {
    return privateMetadata(
      "Law Solver | LBTI",
      "30개의 질문에 답하고 나의 로스쿨 공부 의사결정 유형을 확인해 보세요.",
    );
  }
  if (routePath === "/home") return privateMetadata("Law Solver");
  if (routePath === "/settings") return privateMetadata("Law Solver | 환경설정");
  if (routePath === "/account") return privateMetadata("Law Solver | 계정 및 구독");
  if (routePath === "/premium") return privateMetadata("Law Solver | 온라인 문제 풀이");
  if (routePath.startsWith("/dashboard/")) return privateMetadata("Law Solver | 대시보드");
  if (routePath.startsWith("/solve/")) return privateMetadata("Law Solver | 문제 풀이");
  if (routePath.startsWith("/result/")) return privateMetadata("Law Solver | 문제 풀이");
  if (routePath.startsWith("/wrong/") || routePath.startsWith("/review/")) {
    return privateMetadata("Law Solver | 문제 풀이");
  }

  return privateMetadata("Law Solver");
}

export const getCanonicalUrl = (metadata: SeoMetadata) =>
  metadata.canonicalPath ? `${SITE_ORIGIN}${metadata.canonicalPath}` : null;

export const INDEXABLE_PATHS = [
  "/",
  "/apps",
  "/apps/lbti",
  "/apps/lbti/types",
  "/dashboard",
  ...framework.types.map((type) => `/apps/lbti/result/${type.code.toLowerCase()}`),
] as const;

export const STATIC_APP_SHELL_PATHS = [
  ...INDEXABLE_PATHS.filter((pathname) => pathname !== "/"),
  "/apps/lbti/test",
  "/home",
  "/settings",
  "/account",
  "/premium",
] as const;
