import { Link } from "react-router-dom";
import { LbtiLayout } from "./components/LbtiLayout";
import { LbtiTypeCode } from "./components/LbtiTypeCode";
import { lbtiTypes, type TypeCode } from "./lib/lbti";

export function LbtiTypesPage() {
  return (
    <LbtiLayout>
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <section className="max-w-3xl">
          <p className="text-xs font-bold tracking-[0.16em] text-red-600 dark:text-red-400">ALL 16 TYPES</p>
          <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-5xl">모든 LBTI 유형</h1>
          <p className="mt-5 text-base leading-7 text-stone-600 dark:text-stone-300">
            네 가지 공부 선택이 만나 16개의 수험 캐릭터가 됩니다. 궁금한 유형을 누르면 공유 가능한 상세 결과 페이지로 이동해요.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link to="/apps/lbti/test" className="app-button-primary app-button-primary-standalone rounded-xl px-6 py-3 text-center text-sm font-bold">내 유형 테스트하기</Link>
            <Link to="/apps/lbti" className="app-button-secondary rounded-xl px-6 py-3 text-center text-sm font-bold">LBTI 소개로</Link>
          </div>
        </section>

        <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:mt-14 lg:grid-cols-4" aria-label="LBTI 16개 유형 목록">
          {lbtiTypes.map((type, index) => (
            <Link
              key={type.code}
              to={`/apps/lbti/result/${type.code.toLowerCase()}`}
              className="app-card group rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:border-red-300 hover:shadow-[var(--app-shadow-hover)] dark:hover:border-red-800"
            >
              <div className="flex items-center justify-between gap-3">
                <LbtiTypeCode code={type.code as TypeCode} />
                <span className="text-xs font-bold text-stone-300 dark:text-stone-600">{String(index + 1).padStart(2, "0")}</span>
              </div>
              <h2 className="mt-4 text-lg font-black tracking-tight group-hover:text-red-600 dark:group-hover:text-red-400">{type.name}</h2>
              <p className="mt-2 line-clamp-4 text-sm leading-6 text-stone-500 dark:text-stone-400">{type.description}</p>
              <span className="mt-4 inline-flex text-xs font-bold text-red-600 dark:text-red-400">유형 설명 보기 →</span>
            </Link>
          ))}
        </section>
      </main>
    </LbtiLayout>
  );
}
