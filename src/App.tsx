import { Navigate, Route, Routes } from "react-router-dom";
import { DashboardPage } from "./pages/DashboardPage";
import { ResultPage } from "./pages/ResultPage";
import { SolvePage } from "./pages/SolvePage";
import { WrongAnswersPage } from "./pages/WrongAnswersPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/solve/:sessionId" element={<SolvePage />} />
      <Route path="/result/:sessionId" element={<ResultPage />} />
      <Route path="/wrong/:sessionId" element={<WrongAnswersPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

