type CloudBackupComparisonMode = "upload" | "restore";

interface CloudBackupComparisonSnapshot {
  dataModifiedAt: string;
  questionCount: number;
}

interface CloudBackupComparisonInput {
  mode: CloudBackupComparisonMode;
  source: CloudBackupComparisonSnapshot;
  target: CloudBackupComparisonSnapshot;
}

export function getCloudBackupComparisonWarnings({
  mode,
  source,
  target,
}: CloudBackupComparisonInput) {
  const warnings: string[] = [];
  const sourceModifiedAt = Date.parse(source.dataModifiedAt);
  const targetModifiedAt = Date.parse(target.dataModifiedAt);

  if (
    Number.isFinite(sourceModifiedAt) &&
    Number.isFinite(targetModifiedAt) &&
    sourceModifiedAt < targetModifiedAt
  ) {
    warnings.push(
      mode === "upload"
        ? "경고: 백업하려는 문제 풀이 데이터의 마지막 수정 시각이 현재 클라우드 최신본보다 과거입니다. 계속하면 더 최신인 클라우드 데이터를 덮어씁니다."
        : "경고: 내려받으려는 문제 풀이 데이터의 마지막 수정 시각이 현재 브라우저 데이터보다 과거입니다. 계속하면 더 최신인 현재 브라우저 데이터를 교체합니다.",
    );
  }

  if (source.questionCount < target.questionCount) {
    warnings.push(
      mode === "upload"
        ? "경고: 백업하려는 문제 풀이 데이터의 문제 수가 현재 클라우드 최신본보다 적습니다. 계속하면 문제 수가 더 적은 데이터로 덮어씁니다."
        : "경고: 내려받으려는 문제 풀이 데이터의 문제 수가 현재 브라우저 데이터보다 적습니다. 계속하면 문제 수가 더 적은 데이터로 교체합니다.",
    );
  }

  return warnings;
}

export function CloudBackupComparisonWarnings({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) return null;

  return (
    <div
      role="alert"
      className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200"
    >
      <p className="text-xs font-bold">데이터 교체 전 확인해 주세요</p>
      <ul className="mt-2 space-y-1.5 text-xs leading-5">
        {warnings.map((warning) => <li key={warning}>{warning}</li>)}
      </ul>
    </div>
  );
}
