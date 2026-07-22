import type { CSSProperties } from "react";
import type { SubjectCoverPalette } from "../types/test";

export const subjectCoverPalettes: Array<{
  id: SubjectCoverPalette;
  label: string;
  base?: [number, number, number];
}> = [
  { id: "warm", label: "노을", base: [8, 32, 50] },
  { id: "green", label: "새싹", base: [104, 78, 48] },
  { id: "blue", label: "바다", base: [218, 202, 188] },
  { id: "purple", label: "마법", base: [278, 304, 330] },
  { id: "gray", label: "우주" },
];

export const premiumOrangeCoverStyle: CSSProperties = {
  background:
    "linear-gradient(125deg, hsl(18 80% 46%), hsl(25 88% 54%) 52%, hsl(36 94% 59%))",
};

export const premiumOrangeAccentColor = "hsl(25 88% 54%)";

const defaultCoverPalette = subjectCoverPalettes[0]!;

const hashString = (value: string) =>
  [...value].reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0);

const normalizeSubjectName = (subjectName: string) => subjectName.trim().normalize("NFC");
const getSubjectNameHash = (subjectName: string) =>
  hashString(normalizeSubjectName(subjectName)) >>> 0;

const getPaletteById = (paletteId: SubjectCoverPalette) =>
  subjectCoverPalettes.find((palette) => palette.id === paletteId) ?? defaultCoverPalette;

export const getSubjectCoverStyle = (
  subjectName: string,
  paletteId: SubjectCoverPalette,
): CSSProperties => {
  const hash = Math.abs(hashString(subjectName));
  const palette = getPaletteById(paletteId);
  const angle = 105 + (hash % 151);

  if (palette.id === "gray") {
    const start = 16 + (hash % 8);
    const mid = 42 + ((hash >> 3) % 12);
    const end = 78 + ((hash >> 6) % 10);

    return {
      background: `linear-gradient(${angle}deg, hsl(0 0% ${start}%), hsl(0 0% ${mid}%) 52%, hsl(0 0% ${end}%))`,
    };
  }

  const [baseStart, baseMid, baseEnd] = palette?.base ?? [8, 32, 50];
  const start = baseStart + (hash % 12) - 6;
  const mid = baseMid + ((hash >> 3) % 12) - 6;
  const end = baseEnd + ((hash >> 6) % 12) - 6;

  return {
    background: `linear-gradient(${angle}deg, hsl(${start} 68% 50%), hsl(${mid} 72% 56%) 52%, hsl(${end} 78% 62%))`,
  };
};

export const getSubjectAccentColor = (paletteId: SubjectCoverPalette) => {
  const palette = getPaletteById(paletteId);
  if (palette.id === "gray") return "hsl(0 0% 46%)";

  const [, baseMid] = palette.base ?? defaultCoverPalette.base ?? [8, 32, 50];
  return `hsl(${baseMid} 72% 54%)`;
};

export const getPremiumSubjectCoverStyle = (subjectName: string): CSSProperties => {
  const hash = getSubjectNameHash(subjectName);
  const angle = 105 + (hash % 151);

  return {
    background: `linear-gradient(${angle}deg, hsl(18 80% 46%), hsl(25 88% 54%) 52%, hsl(36 94% 59%))`,
  };
};
