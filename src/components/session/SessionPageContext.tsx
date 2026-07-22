import { createContext, useContext, type ReactNode } from "react";
import type { SolveOrder, TestSession } from "../../types/test";

export type SessionRetryMode = "all" | "incorrect" | "bookmarked";

export interface SessionPageAdapter {
  session: TestSession;
  allowCsvDownload?: boolean;
  dashboardPath: string;
  solvePath: (sessionId: string) => string;
  resultPath: (sessionId: string) => string;
  wrongPath: (sessionId: string) => string;
  reviewPath: (sessionId: string) => string;
  createRetry: (input: {
    sourceSessionId: string;
    mode: SessionRetryMode;
    title: string;
    orderMode: SolveOrder;
  }) => Promise<string>;
  saveWrongNote?: (questionId: string, note: string) => Promise<void>;
}

const SessionPageContext = createContext<SessionPageAdapter | null>(null);

export function SessionPageProvider({
  adapter,
  children,
}: {
  adapter: SessionPageAdapter;
  children: ReactNode;
}) {
  return (
    <SessionPageContext.Provider value={adapter}>
      {children}
    </SessionPageContext.Provider>
  );
}

export const useSessionPageAdapter = () => useContext(SessionPageContext);
