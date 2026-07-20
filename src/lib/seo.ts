import framework from "../mini-apps/lbti/data/lbti-framework.json";

export const SITE_ORIGIN = "https://lawsolver.haryun.io";
export const SITE_NAME = "Law Solver";
export const DEFAULT_DESCRIPTION =
  "OX, 5지선다, 단답형 문제를 직접 만들고 시험처럼 풀어 바로 복습하는 로스쿨 문제 풀이 앱";

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
    title: "Law Solver | 로스쿨 문제 풀이와 복습",
    description: DEFAULT_DESCRIPTION,
    indexable: true,
    canonicalPath: "/",
  },
  "/apps": {
    title: "Law Solver 미니 앱 | 로스쿨 공부 도구",
    description: "문제 풀이부터 공부 유형 테스트까지 로스쿨 생활에 필요한 미니 앱을 한곳에서 만나보세요.",
    indexable: true,
    canonicalPath: "/apps/",
  },
  "/apps/lbti": {
    title: "LBTI | 로스쿨생 공부 유형 테스트",
    description: "30개의 질문으로 원전과 수험자료, 회독과 현출 등 나의 로스쿨 공부 의사결정 유형을 알아보세요.",
    indexable: true,
    canonicalPath: "/apps/lbti/",
  },
  "/apps/lbti/types": {
    title: "LBTI 16가지 공부 유형 | Law Solver",
    description: "로스쿨 공부 습관을 네 가지 선택 축으로 나눈 LBTI 16가지 유형과 각 유형의 특징을 살펴보세요.",
    indexable: true,
    canonicalPath: "/apps/lbti/types/",
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
        title: `${type.code} ${type.name} | LBTI`,
        description: `${type.description} LBTI ${type.code} 유형의 강점과 공부 팁을 확인해 보세요.`,
        indexable: true,
        canonicalPath: toCanonicalPath(routePath),
      };
    }
    return privateMetadata("LBTI 유형을 찾을 수 없음 | Law Solver");
  }

  if (routePath === "/apps/lbti/test") {
    return privateMetadata(
      "LBTI 테스트 | Law Solver",
      "30개의 질문에 답하고 나의 로스쿨 공부 의사결정 유형을 확인해 보세요.",
    );
  }
  if (routePath === "/dashboard") return privateMetadata("과목 대시보드 | Law Solver");
  if (routePath.startsWith("/dashboard/")) return privateMetadata("문제 대시보드 | Law Solver");
  if (routePath.startsWith("/solve/")) return privateMetadata("문제 풀이 | Law Solver");
  if (routePath.startsWith("/result/")) return privateMetadata("풀이 결과 | Law Solver");
  if (routePath.startsWith("/wrong/") || routePath.startsWith("/review/")) {
    return privateMetadata("문제 리뷰 | Law Solver");
  }

  return privateMetadata("페이지를 찾을 수 없음 | Law Solver");
}

export const getCanonicalUrl = (metadata: SeoMetadata) =>
  metadata.canonicalPath ? `${SITE_ORIGIN}${metadata.canonicalPath}` : null;

export const INDEXABLE_PATHS = [
  "/",
  "/apps",
  "/apps/lbti",
  "/apps/lbti/types",
  ...framework.types.map((type) => `/apps/lbti/result/${type.code.toLowerCase()}`),
] as const;

export const STATIC_APP_SHELL_PATHS = [
  ...INDEXABLE_PATHS.filter((pathname) => pathname !== "/"),
  "/apps/lbti/test",
] as const;
