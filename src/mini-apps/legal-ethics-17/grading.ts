import { legalEthicsAnswers, type LegalEthicsAnswer } from "./data";

export interface ParsedLegalEthicsAnswers {
  answers: LegalEthicsAnswer["answer"][];
  invalidDigits: string[];
}

export interface IncorrectLegalEthicsAnswer {
  number: number;
  submitted: LegalEthicsAnswer["answer"];
  correct: LegalEthicsAnswer["answer"];
}

export interface LegalEthicsGrade {
  correctCount: number;
  incorrectCount: number;
  score: number;
  incorrectAnswers: IncorrectLegalEthicsAnswer[];
}

export function parseLegalEthicsAnswers(value: string): ParsedLegalEthicsAnswers {
  const digits = value.match(/[0-9]/g) ?? [];
  const invalidDigits = digits.filter((digit) => !/^[1-4]$/.test(digit));
  const answers = digits
    .filter((digit) => /^[1-4]$/.test(digit))
    .map((digit) => Number(digit) as LegalEthicsAnswer["answer"]);

  return { answers, invalidDigits };
}

export function gradeLegalEthicsAnswers(
  submitted: readonly LegalEthicsAnswer["answer"][],
): LegalEthicsGrade | null {
  if (submitted.length !== legalEthicsAnswers.length) return null;

  const incorrectAnswers = legalEthicsAnswers.flatMap((item, index) => {
    const answer = submitted[index]!;
    return answer === item.answer
      ? []
      : [{ number: item.number, submitted: answer, correct: item.answer }];
  });
  const correctCount = legalEthicsAnswers.length - incorrectAnswers.length;

  return {
    correctCount,
    incorrectCount: incorrectAnswers.length,
    score: correctCount * 2.5,
    incorrectAnswers,
  };
}
