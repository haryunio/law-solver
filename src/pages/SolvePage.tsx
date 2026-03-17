import { useNavigate, useParams } from "react-router-dom";
import { CbtSolveScreen } from "../components/cbt/CbtSolveScreen";

export function SolvePage() {
  const navigate = useNavigate();
  const { sessionId = "" } = useParams();

  return (
    <CbtSolveScreen
      sessionId={sessionId}
      onSubmitted={(id) => {
        navigate(`/result/${id}`);
      }}
    />
  );
}

