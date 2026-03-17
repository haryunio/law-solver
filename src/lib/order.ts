import { ParsedQuestion, SolveOrder } from "../types/test";

const shuffle = <T>(items: T[], rng: () => number) => {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = next[i];
    next[i] = next[j] as T;
    next[j] = tmp as T;
  }
  return next;
};

export const orderQuestions = (
  questions: ParsedQuestion[],
  orderMode: SolveOrder,
  rng: () => number = Math.random,
) => {
  if (orderMode === "number") {
    return [...questions].sort((a, b) => a.no - b.no);
  }

  if (orderMode === "random") {
    return shuffle(questions, rng);
  }

  const chapterMap = new Map<string, ParsedQuestion[]>();
  const chapterOrder: string[] = [];

  for (const question of questions) {
    const key = question.chapter?.trim() || "__no_chapter__";
    if (!chapterMap.has(key)) {
      chapterMap.set(key, []);
      chapterOrder.push(key);
    }
    chapterMap.get(key)?.push(question);
  }

  return chapterOrder.flatMap((chapterKey) => {
    const chapterQuestions = chapterMap.get(chapterKey) ?? [];
    return shuffle(chapterQuestions, rng);
  });
};

