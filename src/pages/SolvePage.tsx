import { useLocation, useNavigate, useParams } from "react-router-dom";
import { CbtSolveScreen } from "../components/cbt/CbtSolveScreen";
import { SolveEntry } from "../lib/analytics";

const solveEntries: SolveEntry[] = [
  "upload",
  "resume",
  "direct",
  "retry_all",
  "retry_wrong",
  "retry_bookmarked",
];

export function SolvePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { sessionId = "" } = useParams();
  const state = location.state as { solveEntry?: unknown } | null;
  const solveEntry = solveEntries.includes(state?.solveEntry as SolveEntry)
    ? (state?.solveEntry as SolveEntry)
    : "direct";

  return (
    <CbtSolveScreen
      sessionId={sessionId}
      solveEntry={solveEntry}
      onSubmitted={(id) => {
        navigate(`/result/${id}`);
      }}
    />
  );
}
